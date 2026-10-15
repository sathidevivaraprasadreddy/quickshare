# QuickShare 🚀
> Fast, secure, and ephemeral file sharing inspired by Send Anywhere — built with React, Node.js, Express, and MySQL, with **₹0 zero-cost deployment**.

---

## 📋 Table of Contents
1. [Overview & Features](#-overview--features)
2. [Technology Stack](#-technology-stack)
3. [Zero-Cost (₹0) Production Architecture & Provider Limits](#-zero-cost-0-production-architecture--provider-limits)
4. [Project Structure](#-project-structure)
5. [Local Development (XAMPP MySQL)](#-local-development-xampp-mysql)
6. [Multi-Device & Mobile Testing](#-multi-device--mobile-testing)
7. [Automated Testing](#-automated-testing)
8. [Step-by-Step Free Deployment Guide](#-step-by-step-free-deployment-guide)
9. [Security & Protection Mechanisms](#-security--protection-mechanisms)

---

## 🌟 Overview & Features

QuickShare allows users to transfer one or multiple files instantly between any devices (Android, iPhone, laptops, tablets, and desktops) with zero sign-up, zero friction, and full ephemeral protection:

1. **Multi-File Selection & Drag-and-Drop:** Select or drop single or multiple files with live size calculation.
2. **Real-Time Upload Progress:** Visual animated progress bar reflecting byte transfer.
3. **Unpredictable Cryptographic Tokens:** Generates high-entropy 128-bit download tokens (`crypto.randomBytes`).
4. **Owner Management & Revocation:** Provides a secret 192-bit revocation key so uploaders can terminate the link and permanently purge files immediately.
5. **Configurable Expiry & Auto-Cleanup:** Links expire after 1h, 6h, 24h, 3d, or 7d. A background cleaner scheduled task automatically shreds expired files.
6. **Instant Mobile QR Code:** Generates a high-contrast QR code for instant camera scanning on phones and tablets.
7. **Single File or Bundled ZIP Download:** Recipients can download individual files or stream all files bundled in an on-the-fly compressed `.zip` archive.
8. **Responsive Minimalist Design:** Send Anywhere-inspired clean aesthetic built with Tailwind CSS.

---

## 💻 Technology Stack

| Layer | Local Development | ₹0 Production Deployment |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | Vercel (Edge CDN, free `*.vercel.app`) |
| **Backend** | Node.js (ESM) + Express | Render Free Tier (`*.onrender.com`) |
| **Database** | MySQL (XAMPP on localhost:3306) | TiDB Serverless (5GB free MySQL compatible) |
| **Storage** | Local Filesystem (`backend/uploads`) | Cloudflare R2 / Supabase Storage (10GB S3-compatible) |
| **Security** | Helmet, Express Rate Limit, Crypto | CORS restrictions, Path traversal guards, Nosniff |

---

## 💰 Zero-Cost (₹0) Production Architecture & Provider Limits

Before choosing these services, their official documentation and free tier policies were verified to ensure no credit cards or surprise charges:

### 1. Database: TiDB Serverless (MySQL Compatible)
- **Free Tier Allowance:** 5 GB storage + 50 million Request Units (RUs) per month forever.
- **Protocol:** 100% MySQL wire compatible. Works directly with `mysql2` without code changes.
- **Cost:** ₹0 ($0/mo), no credit card required to start.
- **Provider Subdomain:** Dedicated secure gateway endpoint (`gateway01.us-west-2.prod.aws.tidbcloud.com`).

### 2. Persistent Storage: Cloudflare R2
- **Free Tier Allowance:** 10 GB persistent storage per month.
- **Bandwidth/Egress:** **$0 (Zero egress fees)**. Downloading files does not consume billable bandwidth.
- **Operations:** 1,000,000 Class A operations (uploads/puts) + 10,000,000 Class B operations (gets/reads) per month free.
- **API:** Standard S3-compatible API supported via our built-in storage adapter.

### 3. Backend Hosting: Render Free Web Service
- **Free Tier Allowance:** 512 MB RAM, free SSL certificate, free `*.onrender.com` subdomain.
- **Instance Hours:** 750 free instance hours per month.
- **Sleep Policy:** Spins down after 15 minutes of inactivity; automatically wakes up in ~30 seconds when a user visits.

### 4. Frontend Hosting: Vercel
- **Free Tier Allowance:** 100 GB fast edge bandwidth per month.
- **Deployments:** Unlimited Git preview & production deployments with free `*.vercel.app` subdomain.
- **Cost:** ₹0 ($0/mo) forever on the Hobby tier.

---

## 📁 Project Structure

```
share/
├── backend/
│   ├── database/
│   │   ├── migrate.js          # Automated database migration runner
│   │   └── schema.sql           # MySQL/TiDB DDL schema
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MySQL connection pool (XAMPP / TiDB)
│   │   ├── controllers/
│   │   │   └── shareController.js # Upload, download, zip, revoke handlers
│   │   ├── middleware/
│   │   │   ├── errorHandler.js  # Multer & generic error normalizer
│   │   │   ├── rateLimiter.js   # Upload & download rate limiters
│   │   │   └── upload.js        # Multer file validation & filter
│   │   ├── routes/
│   │   │   └── shareRoutes.js   # API route definitions
│   │   ├── services/
│   │   │   ├── cleanupService.js# Cron cleaner for expired files
│   │   │   └── storageService.js# Pluggable Local & S3 storage driver
│   │   ├── utils/
│   │   │   └── fileSecurity.js  # Token generation & filename sanitization
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point & listener
│   ├── tests/
│   │   └── api.test.js          # Automated Jest + Supertest integration tests
│   ├── uploads/                 # Local uploads folder (gitignored)
│   ├── .env.example             # Backend environment template
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DownloadView.jsx # Receiver download page
│   │   │   ├── FileList.jsx     # Selected files & upload progress
│   │   │   ├── FileUploader.jsx # Drag-and-drop zone
│   │   │   ├── Navbar.jsx       # Brand header & connection status
│   │   │   ├── QRCodeModal.jsx  # QR code for mobile scanning
│   │   │   └── ShareResult.jsx  # Share link, QR trigger, revoke actions
│   │   ├── services/
│   │   │   └── api.js           # Axios API client with upload progress
│   │   ├── utils/
│   │   │   └── formatters.js    # File sizes & expiry countdown helpers
│   │   ├── App.jsx              # Main routing & state controller
│   │   ├── index.css            # Tailwind directives & custom animations
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js           # Vite dev proxy & multi-device host config
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example             # Frontend environment template
│   └── package.json
│
├── .gitignore                   # Universal gitignore (.env, node_modules, uploads)
├── package.json                 # Root script orchestrator
└── README.md
```

---

## 🛠️ Local Development (XAMPP MySQL)

### Prerequisites
- **Node.js:** v18+ (tested on Node v24)
- **XAMPP:** MySQL module running on port `3306`

### 1. Start XAMPP MySQL
Open XAMPP Control Panel and click **Start** next to MySQL.

### 2. Configure Backend Environment
In `backend/.env`:
```env
PORT=5050
NODE_ENV=development
FRONTEND_URL=http://localhost:5180

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quickshare_db

STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
MAX_FILES_COUNT=10
DEFAULT_EXPIRY_HOURS=24
CLEANUP_CRON_SCHEDULE=*/15 * * * *
```

### 3. Run Automated Database Migration
```bash
cd backend
npm run migrate
```
This automatically connects to MySQL, creates the database `quickshare_db`, and creates the `share_sessions` and `share_files` tables.

### 4. Start the Application
You can run both concurrently from the root or in separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(Backend runs on `http://localhost:5050`)*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(Frontend runs on `http://localhost:5180`)*

Open your browser at: **`http://localhost:5180`**

---

## 📱 Multi-Device & Mobile Testing

The development server is configured with `--host 0.0.0.0` so you can test on your phone or tablet on the same Wi-Fi:

1. Look up your local LAN IP (e.g. `10.56.126.27` or `192.168.x.x`).
2. Open `http://<your-lan-ip>:5180` on your mobile browser (Android Chrome, iPhone Safari).
3. Upload a photo or file from your phone.
4. Scan the QR code with another device to download instantly!

---

## 🧪 Automated Testing

QuickShare includes automated integration tests using Jest and Supertest covering all critical user and security flows:
- Server and database health check
- File size and count validations
- Single and multi-file uploads
- Session retrieval and metadata sanitation
- Individual file downloads with proper `Content-Disposition`
- Dynamic `.zip` bundle generation
- Unauthorized revocation rejection
- Valid owner revocation and immediate file destruction
- 410 Gone status verification for expired/revoked links

Run the tests anytime:
```bash
cd backend
npm test
```

---

## 🚀 Step-by-Step Free Deployment Guide

### Phase 1: Set up the Free Production Database (TiDB Serverless)
1. Go to [TiDB Cloud](https://tidbcloud.com/) and register for a free account (no credit card required).
2. Click **Create Cluster** and select **TiDB Serverless (Free Forever - 5GB)**.
3. In cluster settings, click **Connect** -> **Connect with MySQL CLI / URL**.
4. Copy the connection string format:
   ```
   mysql://<username>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/quickshare_db?ssl={"rejectUnauthorized":true}
   ```
5. Run your migrations into the cloud database:
   ```bash
   DATABASE_URL="your-tidb-url" npm run migrate
   ```

### Phase 2: Set up Persistent Cloud Storage (Cloudflare R2)
1. Sign up for a free account at [Cloudflare](https://dash.cloudflare.com/).
2. In the sidebar, select **R2 Storage** -> **Create Bucket** (name: `quickshare-files`).
3. Click **Manage R2 API Tokens** -> **Create API Token** (Permissions: Object Read & Write).
4. Save the **Access Key ID**, **Secret Access Key**, and **Endpoint URL** (`https://<account_id>.r2.cloudflarestorage.com`).

### Phase 3: Deploy Backend to Render (₹0)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com/) (free tier).
3. Click **New +** -> **Web Service** -> Link your GitHub repo.
4. Set the following configuration:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Instance Type:** `Free`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *(your TiDB connection URL from Phase 1)*
   - `STORAGE_DRIVER`: `s3`
   - `S3_ENDPOINT`: *(your Cloudflare R2 endpoint from Phase 2)*
   - `S3_REGION`: `auto`
   - `S3_ACCESS_KEY_ID`: *(your R2 Access Key)*
   - `S3_SECRET_ACCESS_KEY`: *(your R2 Secret Key)*
   - `S3_BUCKET_NAME`: `quickshare-files`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
6. Click **Deploy Web Service**. Render provides a free URL: `https://quickshare-api.onrender.com`.

### Phase 4: Deploy Frontend to Vercel (₹0)
1. Sign in to [Vercel](https://vercel.com/) (free tier).
2. Click **Add New** -> **Project** -> Import your GitHub repo.
3. Set the following configuration:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://quickshare-api.onrender.com/api`
5. Click **Deploy**. Vercel provides a free URL: `https://your-quickshare.vercel.app`.

---

## 🔒 Security & Protection Mechanisms

- **Cryptographic Unpredictability:** Share tokens are generated with 16 cryptographically random bytes (`crypto.randomBytes(16)`), providing 32-character hexadecimal strings ($2^{128}$ combinations), preventing brute-force enumeration.
- **Owner Revocation Secret:** When uploading, the uploader receives a distinct 24-byte secret key ($2^{192}$ combinations) never shown to recipients. Only holders of this secret key can revoke the link or trigger file deletion.
- **Path Traversal Defense:** All filenames are sanitized with `path.basename()`, stripped of null bytes and special control characters. Internal disk storage uses randomly salted unique identifiers. File access uses path boundary verification (`resolveSafePath`).
- **No Execution of Uploaded Content:** Files are saved outside the public server root. When downloaded, strict headers are sent (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`), preventing browsers from interpreting uploaded files as scripts.
- **SQL Injection Prevention:** 100% of database interactions use parameterized prepared queries with `?` placeholders via `mysql2/promise`.
- **DDoS & Rate Limiting:** Upload routes are throttled to 30 requests per 15 minutes per IP; download routes are limited to 120 requests per 15 minutes to preserve hosting resources.
- **No Ephemeral Storage Loss:** In production, files are stored persistently in S3/Cloudflare R2, ensuring no file loss when server instances spin down or redeploy.
