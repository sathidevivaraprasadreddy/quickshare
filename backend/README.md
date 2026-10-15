# QuickShare Backend API

Node.js + Express backend service for secure, ephemeral file sharing.

## Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MySQL (local XAMPP) / TiDB Serverless / Aiven (production)
- **Upload Engine:** Multer
- **Packaging:** Archiver (ZIP multi-file bundling)
- **Security:** Helmet, Express Rate Limiter, Crypto token generator
- **Scheduler:** Node-cron (automatic expired file deletion)
- **Testing:** Jest + Supertest

## Environment Variables (.env)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Local MySQL (XAMPP default)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quickshare_db

# Production Hosted Database (TiDB Serverless / Aiven MySQL)
# DATABASE_URL=mysql://<user>:<password>@<host>:4000/<database>?ssl={"rejectUnauthorized":true}

STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
MAX_FILES_COUNT=10
DEFAULT_EXPIRY_HOURS=24
CLEANUP_CRON_SCHEDULE=*/15 * * * *
```

## Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Run database migration (ensure MySQL is running in XAMPP)
npm run migrate

# 3. Run automated tests
npm test

# 4. Start backend server
npm run dev
```

## API Endpoints
- `GET /api/health` - Server & database health status.
- `POST /api/upload` - Upload up to 10 files (multipart/form-data with fields: `files`, `expiryHours`).
- `GET /api/session/:token` - Retrieve file listing & metadata for a share link.
- `GET /api/download/:token/:fileId` - Download a specific file.
- `GET /api/download-all/:token` - Download all files bundled in a `.zip` archive.
- `POST /api/revoke` - Revoke link and delete files immediately with `revokeToken`.
