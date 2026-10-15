import path from 'path';
import archiver from 'archiver';
import mime from 'mime-types';
import { getDbPool } from '../config/db.js';
import storageService from '../services/storageService.js';
import {
  generateShareToken,
  generateRevokeToken,
  sanitizeFilename
} from '../utils/fileSecurity.js';

// Allowed expiration periods in hours
const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168]; // 1 hour, 6 hours, 24 hours (1 day), 3 days, 7 days
const DEFAULT_EXPIRY_HOURS = 24;

/**
 * Create a new sharing session with one or multiple files
 */
export async function createShareSession(req, res, next) {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please select at least one file to upload.'
    });
  }

  // Parse and validate expiry
  let expiryHours = parseInt(req.body.expiryHours, 10);
  if (!ALLOWED_EXPIRY_HOURS.includes(expiryHours)) {
    expiryHours = DEFAULT_EXPIRY_HOURS;
  }

  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  const shareToken = generateShareToken();
  const revokeToken = generateRevokeToken();

  let totalSizeBytes = 0;
  for (const f of files) {
    totalSizeBytes += f.size;
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert session record
    const [sessionResult] = await connection.query(
      `INSERT INTO share_sessions 
       (share_token, revoke_token, total_size_bytes, file_count, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [shareToken, revokeToken, totalSizeBytes, files.length, expiresAt]
    );

    const sessionId = sessionResult.insertId;

    // 2. Insert file records
    for (const f of files) {
      const originalName = f.sanitizedOriginalName || sanitizeFilename(f.originalname);
      const storedName = f.filename;
      const mimeType = f.mimetype || mime.lookup(originalName) || 'application/octet-stream';

      await connection.query(
        `INSERT INTO share_files
         (session_id, original_name, stored_name, file_path, file_size, mime_type, storage_driver)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          originalName,
          storedName,
          storedName, // relative safe name
          f.size,
          mimeType,
          storageService.driver
        ]
      );

      // Persist to remote S3 storage if configured
      await storageService.persistUploadedFile(storedName, mimeType);
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      shareToken,
      revokeToken,
      expiresAt: expiresAt.toISOString(),
      fileCount: files.length,
      totalSizeBytes
    });
  } catch (err) {
    await connection.rollback();
    // Clean up uploaded files on disk if DB insertion failed
    for (const f of files) {
      if (f.filename) {
        await storageService.deleteFile(f.filename);
      }
    }
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Get share session metadata and file list by share token
 */
export async function getShareSession(req, res, next) {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid share link.' });
    }

    const db = getDbPool();
    const [sessions] = await db.query(
      `SELECT id, share_token, total_size_bytes, file_count, expires_at, created_at, is_revoked, download_count
       FROM share_sessions
       WHERE share_token = ?`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'This sharing link does not exist or has already been deleted.'
      });
    }

    const session = sessions[0];

    // Check if session was revoked by owner
    if (session.is_revoked) {
      return res.status(410).json({
        success: false,
        isRevoked: true,
        error: 'This sharing session has been revoked by the owner.'
      });
    }

    // Check if session has expired
    const isExpired = new Date(session.expires_at) < new Date();
    if (isExpired) {
      return res.status(410).json({
        success: false,
        isExpired: true,
        error: 'This sharing link has expired.'
      });
    }

    // Get files for this session (never expose internal stored_name or file_path)
    const [files] = await db.query(
      `SELECT id, original_name, file_size, mime_type, created_at
       FROM share_files
       WHERE session_id = ?
       ORDER BY id ASC`,
      [session.id]
    );

    return res.json({
      success: true,
      session: {
        shareToken: session.share_token,
        totalSizeBytes: session.total_size_bytes,
        fileCount: session.file_count,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
        downloadCount: session.download_count
      },
      files: files.map((f) => ({
        id: f.id,
        name: f.original_name,
        size: f.file_size,
        mimeType: f.mime_type,
        createdAt: f.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Download a single file by file ID within a valid session
 */
export async function downloadSingleFile(req, res, next) {
  try {
    const { token, fileId } = req.params;
    const db = getDbPool();

    // 1. Verify session is active and valid
    const [sessions] = await db.query(
      `SELECT id, expires_at, is_revoked FROM share_sessions WHERE share_token = ?`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Sharing session not found.' });
    }

    const session = sessions[0];
    if (session.is_revoked) {
      return res.status(410).json({ success: false, error: 'Sharing session has been revoked.' });
    }
    if (new Date(session.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Sharing link has expired.' });
    }

    // 2. Fetch file record
    const [files] = await db.query(
      `SELECT id, original_name, stored_name, file_size, mime_type
       FROM share_files
       WHERE id = ? AND session_id = ?`,
      [fileId, session.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: 'Requested file not found in this session.' });
    }

    const file = files[0];

    // 3. Verify file exists on storage
    const exists = await storageService.fileExists(file.stored_name);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'File data is missing from storage.' });
    }

    // 4. Update download count asynchronously
    db.query(`UPDATE share_sessions SET download_count = download_count + 1 WHERE id = ?`, [session.id]).catch(() => {});

    // 5. Send file with safe content disposition
    const encodedFilename = encodeURIComponent(file.original_name);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.file_size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const readStream = await storageService.getFileStream(file.stored_name);
    readStream.on('error', (streamErr) => {
      console.error('File stream error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to stream file.' });
      }
    });

    readStream.pipe(res);
  } catch (err) {
    next(err);
  }
}

