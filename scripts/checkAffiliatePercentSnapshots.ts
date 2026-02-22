import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { and, isNotNull, isNull, sql } from "drizzle-orm";

async function main() {
  const [closerMissing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        isNotNull(users.affiliateCloserUserId),
        isNull(users.affiliateCloserPercent),
      ),
    );

  const [bookerMissing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        isNotNull(users.affiliateBookerUserId),
        isNull(users.affiliateBookerPercent),
      ),
    );

  const [closerTotal] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(isNotNull(users.affiliateCloserUserId));

  const [bookerTotal] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(isNotNull(users.affiliateBookerUserId));

  console.log(
    JSON.stringify(
      {
        closer_total_attributed: Number(closerTotal?.count ?? 0),
        closer_missing_snapshot: Number(closerMissing?.count ?? 0),
        booker_total_attributed: Number(bookerTotal?.count ?? 0),
        booker_missing_snapshot: Number(bookerMissing?.count ?? 0),
      },
      null,
      2,
    ),
  );

  // Optional sanity check: report one example row if missing (helps debugging).
  if (Number(closerMissing?.count ?? 0) > 0) {
    const sample = await db
      .select({
        id: users.id,
        affiliateCloserUserId: users.affiliateCloserUserId,
        affiliateCloserPercent: users.affiliateCloserPercent,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.affiliateCloserUserId),
          isNull(users.affiliateCloserPercent),
        ),
      )
      .limit(5);
    console.log("closer_missing_sample", sample);
  }

  if (Number(bookerMissing?.count ?? 0) > 0) {
    const sample = await db
      .select({
        id: users.id,
        affiliateBookerUserId: users.affiliateBookerUserId,
        affiliateBookerPercent: users.affiliateBookerPercent,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.affiliateBookerUserId),
          isNull(users.affiliateBookerPercent),
        ),
      )
      .limit(5);
    console.log("booker_missing_sample", sample);
  }
}

main()
  .catch((err) => {
    console.error("checkAffiliatePercentSnapshots failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    // drizzle/neon can keep sockets open; force exit for scripts
    setTimeout(() => process.exit(0), 250).unref?.();
  });
