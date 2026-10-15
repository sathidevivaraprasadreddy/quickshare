import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const isUrlConfig = Boolean(process.env.DATABASE_URL);
  let connection;

  try {
    if (isUrlConfig) {
      connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        multipleStatements: true,
        ssl: process.env.DATABASE_URL.includes('ssl=') ? undefined : { rejectUnauthorized: false }
      });
      console.log('Connected using DATABASE_URL.');
    } else {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
      });
      console.log(`Connected to MySQL server at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database migrations...');
    await connection.query(sql);
    console.log('Migration completed successfully.');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
