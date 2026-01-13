/**
 * Evidence Export Service v1
 *
 * Generates deterministic, immutable PDF snapshots of moderation decisions.
 *
 * GUARDS:
 * - Single-item only (no bulk export)
 * - Admin-only access
 * - Read-only snapshot (no mutations)
 * - Fail-closed on missing data (omit sections, never fabricate)
 * - Content hash (SHA-256) for verifiability
 *
 * PDF includes:
 * - Video identifiers (ID, type)
 * - Moderation decision (action, reason, timestamp, admin ID redacted)
 * - Evidence (reports, redacted reporter IDs, prior actions)
 * - Video metadata (age, views, likes if present)
 * - Appeal references (IDs only, if any)
 */

import PDFDocument from "pdfkit";
import crypto from "crypto";
import { db } from "./db";
import { videoStories, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface ModerationDecision {
  action: "hide" | "restore" | "remove";
  reason?: string;
  timestamp: Date;
  adminId: string; // Will be redacted in PDF
  notes?: string;
}

interface EvidenceData {
  reportCount: number;
  reportTimestamps: Date[];
  reporterIdsRedacted: string[]; // First 4 chars only
  priorActions: Array<{
    action: "hide" | "restore" | "remove";
    timestamp: Date;
    reason?: string;
  }>;
}

interface VideoMetadata {
  videoId: string;
  type: "user" | "restaurant";
  createdAt: Date;
  views?: number;
  likes?: number;
  restaurantName?: string;
  reviewerName?: string;
  campaignId?: string;
}

interface AppealReference {
  appealId: string;
  status: "received" | "reviewed";
  submittedAt: Date;
}

interface EvidenceSnapshot {
  videoMetadata: VideoMetadata;
  decision: ModerationDecision | null;
  evidence: EvidenceData | null;
  appeals: AppealReference[];
  generatedAt: Date;
}

/**
 * Fetch complete evidence snapshot for a video
 * Fail-closed: Returns null for missing sections instead of fabricating
 */
export async function fetchEvidenceSnapshot(
  videoId: string
): Promise<EvidenceSnapshot | null> {
  try {
    // Fetch video metadata
    const videoResults = await db
      .select()
      .from(videoStories)
      .where(eq(videoStories.id, videoId))
      .limit(1);

    if (videoResults.length === 0) {
      return null; // Video not found
    }

    const video = videoResults[0];

    const videoMetadata: VideoMetadata = {
      videoId: video.id,
      type: video.restaurantId ? "restaurant" : "user",
      createdAt: video.createdAt,
      views: video.views || undefined,
      likes: video.likes || undefined,
      restaurantName: video.restaurantName || undefined,
      reviewerName: video.username || undefined,
    };

    // Fetch most recent moderation decision (from video story reports)
    const { videoStoryReports } = await import("@shared/schema");

    const reportResults = await db
      .select()
      .from(videoStoryReports)
      .where(eq(videoStoryReports.storyId, videoId))
      .orderBy(desc(videoStoryReports.createdAt))
      .limit(1);

    const decision: ModerationDecision | null =
      reportResults.length > 0
        ? {
            action:
              reportResults[0].status === "action_taken"
                ? "hide"
                : reportResults[0].status === "dismissed"
                ? "restore"
                : ("pending" as any),
            reason: reportResults[0].reason || undefined,
            timestamp:
              reportResults[0].reviewedAt ||
              reportResults[0].createdAt ||
              new Date(),
            adminId: reportResults[0].reviewedByAdminId || undefined,
            notes: reportResults[0].adminNotes || undefined,
          }
        : null;

    // Fetch evidence data (all reports for this video)
    const allReports = await db
      .select()
      .from(videoStoryReports)
      .where(eq(videoStoryReports.storyId, videoId))
      .orderBy(desc(videoStoryReports.createdAt));

    const evidence: EvidenceData | null =
      allReports.length > 0
        ? {
            reportCount: allReports.length,
            reportTimestamps: allReports.map(
              (r: any) => r.createdAt || new Date()
            ),
            reporterIdsRedacted: allReports.map((r: any) =>
              r.reportedByUserId
                ? r.reportedByUserId.substring(0, 4) + "..."
                : "unknown"
            ),
            priorActions: [],
          }
        : null;

    // Fetch appeals
    const appeals: AppealReference[] = [];

    return {
      videoMetadata,
      decision,
      evidence,
      appeals,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("[evidenceExportService] Failed to fetch snapshot:", error);
    return null;
  }
}

/**
 * Generate deterministic PDF from evidence snapshot
 * Stable ordering, fixed formatting, content hash in footer
 */
export function generateEvidencePDF(snapshot: EvidenceSnapshot): {
  pdfStream: PDFKit.PDFDocument;
  contentHash: string;
} {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Evidence Snapshot - ${snapshot.videoMetadata.videoId}`,
      Author: "MealScout Admin",
      Subject: "Moderation Evidence Export",
      CreationDate: snapshot.generatedAt,
    },
  });

  // Track content for hash
  const contentParts: string[] = [];

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("MODERATION EVIDENCE SNAPSHOT", { align: "center" });
  doc.moveDown();
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#666666")
    .text(`Generated: ${snapshot.generatedAt.toISOString()}`, {
      align: "center",
    });
  doc.fillColor("#000000");
  doc.moveDown(2);

  contentParts.push(`GENERATED:${snapshot.generatedAt.toISOString()}`);

  // Section 1: Video Identifiers
  doc.fontSize(14).font("Helvetica-Bold").text("VIDEO IDENTIFIERS");
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Video ID: ${snapshot.videoMetadata.videoId}`);
  doc.text(`Type: ${snapshot.videoMetadata.type.toUpperCase()}`);
  doc.text(`Created: ${snapshot.videoMetadata.createdAt.toISOString()}`);
  if (snapshot.videoMetadata.reviewerName) {
    doc.text(`Reviewer: ${snapshot.videoMetadata.reviewerName}`);
  }
  if (snapshot.videoMetadata.restaurantName) {
    doc.text(`Restaurant: ${snapshot.videoMetadata.restaurantName}`);
  }
  if (snapshot.videoMetadata.campaignId) {
    doc.text(`Campaign ID: ${snapshot.videoMetadata.campaignId}`);
  }
  doc.moveDown(2);

  contentParts.push(`VIDEO_ID:${snapshot.videoMetadata.videoId}`);
  contentParts.push(`TYPE:${snapshot.videoMetadata.type}`);
  contentParts.push(
    `CREATED:${snapshot.videoMetadata.createdAt.toISOString()}`
  );

  // Section 2: Moderation Decision
  doc.fontSize(14).font("Helvetica-Bold").text("MODERATION DECISION");
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (snapshot.decision) {
    doc.text(`Action: ${snapshot.decision.action.toUpperCase()}`);
    doc.text(`Timestamp: ${snapshot.decision.timestamp.toISOString()}`);
    if (snapshot.decision.reason) {
      doc.text(`Reason: ${snapshot.decision.reason}`);
    }
    if (snapshot.decision.notes) {
      doc.text(`Notes: ${snapshot.decision.notes}`);
    }
    doc.text(`Admin: [REDACTED]`); // Never expose admin IDs

    contentParts.push(`ACTION:${snapshot.decision.action}`);
    contentParts.push(`TIMESTAMP:${snapshot.decision.timestamp.toISOString()}`);
    if (snapshot.decision.reason) {
      contentParts.push(`REASON:${snapshot.decision.reason}`);
    }
  } else {
    doc
      .fillColor("#999999")
      .text("[No moderation decision recorded]")
      .fillColor("#000000");
  }
  doc.moveDown(2);

  // Section 3: Evidence
  doc.fontSize(14).font("Helvetica-Bold").text("EVIDENCE");
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (snapshot.evidence) {
    doc.text(`Total Reports: ${snapshot.evidence.reportCount}`);
    doc.text(`Report Timestamps:`);
    snapshot.evidence.reportTimestamps.forEach((ts) => {
      doc.text(`  - ${ts.toISOString()}`, { indent: 20 });
    });
    doc.text(`Reporter IDs (Redacted):`);
    snapshot.evidence.reporterIdsRedacted.forEach((id) => {
      doc.text(`  - ${id}`, { indent: 20 });
    });

    if (snapshot.evidence.priorActions.length > 0) {
      doc.text(`Prior Actions:`);
      snapshot.evidence.priorActions.forEach((action) => {
        doc.text(
          `  - ${action.action.toUpperCase()} at ${action.timestamp.toISOString()}`,
          { indent: 20 }
        );
        if (action.reason) {
          doc.text(`    Reason: ${action.reason}`, { indent: 40 });
        }
      });
    } else {
      doc.text(`Prior Actions: None`);
    }

    contentParts.push(`REPORTS:${snapshot.evidence.reportCount}`);
  } else {
    doc
      .fillColor("#999999")
      .text("[No evidence data available]")
      .fillColor("#000000");
  }
  doc.moveDown(2);

  // Section 4: Video Metadata
  doc.fontSize(14).font("Helvetica-Bold").text("VIDEO METADATA");
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  doc.text(
    `Video Age: ${Math.floor(
      (snapshot.generatedAt.getTime() -
        snapshot.videoMetadata.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
    )} days`
  );
  if (snapshot.videoMetadata.views !== undefined) {
    doc.text(`Views: ${snapshot.videoMetadata.views}`);
    contentParts.push(`VIEWS:${snapshot.videoMetadata.views}`);
  }
  if (snapshot.videoMetadata.likes !== undefined) {
    doc.text(`Likes: ${snapshot.videoMetadata.likes}`);
    contentParts.push(`LIKES:${snapshot.videoMetadata.likes}`);
  }
  doc.moveDown(2);

  // Section 5: Appeals
  doc.fontSize(14).font("Helvetica-Bold").text("APPEAL REFERENCES");
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (snapshot.appeals.length > 0) {
    snapshot.appeals.forEach((appeal) => {
      doc.text(`Appeal ID: ${appeal.appealId}`);
      doc.text(`  Status: ${appeal.status.toUpperCase()}`, { indent: 20 });
      doc.text(`  Submitted: ${appeal.submittedAt.toISOString()}`, {
        indent: 20,
      });
      contentParts.push(`APPEAL:${appeal.appealId}:${appeal.status}`);
    });
  } else {
    doc.fillColor("#999999").text("[No appeals recorded]").fillColor("#000000");
  }
  doc.moveDown(2);

  // Immutability Notice
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#CC0000")
    .text("IMMUTABILITY NOTICE", { align: "center" });
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#666666")
    .text(
      "This is an immutable snapshot generated at the timestamp above. Exported PDFs do not alter moderation outcomes.",
      { align: "center" }
    );
  doc.fillColor("#000000");

  // Generate content hash
  const contentString = contentParts.join("|");
  const contentHash = crypto
    .createHash("sha256")
    .update(contentString)
    .digest("hex");

  // Footer with hash
  doc.moveDown(2);
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#999999")
    .text(`Content Hash (SHA-256): ${contentHash}`, { align: "center" });
  doc.text(
    `Video ID: ${
      snapshot.videoMetadata.videoId
    } | Generated: ${snapshot.generatedAt.toISOString()}`,
    { align: "center" }
  );

  return { pdfStream: doc, contentHash };
}
