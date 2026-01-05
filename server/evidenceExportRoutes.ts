/**
 * Evidence Export Routes
 * 
 * GET /api/admin/export-evidence/:videoId
 * 
 * Generates deterministic PDF snapshot of moderation evidence.
 * Admin-only, single-item, read-only, immutable.
 */

import { Router } from 'express';
import { isAdmin } from './unifiedAuth';
import { fetchEvidenceSnapshot, generateEvidencePDF } from './evidenceExportService';
import { logAudit } from './auditLogger';

const router = Router();

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
router.get('/export-evidence/:videoId', isAdmin, async (req, res) => {
  const { videoId } = req.params;
  const adminId = (req as any).user?.id || 'unknown';

  try {
    // Fetch evidence snapshot
    const snapshot = await fetchEvidenceSnapshot(videoId);

    if (!snapshot) {
      return res.status(404).json({
        error: 'Video not found or evidence unavailable',
        videoId,
      });
    }

    // Generate PDF
    const { pdfStream, contentHash } = generateEvidencePDF(snapshot);

    // Log audit event
    await logAudit(
      adminId,
      'evidence_export',
      'video',
      videoId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
      {
        contentHash,
        generatedAt: snapshot.generatedAt.toISOString(),
      }
    );

    // Set response headers
    const filename = `evidence-${videoId}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Hash', contentHash);

    // Stream PDF
    pdfStream.pipe(res);
    pdfStream.end();
  } catch (error) {
    console.error('[evidenceExportRoutes] Export failed:', error);
    
    await logAudit(
      adminId,
      'evidence_export_failed',
      'video',
      videoId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );

    res.status(500).json({
      error: 'Failed to generate evidence export',
      videoId,
    });
  }
});

export default router;
