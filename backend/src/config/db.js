import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

export function getDbPool() {
  if (pool) return pool;

  const isUrlConfig = Boolean(process.env.DATABASE_URL);

  if (isUrlConfig) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DATABASE_URL.includes('ssl=') ? undefined : { rejectUnauthorized: false }
    });
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quickshare_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
}

export async function testDbConnection() {
  try {
    const db = getDbPool();
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    return { connected: true, solution: rows[0].solution };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

export default getDbPool();
