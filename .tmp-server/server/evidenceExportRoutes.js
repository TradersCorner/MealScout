/**
 * Evidence Export Routes
 *
 * GET /api/admin/export-evidence/:videoId
 *
 * Generates deterministic PDF snapshot of moderation evidence.
 * Admin-only, single-item, read-only, immutable.
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
import { isAdmin } from './unifiedAuth.js';
import { fetchEvidenceSnapshot, generateEvidencePDF } from './evidenceExportService.js';
import { logAudit } from './auditLogger.js';
var router = Router();
/**
 * GET /api/admin/export-evidence/:videoId
 *
 * Generates and streams a PDF evidence snapshot for a specific video.
 *
 * Response:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment; filename="evidence-{videoId}-{timestamp}.pdf"
 * - X-Content-Hash: SHA-256 hash of deterministic content
 *
 * Guards:
 * - Single-item only
 * - Admin authentication required
 * - Fail-closed on missing data
 * - No server-side persistence
 */
router.get('/export-evidence/:videoId', isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var videoId, adminId, snapshot, _a, pdfStream, contentHash, filename, error_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                videoId = req.params.videoId;
                adminId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || 'unknown';
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 6]);
                return [4 /*yield*/, fetchEvidenceSnapshot(videoId)];
            case 2:
                snapshot = _c.sent();
                if (!snapshot) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'Video not found or evidence unavailable',
                            videoId: videoId,
                        })];
                }
                _a = generateEvidencePDF(snapshot), pdfStream = _a.pdfStream, contentHash = _a.contentHash;
                // Log audit event
                return [4 /*yield*/, logAudit(adminId, 'evidence_export', 'video', videoId, req.ip || 'unknown', req.headers['user-agent'] || 'unknown', {
                        contentHash: contentHash,
                        generatedAt: snapshot.generatedAt.toISOString(),
                    })];
            case 3:
                // Log audit event
                _c.sent();
                filename = "evidence-".concat(videoId, "-").concat(Date.now(), ".pdf");
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                res.setHeader('X-Content-Hash', contentHash);
                // Stream PDF
                pdfStream.pipe(res);
                pdfStream.end();
                return [3 /*break*/, 6];
            case 4:
                error_1 = _c.sent();
                console.error('[evidenceExportRoutes] Export failed:', error_1);
                return [4 /*yield*/, logAudit(adminId, 'evidence_export_failed', 'video', videoId, req.ip || 'unknown', req.headers['user-agent'] || 'unknown', {
                        error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                    })];
            case 5:
                _c.sent();
                res.status(500).json({
                    error: 'Failed to generate evidence export',
                    videoId: videoId,
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
export default router;

