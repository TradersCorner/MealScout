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
import { createHmac } from "crypto";
import { db } from "./db.js";
import { incidents, oncallRotation } from "../shared/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import auditLogger, { logAudit } from "./auditLogger.js";
import { emailService, isEmailConfigured } from "./emailService.js";
import fs from "fs";
import path from "path";
// Environment variables for escalation timing
var ESCALATION_MINUTES = {
    initial: 0,
    noAcknowledgment: parseInt(process.env.INCIDENT_ESCALATION_NO_ACK_MINUTES || "15"),
    noResolution: parseInt(process.env.INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES || "120"),
    possibleBreach: parseInt(process.env.INCIDENT_ESCALATION_BREACH_MINUTES || "1440"), // 24 hours
    hardEscalation: parseInt(process.env.INCIDENT_ESCALATION_HARD_MINUTES || "4320"), // 72 hours
};
// Notification channels configuration
var NOTIFICATION_CONFIG = {
    // Email is a required channel for incidents in production.
    email: {
        enabled: isEmailConfigured(),
        recipients: (process.env.INCIDENT_EMAIL_RECIPIENTS || "")
            .split(",")
            .filter(Boolean),
    },
    slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    sms: {
        enabled: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
        recipients: (process.env.INCIDENT_SMS_RECIPIENTS || "")
            .split(",")
            .filter(Boolean),
    },
};
// Anomaly detection rules
export var ANOMALY_RULES = {
    PASSWORD_RESET_ABUSE: {
        id: "password_reset_abuse",
        name: "Excessive Password Reset Attempts",
        severity: "medium",
        threshold: { count: 3, windowMinutes: 60 },
        action: "flag_and_soft_lock",
    },
    FAILED_LOGIN_SPIKE: {
        id: "failed_login_spike",
        name: "Failed Login Spike",
        severity: "high",
        threshold: { count: 5, windowMinutes: 5 },
        action: "lock_and_alert",
    },
    MENU_EDIT_ABUSE: {
        id: "menu_edit_abuse",
        name: "Excessive Menu/Allergy Edits",
        severity: "medium",
        threshold: { count: 20, windowMinutes: 60 },
        action: "alert_moderator",
    },
    DEAL_PRICE_MANIPULATION: {
        id: "deal_price_manipulation",
        name: "Deal Price Manipulation",
        severity: "high",
        threshold: { count: 10, windowMinutes: 1440 }, // 24 hours
        action: "freeze_and_alert",
    },
    LOCATION_MISMATCH: {
        id: "location_mismatch",
        name: "Suspicious Location Change",
        severity: "high",
        threshold: { regionMismatch: true },
        action: "challenge_and_alert",
    },
    API_KEY_ANOMALY: {
        id: "api_key_anomaly",
        name: "API Key Usage from New Location",
        severity: "critical",
        threshold: { newCountry: true },
        action: "challenge_and_alert",
    },
};
// Create cryptographic signature for incident record
function signIncident(incidentData) {
    var secret = process.env.INCIDENT_SIGNATURE_SECRET ||
        "default-secret-change-in-production";
    var dataString = JSON.stringify(incidentData);
    return createHmac("sha256", secret).update(dataString).digest("hex");
}
// Verify incident signature
export function verifyIncidentSignature(incidentData, signature) {
    var computedSignature = signIncident(incidentData);
    return computedSignature === signature;
}
// Create new incident
export function createIncident(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var incidentData, signature, incident;
        var ruleId = _b.ruleId, severity = _b.severity, userId = _b.userId, metadata = _b.metadata;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    incidentData = {
                        ruleId: ruleId,
                        severity: severity,
                        userId: userId,
                        metadata: metadata,
                        createdAt: new Date(),
                    };
                    signature = signIncident(incidentData);
                    return [4 /*yield*/, db
                            .insert(incidents)
                            .values({
                            ruleId: ruleId,
                            severity: severity,
                            status: "new",
                            userId: userId,
                            metadata: metadata,
                            signatureHash: signature,
                        })
                            .returning()];
                case 1:
                    incident = (_c.sent())[0];
                    // Log incident creation
                    return [4 /*yield*/, logAudit("system", "incident_created", "incident", incident.id, "system", "internal", { ruleId: ruleId, severity: severity })];
                case 2:
                    // Log incident creation
                    _c.sent();
                    // Send notifications
                    return [4 /*yield*/, notifyIncident(incident, "created")];
                case 3:
                    // Send notifications
                    _c.sent();
                    return [2 /*return*/, incident];
            }
        });
    });
}
// Get current on-call person
export function getCurrentOnCall() {
    return __awaiter(this, void 0, void 0, function () {
        var now, rotations, rotation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    return [4 /*yield*/, db
                            .select()
                            .from(oncallRotation)
                            .where(and(lte(oncallRotation.startDate, now), gte(oncallRotation.endDate, now)))
                            .orderBy(desc(oncallRotation.isPrimary))
                            .limit(1)];
                case 1:
                    rotations = _a.sent();
                    rotation = rotations[0];
                    return [2 /*return*/, rotation
                            ? { userId: rotation.userId, isPrimary: rotation.isPrimary === true }
                            : null];
            }
        });
    });
}
// Send notifications via configured channels
function notifyIncident(incident, eventType) {
    return __awaiter(this, void 0, void 0, function () {
        var rule, message, error, error, subject, html, failures, _i, _a, recipient, ok, error, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    rule = Object.values(ANOMALY_RULES).find(function (r) { return r.id === incident.ruleId; });
                    message = "[".concat(incident.severity.toUpperCase(), "] ").concat((rule === null || rule === void 0 ? void 0 : rule.name) || "Incident", " - ").concat(eventType);
                    // Email notification
                    if (NOTIFICATION_CONFIG.email.recipients.length === 0) {
                        error = new Error("Incident email notification failed: INCIDENT_EMAIL_RECIPIENTS is not configured.");
                        auditLogger.error(error.message, { incidentId: incident.id, eventType: eventType });
                        throw error;
                    }
                    if (!NOTIFICATION_CONFIG.email.enabled) {
                        error = new Error("Incident email notification failed: email provider is not configured (BREVO_API_KEY missing or invalid).");
                        auditLogger.error(error.message, { incidentId: incident.id, eventType: eventType });
                        throw error;
                    }
                    if (!(NOTIFICATION_CONFIG.email.enabled &&
                        NOTIFICATION_CONFIG.email.recipients.length > 0)) return [3 /*break*/, 5];
                    subject = "[".concat(incident.severity.toUpperCase(), "] ").concat((rule === null || rule === void 0 ? void 0 : rule.name) || "Incident", " - ").concat(eventType);
                    html = "\n      <h2>MealScout Incident Notification</h2>\n      <p><strong>Event:</strong> ".concat(eventType, "</p>\n      <p><strong>Rule:</strong> ").concat((rule === null || rule === void 0 ? void 0 : rule.name) || incident.ruleId, "</p>\n      <p><strong>Severity:</strong> ").concat(incident.severity, "</p>\n      <p><strong>Incident ID:</strong> ").concat(incident.id, "</p>\n      <pre style=\"background:#f3f4f6;padding:12px;border-radius:4px;white-space:pre-wrap;word-break:break-word;\">\n").concat(JSON.stringify(incident.metadata || {}, null, 2), "\n      </pre>\n    ");
                    failures = [];
                    _i = 0, _a = NOTIFICATION_CONFIG.email.recipients;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    recipient = _a[_i];
                    return [4 /*yield*/, emailService.sendBasicEmail(recipient, subject, html)];
                case 2:
                    ok = _b.sent();
                    if (!ok) {
                        failures.push(recipient);
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (failures.length > 0) {
                        error = new Error("Incident email notification failed for recipients: ".concat(failures.join(", ")));
                        auditLogger.error(error.message, { incidentId: incident.id, eventType: eventType });
                        throw error;
                    }
                    auditLogger.info("Email notification sent", {
                        incidentId: incident.id,
                        eventType: eventType,
                    });
                    _b.label = 5;
                case 5:
                    if (!NOTIFICATION_CONFIG.slack.enabled) return [3 /*break*/, 9];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, fetch(NOTIFICATION_CONFIG.slack.webhookUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                text: message,
                                attachments: [
                                    {
                                        color: incident.severity === "critical" ? "danger" : "warning",
                                        fields: [
                                            { title: "Incident ID", value: incident.id, short: true },
                                            { title: "Severity", value: incident.severity, short: true },
                                            {
                                                title: "Rule",
                                                value: (rule === null || rule === void 0 ? void 0 : rule.name) || incident.ruleId,
                                                short: false,
                                            },
                                        ],
                                    },
                                ],
                            }),
                        })];
                case 7:
                    _b.sent();
                    auditLogger.info("Slack notification sent", {
                        incidentId: incident.id,
                        eventType: eventType,
                    });
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    auditLogger.error("Slack notification failed", {
                        error: error_1,
                        incidentId: incident.id,
                    });
                    return [3 /*break*/, 9];
                case 9:
                    // SMS notification (SEV1 only - critical)
                    if (NOTIFICATION_CONFIG.sms.enabled &&
                        incident.severity === "critical" &&
                        NOTIFICATION_CONFIG.sms.recipients.length > 0) {
                        // SMS notifications are currently not implemented. Do not log false success.
                        auditLogger.warn("SMS incident notification requested but Twilio integration is not implemented; no SMS was sent.", { incidentId: incident.id, eventType: eventType });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Acknowledge incident
export function acknowledgeIncident(incidentId, acknowledgedBy) {
    return __awaiter(this, void 0, void 0, function () {
        var incident;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .update(incidents)
                        .set({
                        status: "acknowledged",
                        acknowledgedAt: new Date(),
                        acknowledgedBy: acknowledgedBy,
                    })
                        .where(eq(incidents.id, incidentId))
                        .returning()];
                case 1:
                    incident = (_a.sent())[0];
                    return [4 /*yield*/, logAudit(acknowledgedBy, "incident_acknowledged", "incident", incidentId, "system", "internal", {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, notifyIncident(incident, "acknowledged")];
                case 3:
                    _a.sent();
                    return [2 /*return*/, incident];
            }
        });
    });
}
// Resolve incident
export function resolveIncident(incidentId, resolvedBy, resolutionNotes) {
    return __awaiter(this, void 0, void 0, function () {
        var incident;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .update(incidents)
                        .set({
                        status: "resolved",
                        resolvedAt: new Date(),
                        resolvedBy: resolvedBy,
                        metadata: { resolutionNotes: resolutionNotes },
                    })
                        .where(eq(incidents.id, incidentId))
                        .returning()];
                case 1:
                    incident = (_a.sent())[0];
                    return [4 /*yield*/, logAudit(resolvedBy, "incident_resolved", "incident", incidentId, "system", "internal", { resolutionNotes: resolutionNotes })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, incident];
            }
        });
    });
}
// Close incident and generate report
export function closeIncident(incidentId, closedBy) {
    return __awaiter(this, void 0, void 0, function () {
        var incident;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .update(incidents)
                        .set({
                        status: "closed",
                        closedAt: new Date(),
                        closedBy: closedBy,
                    })
                        .where(eq(incidents.id, incidentId))
                        .returning()];
                case 1:
                    incident = (_a.sent())[0];
                    return [4 /*yield*/, logAudit(closedBy, "incident_closed", "incident", incidentId, "system", "internal", {})];
                case 2:
                    _a.sent();
                    // Generate incident report
                    return [4 /*yield*/, generateIncidentReport(incident)];
                case 3:
                    // Generate incident report
                    _a.sent();
                    return [2 /*return*/, incident];
            }
        });
    });
}
// Generate incident report
function generateIncidentReport(incident) {
    return __awaiter(this, void 0, void 0, function () {
        var rule, timestamp, reportFilename, report, reportsDir, filePath, err_1;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    rule = Object.values(ANOMALY_RULES).find(function (r) { return r.id === incident.ruleId; });
                    timestamp = new Date().toISOString().split("T")[0];
                    reportFilename = "INCIDENT_REPORT_".concat(timestamp, "_").concat(incident.id, ".md");
                    report = "# Incident Report\n\n**Incident ID:** ".concat(incident.id, "\n**Rule:** ").concat((rule === null || rule === void 0 ? void 0 : rule.name) || incident.ruleId, "\n**Severity:** ").concat(incident.severity, "\n**Status:** ").concat(incident.status, "\n\n## Timeline\n- **Created:** ").concat(incident.createdAt, "\n- **Acknowledged:** ").concat(incident.acknowledgedAt || "N/A", " (by: ").concat(incident.acknowledgedBy || "N/A", ")\n- **Resolved:** ").concat(incident.resolvedAt || "N/A", " (by: ").concat(incident.resolvedBy || "N/A", ")\n- **Closed:** ").concat(incident.closedAt || "N/A", " (by: ").concat(incident.closedBy || "N/A", ")\n\n## Affected Resources\n- **User ID:** ").concat(incident.userId || "N/A", "\n- **Resource Type:** ").concat(((_a = incident.metadata) === null || _a === void 0 ? void 0 : _a.resourceType) || "N/A", "\n- **Resource ID:** ").concat(((_b = incident.metadata) === null || _b === void 0 ? void 0 : _b.resourceId) || "N/A", "\n\n## Actions Taken\n").concat(((_c = incident.metadata) === null || _c === void 0 ? void 0 : _c.resolutionNotes) || "No resolution notes provided", "\n\n## User Notifications\n").concat(((_d = incident.metadata) === null || _d === void 0 ? void 0 : _d.userNotifications) || "No user notifications sent", "\n\n## Retention & Purge\n- Purge/retention hold: ").concat(((_e = incident.metadata) === null || _e === void 0 ? void 0 : _e.retentionHold) ? "YES" : "NO", "\n\n## Signature\n- **Signature Hash:** ").concat(incident.signatureHash, "\n- **Verification:** ").concat(verifyIncidentSignature(incident, incident.signatureHash)
                        ? "VALID"
                        : "INVALID", "\n\n---\n*Generated: ").concat(new Date().toISOString(), "*\n");
                    auditLogger.info("Incident report generated", {
                        incidentId: incident.id,
                        filename: reportFilename,
                    });
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 4, , 5]);
                    reportsDir = path.join(process.cwd(), "audit_reports");
                    return [4 /*yield*/, fs.promises.mkdir(reportsDir, { recursive: true })];
                case 2:
                    _f.sent();
                    filePath = path.join(reportsDir, reportFilename);
                    return [4 /*yield*/, fs.promises.writeFile(filePath, report, "utf8")];
                case 3:
                    _f.sent();
                    auditLogger.info("Incident report saved", { filePath: filePath });
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _f.sent();
                    auditLogger.error("Failed to save incident report", { error: String(err_1) });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, report];
            }
        });
    });
}
// Check for escalation
export function checkEscalations() {
    return __awaiter(this, void 0, void 0, function () {
        var now, openIncidents, _i, openIncidents_1, incident, minutesOpen, acknowledgedIncidents, _a, acknowledgedIncidents_1, incident, minutesSinceAck;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = new Date();
                    return [4 /*yield*/, db
                            .select()
                            .from(incidents)
                            .where(eq(incidents.status, "new"))];
                case 1:
                    openIncidents = _b.sent();
                    _i = 0, openIncidents_1 = openIncidents;
                    _b.label = 2;
                case 2:
                    if (!(_i < openIncidents_1.length)) return [3 /*break*/, 5];
                    incident = openIncidents_1[_i];
                    if (!incident.createdAt)
                        return [3 /*break*/, 4]; // Skip if no created date
                    minutesOpen = (now.getTime() - incident.createdAt.getTime()) / (1000 * 60);
                    if (!(minutesOpen > ESCALATION_MINUTES.noAcknowledgment)) return [3 /*break*/, 4];
                    return [4 /*yield*/, notifyIncident(incident, "escalated")];
                case 3:
                    _b.sent();
                    auditLogger.warn("Incident escalated - no acknowledgment", {
                        incidentId: incident.id,
                        minutesOpen: minutesOpen,
                    });
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .where(eq(incidents.status, "acknowledged"))];
                case 6:
                    acknowledgedIncidents = _b.sent();
                    _a = 0, acknowledgedIncidents_1 = acknowledgedIncidents;
                    _b.label = 7;
                case 7:
                    if (!(_a < acknowledgedIncidents_1.length)) return [3 /*break*/, 10];
                    incident = acknowledgedIncidents_1[_a];
                    minutesSinceAck = (now.getTime() - new Date(incident.acknowledgedAt).getTime()) /
                        (1000 * 60);
                    if (!(minutesSinceAck > ESCALATION_MINUTES.noResolution)) return [3 /*break*/, 9];
                    return [4 /*yield*/, notifyIncident(incident, "escalated")];
                case 8:
                    _b.sent();
                    auditLogger.warn("Incident escalated - no resolution", {
                        incidentId: incident.id,
                        minutesSinceAck: minutesSinceAck,
                    });
                    _b.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Auto-close low severity incidents after 7 days
export function autoCloseLowSeverityIncidents() {
    return __awaiter(this, void 0, void 0, function () {
        var sevenDaysAgo, oldLowIncidents, _i, oldLowIncidents_1, incident;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, db
                            .select()
                            .from(incidents)
                            .where(and(eq(incidents.severity, "low"), eq(incidents.status, "resolved"), lte(incidents.resolvedAt, sevenDaysAgo)))];
                case 1:
                    oldLowIncidents = _a.sent();
                    _i = 0, oldLowIncidents_1 = oldLowIncidents;
                    _a.label = 2;
                case 2:
                    if (!(_i < oldLowIncidents_1.length)) return [3 /*break*/, 5];
                    incident = oldLowIncidents_1[_i];
                    return [4 /*yield*/, closeIncident(incident.id, "system")];
                case 3:
                    _a.sent();
                    auditLogger.info("Auto-closed low severity incident", {
                        incidentId: incident.id,
                    });
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export default {
    createIncident: createIncident,
    acknowledgeIncident: acknowledgeIncident,
    resolveIncident: resolveIncident,
    closeIncident: closeIncident,
    getCurrentOnCall: getCurrentOnCall,
    checkEscalations: checkEscalations,
    autoCloseLowSeverityIncidents: autoCloseLowSeverityIncidents,
    ANOMALY_RULES: ANOMALY_RULES,
    ESCALATION_MINUTES: ESCALATION_MINUTES,
};

