import app from './app.js';
import dotenv from 'dotenv';
import { testDbConnection } from './config/db.js';
import { startCleanupJob } from './services/cleanupService.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  // Test DB connection on startup
  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    console.warn('⚠️ Warning: Database connection check failed:', dbStatus.error);
    console.warn('Please ensure MySQL is running in XAMPP or verify your DB credentials in .env');
  } else {
    console.log('✅ Database connected successfully.');
  }

  // Start background expired file cleanup scheduler
  startCleanupJob();

  // Listen on all network interfaces (0.0.0.0) so other devices (e.g. mobile phones on the same Wi-Fi) can access it!
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QuickShare backend running on http://0.0.0.0:${PORT}`);
    console.log(`📁 File uploads stored in: ${process.env.UPLOAD_DIR || './uploads'}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
