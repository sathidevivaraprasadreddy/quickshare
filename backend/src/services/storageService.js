import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : DEFAULT_UPLOAD_DIR;

// Ensure upload directory exists for local driver
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class StorageService {
  constructor() {
    this.driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
    this.uploadDir = UPLOAD_DIR;
    this.s3Bucket = process.env.S3_BUCKET_NAME || 'quickshare-files';

    if (this.driver === 's3') {
      const endpoint = process.env.S3_ENDPOINT || undefined;
      const region = process.env.S3_REGION || 'auto';
      const accessKeyId = process.env.S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey) {
        console.warn('⚠️ S3 credentials missing. Falling back to local storage.');
        this.driver = 'local';
      } else {
        this.s3Client = new S3Client({
          region,
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey
          },
          forcePathStyle: true // Needed for Cloudflare R2 / MinIO / LocalStack
        });
        console.log(`[Storage] Initialized S3-compatible driver (Bucket: ${this.s3Bucket})`);
      }
    }
  }

  getUploadDir() {
    return this.uploadDir;
  }

  /**
   * Verify and resolve absolute path safely to prevent directory traversal in local driver.
   */
  resolveSafePath(storedName) {
    const sanitized = path.basename(storedName);
    const fullPath = path.resolve(this.uploadDir, sanitized);

    if (!fullPath.startsWith(this.uploadDir)) {
      throw new Error('Access denied: Invalid file path traversal attempt.');
    }
    return fullPath;
  }

  /**
   * Check if file exists
   */
  async fileExists(storedName) {
    if (this.driver === 's3') {
      try {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.s3Bucket,
            Key: storedName
          })
        );
        return true;
      } catch (err) {
        return false;
      }
    }

    try {
      const fullPath = this.resolveSafePath(storedName);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  /**
   * Upload file to remote storage (called during upload if driver is s3)
   */
  async persistUploadedFile(storedName, originalMimeType) {
    if (this.driver === 's3') {
      const fullPath = this.resolveSafePath(storedName);
      const fileStream = fs.createReadStream(fullPath);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: storedName,
          Body: fileStream,
          ContentType: originalMimeType || 'application/octet-stream'
        })
      );

      // Clean up local temp file after uploading to S3
      await fs.promises.unlink(fullPath).catch(() => {});
    }
  }

  /**
   * Get readable stream for downloading
   */
  async getFileStream(storedName) {
    if (this.driver === 's3') {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: storedName
      });
      const response = await this.s3Client.send(command);
      return response.Body; // Node stream
    }

    const fullPath = this.resolveSafePath(storedName);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found on storage.');
    }
    return fs.createReadStream(fullPath);
  }

  /**
   * Delete a single stored file
   */
  async deleteFile(storedName) {
    if (this.driver === 's3') {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.s3Bucket,
            Key: storedName
          })
        );
        return true;
      } catch (err) {
        console.error(`[S3 Delete Error] ${storedName}:`, err.message);
        return false;
      }
    }

    try {
      const fullPath = this.resolveSafePath(storedName);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error deleting file ${storedName}:`, err.message);
      return false;
    }
  }

  /**
   * Delete multiple stored files
   */
  async deleteFiles(storedNames) {
    if (storedNames.length === 0) return 0;

    if (this.driver === 's3') {
      try {
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.s3Bucket,
            Delete: {
              Objects: storedNames.map((Key) => ({ Key }))
            }
          })
        );
        return storedNames.length;
      } catch (err) {
        console.error('[S3 Batch Delete Error]:', err.message);
        return 0;
      }
    }

    const results = await Promise.all(
      storedNames.map((name) => this.deleteFile(name))
    );
    return results.filter(Boolean).length;
  }
}

export const storageService = new StorageService();
export default storageService;
