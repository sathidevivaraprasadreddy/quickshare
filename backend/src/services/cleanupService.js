import cron from 'node-cron';
import { getDbPool } from '../config/db.js';
import storageService from './storageService.js';

/**
 * Scan database for expired sessions, delete associated files from disk/storage,
 * and remove the expired sessions from the database.
 */
export async function cleanupExpiredFiles() {
  const db = getDbPool();
  try {
    // 1. Find all sessions that are expired (expires_at < NOW()) or marked revoked
    // and retrieve their stored file paths
    const [expiredFiles] = await db.query(
      `SELECT f.id AS file_id, f.stored_name, s.id AS session_id, s.share_token 
       FROM share_files f
       JOIN share_sessions s ON f.session_id = s.id
       WHERE s.expires_at < NOW() OR s.is_revoked = 1`
    );

    if (expiredFiles.length === 0) {
      return { cleanedFilesCount: 0, cleanedSessionsCount: 0 };
    }

    // 2. Delete physical files from storage
    const storedNames = expiredFiles.map((f) => f.stored_name);
    await storageService.deleteFiles(storedNames);

    // 3. Delete expired sessions from database (CASCADE deletes file records)
    const sessionIds = [...new Set(expiredFiles.map((f) => f.session_id))];
    const placeholders = sessionIds.map(() => '?').join(',');

    const [deleteResult] = await db.query(
      `DELETE FROM share_sessions WHERE id IN (${placeholders})`,
      sessionIds
    );

    console.log(
      `[Cleanup] Removed ${deleteResult.affectedRows} expired session(s) and ${storedNames.length} file(s).`
    );

    return {
      cleanedFilesCount: storedNames.length,
      cleanedSessionsCount: deleteResult.affectedRows
    };
  } catch (err) {
    console.error('[Cleanup] Error during expired files cleanup:', err.message);
    return { error: err.message };
  }
}

/**
 * Start the background cron job for automatic cleanup.
 */
export function startCleanupJob() {
  const schedule = process.env.CLEANUP_CRON_SCHEDULE || '*/15 * * * *';
  console.log(`[Cleanup] Background cleaner scheduled with pattern: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log('[Cleanup] Running scheduled expired files cleaner...');
    await cleanupExpiredFiles();
  });

  // Also run once shortly after server boot to clean anything that expired while offline
  setTimeout(() => {
    cleanupExpiredFiles().catch((err) =>
      console.error('[Cleanup] Initial startup cleanup error:', err.message)
    );
  }, 5000);
}