/**
 * Download all files in a session bundled into a zip archive
 */
export async function downloadAllFiles(req, res, next) {
  try {
    const { token } = req.params;
    const db = getDbPool();

    // Verify session
    const [sessions] = await db.query(
      `SELECT id, share_token, expires_at, is_revoked FROM share_sessions WHERE share_token = ?`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Sharing session not found.' });
    }

    const session = sessions[0];
    if (session.is_revoked) {
      return res.status(410).json({ success: false, error: 'Sharing session has been revoked.' });
    }
    if (new Date(session.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Sharing link has expired.' });
    }

    // Fetch all files
    const [files] = await db.query(
      `SELECT id, original_name, stored_name, file_size
       FROM share_files
       WHERE session_id = ?`,
      [session.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: 'No files found in this session.' });
    }

    // Update download count
    db.query(`UPDATE share_sessions SET download_count = download_count + 1 WHERE id = ?`, [session.id]).catch(() => {});

    const zipFilename = `QuickShare_${token.substring(0, 8)}.zip`;

    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const archive = archiver('zip', {
      zlib: { level: 5 } // balanced compression and speed
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to create zip bundle.' });
      }
    });

    archive.pipe(res);

    // Keep track of names to prevent duplicate zip entries
    const seenNames = new Map();

    for (const f of files) {
      const exists = await storageService.fileExists(f.stored_name);
      if (exists) {
        let entryName = f.original_name;
        if (seenNames.has(entryName)) {
          const count = seenNames.get(entryName) + 1;
          seenNames.set(entryName, count);
          const ext = path.extname(entryName);
          const base = path.basename(entryName, ext);
          entryName = `${base} (${count})${ext}`;
        } else {
          seenNames.set(entryName, 0);
        }

        const fileStream = await storageService.getFileStream(f.stored_name);
        archive.append(fileStream, { name: entryName });
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}

/**
 * Revoke/delete a share session early using the secret revokeToken
 */
export async function revokeShareSession(req, res, next) {
  try {
    const { shareToken, revokeToken } = req.body;
    if (!shareToken || !revokeToken) {
      return res.status(400).json({
        success: false,
        error: 'Both shareToken and revokeToken are required to revoke a session.'
      });
    }

    const db = getDbPool();

    // Verify tokens match
    const [sessions] = await db.query(
      `SELECT id, is_revoked FROM share_sessions WHERE share_token = ? AND revoke_token = ?`,
      [shareToken, revokeToken]
    );

    if (sessions.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Invalid authorization token or session does not exist.'
      });
    }

    const session = sessions[0];
    if (session.is_revoked) {
      return res.json({
        success: true,
        message: 'This sharing link was already revoked.'
      });
    }

    // Get files to delete from storage immediately
    const [files] = await db.query(
      `SELECT stored_name FROM share_files WHERE session_id = ?`,
      [session.id]
    );

    // Delete stored files
    const storedNames = files.map((f) => f.stored_name);
    await storageService.deleteFiles(storedNames);

    // Mark as revoked
    await db.query(
      `UPDATE share_sessions SET is_revoked = 1 WHERE id = ?`,
      [session.id]
    );

    return res.json({
      success: true,
      message: 'Sharing link has been revoked and files deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
