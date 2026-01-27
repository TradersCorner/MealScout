/**
 * Incident Management API Endpoints
 *
 * Provides full CRUD and lifecycle management for incidents.
 * All endpoints require admin authentication.
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
import { Router } from 'express';
import { db } from './db.js';
import { incidents, securityAuditLog } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { isAdmin } from './unifiedAuth.js';
import incidentManager, { verifyIncidentSignature } from './incidentManager.js';
import { logAudit } from './auditLogger.js';
var router = Router();
/**
 * GET /api/incidents
 * List all incidents with optional filtering
 */
router.get('/', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allIncidents, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .orderBy(desc(incidents.createdAt))
                        .limit(100)];
            case 1:
                allIncidents = _a.sent();
                res.json(allIncidents);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Failed to fetch incidents:', error_1);
                res.status(500).json({ error: 'Failed to fetch incidents' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/incidents/:id
 * Get a single incident by ID
 */
router.get('/:id', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var incident, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .where(eq(incidents.id, req.params.id))
                        .limit(1)];
            case 1:
                incident = (_a.sent())[0];
                if (!incident) {
                    return [2 /*return*/, res.status(404).json({ error: 'Incident not found' })];
                }
                res.json(incident);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Failed to fetch incident:', error_2);
                res.status(500).json({ error: 'Failed to fetch incident' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/incidents/:id/audit-logs
 * Get audit logs related to an incident
 */
router.get('/:id/audit-logs', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var logs, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(securityAuditLog)
                        .where(eq(securityAuditLog.resourceId, req.params.id))
                        .orderBy(desc(securityAuditLog.timestamp))];
            case 1:
                logs = _a.sent();
                res.json(logs);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Failed to fetch audit logs:', error_3);
                res.status(500).json({ error: 'Failed to fetch audit logs' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PATCH /api/incidents/:id/status
 * Update incident status (new → acknowledged → resolved → closed)
 */
router.patch('/:id/status', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, validStatuses, incident, userId, updated, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 10, , 11]);
                status_1 = req.body.status;
                validStatuses = ['new', 'acknowledged', 'resolved', 'closed'];
                if (!validStatuses.includes(status_1)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid status' })];
                }
                return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .where(eq(incidents.id, req.params.id))
                        .limit(1)];
            case 1:
                incident = (_b.sent())[0];
                if (!incident) {
                    return [2 /*return*/, res.status(404).json({ error: 'Incident not found' })];
                }
                userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'system';
                updated = void 0;
                if (!(status_1 === 'acknowledged' && incident.status === 'new')) return [3 /*break*/, 3];
                return [4 /*yield*/, incidentManager.acknowledgeIncident(req.params.id, userId)];
            case 2:
                updated = _b.sent();
                return [3 /*break*/, 8];
            case 3:
                if (!(status_1 === 'resolved' && incident.status === 'acknowledged')) return [3 /*break*/, 5];
                return [4 /*yield*/, incidentManager.resolveIncident(req.params.id, userId)];
            case 4:
                updated = _b.sent();
                return [3 /*break*/, 8];
            case 5:
                if (!(status_1 === 'closed' && incident.status === 'resolved')) return [3 /*break*/, 7];
                return [4 /*yield*/, incidentManager.closeIncident(req.params.id, userId)];
            case 6:
                updated = _b.sent();
                return [3 /*break*/, 8];
            case 7: return [2 /*return*/, res.status(400).json({ error: "Cannot transition from ".concat(incident.status, " to ").concat(status_1) })];
            case 8: 
            // Log the status change
            return [4 /*yield*/, logAudit(userId, "incident_".concat(status_1), 'incident', req.params.id, req.ip || 'unknown', req.get('user-agent') || 'unknown', { previousStatus: incident.status, newStatus: status_1 })];
            case 9:
                // Log the status change
                _b.sent();
                res.json(updated);
                return [3 /*break*/, 11];
            case 10:
                error_4 = _b.sent();
                console.error('Failed to update incident status:', error_4);
                res.status(500).json({ error: 'Failed to update incident status' });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/incidents/:id/report
 * Download incident report as markdown
 */
router.get('/:id/report', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var incident, auditLogs, report, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .where(eq(incidents.id, req.params.id))
                        .limit(1)];
            case 1:
                incident = (_a.sent())[0];
                if (!incident) {
                    return [2 /*return*/, res.status(404).json({ error: 'Incident not found' })];
                }
                return [4 /*yield*/, db
                        .select()
                        .from(securityAuditLog)
                        .where(eq(securityAuditLog.resourceId, req.params.id))];
            case 2:
                auditLogs = _a.sent();
                report = "# Incident Report: ".concat(incident.id, "\n\n## Overview\n- **ID**: ").concat(incident.id, "\n- **Rule**: ").concat(incident.ruleId, "\n- **Severity**: ").concat(incident.severity, "\n- **Status**: ").concat(incident.status, "\n- **Created**: ").concat(incident.createdAt ? incident.createdAt.toISOString() : 'Unknown', "\n- **Acknowledged**: ").concat(incident.acknowledgedAt ? incident.acknowledgedAt.toISOString() : 'Pending', "\n- **Resolved**: ").concat(incident.resolvedAt ? incident.resolvedAt.toISOString() : 'Pending', "\n\n## Metadata\n```json\n").concat(JSON.stringify(incident.metadata, null, 2), "\n```\n\n## Related Audit Logs\n").concat(auditLogs.map(function (log) { return "- [".concat(log.timestamp ? log.timestamp.toISOString() : 'Unknown', "] ").concat(log.action, " on ").concat(log.resourceType, ":").concat(log.resourceId); }).join('\n'), "\n\n---\nGenerated on ").concat(new Date().toISOString());
                res.set('Content-Type', 'text/markdown');
                res.set('Content-Disposition', "attachment; filename=\"incident-".concat(incident.id, ".md\""));
                res.send(report);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('Failed to generate report:', error_5);
                res.status(500).json({ error: 'Failed to generate report' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/incidents/:id/verify-signature
 * Verify the cryptographic signature of an incident
 */
router.get('/:id/verify-signature', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var incident, valid, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(incidents)
                        .where(eq(incidents.id, req.params.id))
                        .limit(1)];
            case 1:
                incident = (_a.sent())[0];
                if (!incident) {
                    return [2 /*return*/, res.status(404).json({ error: 'Incident not found' })];
                }
                valid = incident.signatureHash
                    ? verifyIncidentSignature(incident, incident.signatureHash)
                    : false;
                res.json({
                    valid: valid,
                    incidentId: incident.id,
                    signature: incident.signatureHash,
                    message: valid
                        ? '✅ Signature verified - no tampering detected'
                        : '❌ Signature invalid - incident may have been modified',
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Failed to verify signature:', error_6);
                res.status(500).json({ error: 'Failed to verify signature' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/cron/escalations
 * Run escalation checks (can be triggered manually or by cron)
 * Returns the number of escalated incidents
 */
router.post('/cron/escalations', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fromVercelCron, isLocalhost, isAdmin_1, escalatedCount, error_7;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                fromVercelCron = req.headers['x-vercel-cron'];
                isLocalhost = req.ip === '127.0.0.1' || req.ip === 'localhost';
                isAdmin_1 = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.includes('admin');
                if (!fromVercelCron && !isLocalhost && !isAdmin_1) {
                    return [2 /*return*/, res.status(403).json({ error: 'Unauthorized' })];
                }
                return [4 /*yield*/, incidentManager.checkEscalations()];
            case 1:
                escalatedCount = _c.sent();
                res.json({
                    success: true,
                    escalatedCount: escalatedCount,
                    timestamp: new Date().toISOString(),
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _c.sent();
                console.error('Failed to run escalations:', error_7);
                res.status(500).json({ error: 'Failed to run escalations' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/cron/auto-close
 * Run auto-close for low-severity incidents (can be triggered manually or by cron)
 * Returns the number of closed incidents
 */
router.post('/cron/auto-close', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fromVercelCron, isLocalhost, isAdmin_2, closedCount, error_8;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                fromVercelCron = req.headers['x-vercel-cron'];
                isLocalhost = req.ip === '127.0.0.1' || req.ip === 'localhost';
                isAdmin_2 = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.includes('admin');
                if (!fromVercelCron && !isLocalhost && !isAdmin_2) {
                    return [2 /*return*/, res.status(403).json({ error: 'Unauthorized' })];
                }
                return [4 /*yield*/, incidentManager.autoCloseLowSeverityIncidents()];
            case 1:
                closedCount = _c.sent();
                res.json({
                    success: true,
                    closedCount: closedCount,
                    timestamp: new Date().toISOString(),
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _c.sent();
                console.error('Failed to run auto-close:', error_8);
                res.status(500).json({ error: 'Failed to run auto-close' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
export default router;

