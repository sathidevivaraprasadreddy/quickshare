import express from 'express';
import {
  createShareSession,
  getShareSession,
  downloadSingleFile,
  downloadAllFiles,
  revokeShareSession
} from '../controllers/shareController.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimiter.js';
import { testDbConnection } from '../config/db.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbStatus = await testDbConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Upload multiple files and create sharing session
router.post('/upload', uploadLimiter, upload.array('files'), createShareSession);

// Get sharing session details and file listing (public)
router.get('/session/:token', getShareSession);

// Download a single file
router.get('/download/:token/:fileId', downloadLimiter, downloadSingleFile);

// Download all files bundled as a ZIP
router.get('/download-all/:token', downloadLimiter, downloadAllFiles);

// Revoke a share session (requires revoke token)
router.post('/revoke', revokeShareSession);

export default router;
