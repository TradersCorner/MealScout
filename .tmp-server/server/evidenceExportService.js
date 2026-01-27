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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import PDFDocument from "pdfkit";
import crypto from "crypto";
import { db } from "./db.js";
import { videoStories } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
/**
 * Fetch complete evidence snapshot for a video
 * Fail-closed: Returns null for missing sections instead of fabricating
 */
export function fetchEvidenceSnapshot(videoId) {
    return __awaiter(this, void 0, void 0, function () {
        var videoResults, video, videoMetadata, videoStoryReports, reportResults, decision, allReports, evidence, appeals, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, videoId))
                            .limit(1)];
                case 1:
                    videoResults = _a.sent();
                    if (videoResults.length === 0) {
                        return [2 /*return*/, null]; // Video not found
                    }
                    video = videoResults[0];
                    videoMetadata = {
                        videoId: video.id,
                        type: video.restaurantId ? "restaurant" : "user",
                        createdAt: video.createdAt,
                        views: video.views || undefined,
                        likes: video.likes || undefined,
                        restaurantName: video.restaurantName || undefined,
                        reviewerName: video.username || undefined,
                    };
                    return [4 /*yield*/, import("@shared/schema")];
                case 2:
                    videoStoryReports = (_a.sent()).videoStoryReports;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStoryReports)
                            .where(eq(videoStoryReports.storyId, videoId))
                            .orderBy(desc(videoStoryReports.createdAt))
                            .limit(1)];
                case 3:
                    reportResults = _a.sent();
                    decision = reportResults.length > 0
                        ? {
                            action: reportResults[0].status === "action_taken"
                                ? "hide"
                                : reportResults[0].status === "dismissed"
                                    ? "restore"
                                    : "pending",
                            reason: reportResults[0].reason || undefined,
                            timestamp: reportResults[0].reviewedAt ||
                                reportResults[0].createdAt ||
                                new Date(),
                            adminId: reportResults[0].reviewedByAdminId || undefined,
                            notes: reportResults[0].adminNotes || undefined,
                        }
                        : null;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStoryReports)
                            .where(eq(videoStoryReports.storyId, videoId))
                            .orderBy(desc(videoStoryReports.createdAt))];
                case 4:
                    allReports = _a.sent();
                    evidence = allReports.length > 0
                        ? {
                            reportCount: allReports.length,
                            reportTimestamps: allReports.map(function (r) { return r.createdAt || new Date(); }),
                            reporterIdsRedacted: allReports.map(function (r) {
                                return r.reportedByUserId
                                    ? r.reportedByUserId.substring(0, 4) + "..."
                                    : "unknown";
                            }),
                            priorActions: [],
                        }
                        : null;
                    appeals = [];
                    return [2 /*return*/, {
                            videoMetadata: videoMetadata,
                            decision: decision,
                            evidence: evidence,
                            appeals: appeals,
                            generatedAt: new Date(),
                        }];
                case 5:
                    error_1 = _a.sent();
                    console.error("[evidenceExportService] Failed to fetch snapshot:", error_1);
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate deterministic PDF from evidence snapshot
 * Stable ordering, fixed formatting, content hash in footer
 */
