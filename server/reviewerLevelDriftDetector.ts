import { and, eq, isNotNull, sql } from "drizzle-orm";

export type Logger = {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
};

export type DriftDetectorOptions = {
  limit?: number;
  includeZeroCases?: boolean;

  // NEW: severity escalator threshold (mismatchesFound >= threshold => error log)
  severityThreshold?: number;

  // NEW: transition markers (in-process only; resets on server restart)
  enableDriftStartedMarker?: boolean;
  enableDriftResolvedMarker?: boolean;
};

export type SchemaRefs = {
  videoStories: any;
  userReviewerLevels: any;
};

// In-process memory for one-shot transition markers.
// NOTE: resets when the node process restarts (no schema changes required).
let lastHadDrift: boolean | null = null;

export async function detectReviewerLevelDrift(
  db: any,
  logger: Logger,
  schema: SchemaRefs,
  opts: DriftDetectorOptions = {}
): Promise<{
  scannedUsersWithRecs: number;
  mismatchesFound: number;
  mismatchesLogged: number;
  missingRowsFound: number;
  valueMismatchesFound: number;
  limited: boolean;
}> {
  const limit = typeof opts.limit === "number" && opts.limit > 0 ? Math.floor(opts.limit) : 200;
  const includeZeroCases = Boolean(opts.includeZeroCases);

  const severityThreshold =
    typeof opts.severityThreshold === "number" && opts.severityThreshold >= 0
      ? Math.floor(opts.severityThreshold)
      : 50;

  const enableDriftStartedMarker =
    opts.enableDriftStartedMarker === undefined ? true : Boolean(opts.enableDriftStartedMarker);
  const enableDriftResolvedMarker =
    opts.enableDriftResolvedMarker === undefined ? true : Boolean(opts.enableDriftResolvedMarker);

  const { videoStories, userReviewerLevels } = schema;

  // Durable distinct restaurant recommendations per user (no status filter).
  const recCounts = db
    .select({
      userId: videoStories.userId,
      distinctRestaurants: sql<number>`count(distinct ${videoStories.restaurantId})`.mapWith(Number),
    })
    .from(videoStories)
    .where(isNotNull(videoStories.restaurantId))
    .groupBy(videoStories.userId)
    .as("recCounts");

  // How many users have >=1 restaurant-tagged story (reporting only)
  const scanned = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(recCounts);

  // Limited per-user mismatch rows for detailed logging (limit + 1 to detect truncation)
  const mismatchRows = await db
    .select({
      userId: recCounts.userId,
      distinctRestaurants: recCounts.distinctRestaurants,
      storedTotalStories: sql<number>`coalesce(${userReviewerLevels.totalStories}, -1)`.mapWith(Number),
      hasLevelRow: sql<boolean>`(${userReviewerLevels.userId} is not null)`.mapWith(Boolean),
    })
    .from(recCounts)
    .leftJoin(userReviewerLevels, eq(userReviewerLevels.userId, recCounts.userId))
    .where(sql`coalesce(${userReviewerLevels.totalStories}, -1) <> ${recCounts.distinctRestaurants}`)
    .orderBy(sql`${recCounts.distinctRestaurants} desc`)
    .limit(limit + 1);

  const limited = mismatchRows.length > limit;
  const rowsToLog = limited ? mismatchRows.slice(0, limit) : mismatchRows;

  // Uncapped totals query for alerting/dashboards
  const totals = await db
    .select({
      mismatchesFound: sql<number>`count(*)`.mapWith(Number),
      missingRowsFound: sql<number>`sum(case when ${userReviewerLevels.userId} is null then 1 else 0 end)`.mapWith(
        Number
      ),
      valueMismatchesFound: sql<number>`sum(case when ${userReviewerLevels.userId} is not null then 1 else 0 end)`.mapWith(
        Number
      ),
    })
    .from(recCounts)
    .leftJoin(userReviewerLevels, eq(userReviewerLevels.userId, recCounts.userId))
    .where(sql`coalesce(${userReviewerLevels.totalStories}, -1) <> ${recCounts.distinctRestaurants}`);

  const mismatchesFound = totals?.[0]?.mismatchesFound ?? 0;
  const missingRowsFound = totals?.[0]?.missingRowsFound ?? 0;
  const valueMismatchesFound = totals?.[0]?.valueMismatchesFound ?? 0;

  // Detailed per-user logs (diagnostics)
  for (const row of rowsToLog) {
    if (!row.hasLevelRow || row.storedTotalStories === -1) {
      logger.warn("ReviewerLevel drift: missing userReviewerLevels row", {
        alertKey: "reviewerLevelDrift",
        userId: row.userId,
        durableDistinctRestaurants: row.distinctRestaurants,
        storedTotalStories: null,
      });
    } else {
      logger.warn("ReviewerLevel drift: totalStories mismatch", {
        alertKey: "reviewerLevelDrift",
        userId: row.userId,
        durableDistinctRestaurants: row.distinctRestaurants,
        storedTotalStories: row.storedTotalStories,
        delta: row.distinctRestaurants - row.storedTotalStories,
      });
    }
  }

  const summary = {
    scannedUsersWithRecs: scanned?.[0]?.n ?? 0,
    mismatchesFound,
    mismatchesLogged: rowsToLog.length,
    missingRowsFound,
    valueMismatchesFound,
    limited,
    limit,
    severityThreshold,
    alertKey: "reviewerLevelDrift",
  };

  const hasDriftNow = mismatchesFound > 0 || limited;

  // Transition markers (one-shot per process)
  if (enableDriftStartedMarker && lastHadDrift === false && hasDriftNow) {
    logger.error("ReviewerLevel drift: DRIFT STARTED", {
      ...summary,
      metricKey: "reviewerLevelDrift.started",
    });
  }
  if (enableDriftResolvedMarker && lastHadDrift === true && !hasDriftNow) {
    logger.info("ReviewerLevel drift: DRIFT RESOLVED", {
      ...summary,
      metricKey: "reviewerLevelDrift.resolved",
    });
  }
  lastHadDrift = hasDriftNow;

  // Summary line (alert routing should key off this)
  if (hasDriftNow) {
    logger.warn("ReviewerLevel drift: SUMMARY", {
      ...summary,
      metricKey: "reviewerLevelDrift.summary_with_drift",
    });
  } else {
    logger.info("ReviewerLevel drift: SUMMARY", summary);
  }

  // Severity escalator (strong signal)
  if (mismatchesFound >= severityThreshold) {
    logger.error("ReviewerLevel drift: SEVERE", {
      ...summary,
      metricKey: "reviewerLevelDrift.severe",
    });
  }

  if (limited) {
    logger.warn("ReviewerLevel drift: mismatch log limit reached", {
      limit,
      mismatchesFound,
      note: "Increase limit temporarily if diagnosing a large drift event.",
    });
  }

  // Optional diagnostic-only noise check
  if (includeZeroCases) {
    const zeroCases = await db
      .select({
        userId: userReviewerLevels.userId,
        storedTotalStories: userReviewerLevels.totalStories,
      })
      .from(userReviewerLevels)
      .where(
        and(
          sql`not exists (select 1 from ${videoStories} vs where vs.${videoStories.userId.name} = ${userReviewerLevels.userId} and vs.${videoStories.restaurantId.name} is not null)`,
          sql`${userReviewerLevels.totalStories} <> 0`
        )
      )
      .limit(limit);

    for (const row of zeroCases) {
      logger.warn("ReviewerLevel drift: level row exists but no restaurant-tagged stories found", {
        alertKey: "reviewerLevelDrift",
        userId: row.userId,
        storedTotalStories: row.storedTotalStories,
        durableDistinctRestaurants: 0,
      });
    }
  }

  return {
    scannedUsersWithRecs: scanned?.[0]?.n ?? 0,
    mismatchesFound,
    mismatchesLogged: rowsToLog.length,
    missingRowsFound,
    valueMismatchesFound,
    limited,
  };
}