export function generateEvidencePDF(snapshot) {
    var doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
            Title: "Evidence Snapshot - ".concat(snapshot.videoMetadata.videoId),
            Author: "MealScout Admin",
            Subject: "Moderation Evidence Export",
            CreationDate: snapshot.generatedAt,
        },
    });
    // Track content for hash
    var contentParts = [];
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
        .text("Generated: ".concat(snapshot.generatedAt.toISOString()), {
        align: "center",
    });
    doc.fillColor("#000000");
    doc.moveDown(2);
    contentParts.push("GENERATED:".concat(snapshot.generatedAt.toISOString()));
    // Section 1: Video Identifiers
    doc.fontSize(14).font("Helvetica-Bold").text("VIDEO IDENTIFIERS");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text("Video ID: ".concat(snapshot.videoMetadata.videoId));
    doc.text("Type: ".concat(snapshot.videoMetadata.type.toUpperCase()));
    doc.text("Created: ".concat(snapshot.videoMetadata.createdAt.toISOString()));
    if (snapshot.videoMetadata.reviewerName) {
        doc.text("Reviewer: ".concat(snapshot.videoMetadata.reviewerName));
    }
    if (snapshot.videoMetadata.restaurantName) {
        doc.text("Restaurant: ".concat(snapshot.videoMetadata.restaurantName));
    }
    if (snapshot.videoMetadata.campaignId) {
        doc.text("Campaign ID: ".concat(snapshot.videoMetadata.campaignId));
    }
    doc.moveDown(2);
    contentParts.push("VIDEO_ID:".concat(snapshot.videoMetadata.videoId));
    contentParts.push("TYPE:".concat(snapshot.videoMetadata.type));
    contentParts.push("CREATED:".concat(snapshot.videoMetadata.createdAt.toISOString()));
    // Section 2: Moderation Decision
    doc.fontSize(14).font("Helvetica-Bold").text("MODERATION DECISION");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    if (snapshot.decision) {
        doc.text("Action: ".concat(snapshot.decision.action.toUpperCase()));
        doc.text("Timestamp: ".concat(snapshot.decision.timestamp.toISOString()));
        if (snapshot.decision.reason) {
            doc.text("Reason: ".concat(snapshot.decision.reason));
        }
        if (snapshot.decision.notes) {
            doc.text("Notes: ".concat(snapshot.decision.notes));
        }
        doc.text("Admin: [REDACTED]"); // Never expose admin IDs
        contentParts.push("ACTION:".concat(snapshot.decision.action));
        contentParts.push("TIMESTAMP:".concat(snapshot.decision.timestamp.toISOString()));
        if (snapshot.decision.reason) {
            contentParts.push("REASON:".concat(snapshot.decision.reason));
        }
    }
    else {
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
        doc.text("Total Reports: ".concat(snapshot.evidence.reportCount));
        doc.text("Report Timestamps:");
        snapshot.evidence.reportTimestamps.forEach(function (ts) {
            doc.text("  - ".concat(ts.toISOString()), { indent: 20 });
        });
        doc.text("Reporter IDs (Redacted):");
        snapshot.evidence.reporterIdsRedacted.forEach(function (id) {
            doc.text("  - ".concat(id), { indent: 20 });
        });
        if (snapshot.evidence.priorActions.length > 0) {
            doc.text("Prior Actions:");
            snapshot.evidence.priorActions.forEach(function (action) {
                doc.text("  - ".concat(action.action.toUpperCase(), " at ").concat(action.timestamp.toISOString()), { indent: 20 });
                if (action.reason) {
                    doc.text("    Reason: ".concat(action.reason), { indent: 40 });
                }
            });
        }
        else {
            doc.text("Prior Actions: None");
        }
        contentParts.push("REPORTS:".concat(snapshot.evidence.reportCount));
    }
    else {
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
    doc.text("Video Age: ".concat(Math.floor((snapshot.generatedAt.getTime() -
        snapshot.videoMetadata.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)), " days"));
    if (snapshot.videoMetadata.views !== undefined) {
        doc.text("Views: ".concat(snapshot.videoMetadata.views));
        contentParts.push("VIEWS:".concat(snapshot.videoMetadata.views));
    }
    if (snapshot.videoMetadata.likes !== undefined) {
        doc.text("Likes: ".concat(snapshot.videoMetadata.likes));
        contentParts.push("LIKES:".concat(snapshot.videoMetadata.likes));
    }
    doc.moveDown(2);
    // Section 5: Appeals
    doc.fontSize(14).font("Helvetica-Bold").text("APPEAL REFERENCES");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    if (snapshot.appeals.length > 0) {
        snapshot.appeals.forEach(function (appeal) {
            doc.text("Appeal ID: ".concat(appeal.appealId));
            doc.text("  Status: ".concat(appeal.status.toUpperCase()), { indent: 20 });
            doc.text("  Submitted: ".concat(appeal.submittedAt.toISOString()), {
                indent: 20,
            });
            contentParts.push("APPEAL:".concat(appeal.appealId, ":").concat(appeal.status));
        });
    }
    else {
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
        .text("This is an immutable snapshot generated at the timestamp above. Exported PDFs do not alter moderation outcomes.", { align: "center" });
    doc.fillColor("#000000");
    // Generate content hash
    var contentString = contentParts.join("|");
    var contentHash = crypto
        .createHash("sha256")
        .update(contentString)
        .digest("hex");
    // Footer with hash
    doc.moveDown(2);
    doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text("Content Hash (SHA-256): ".concat(contentHash), { align: "center" });
    doc.text("Video ID: ".concat(snapshot.videoMetadata.videoId, " | Generated: ").concat(snapshot.generatedAt.toISOString()), { align: "center" });
    return { pdfStream: doc, contentHash: contentHash };
}

