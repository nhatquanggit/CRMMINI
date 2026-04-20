import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const connectionString = env.databaseUrl;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

export const pool = new Pool({
  connectionString,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (error) => {
  console.error('Postgres pool error:', error);
});

export const query = async (text, params = []) => {
  const result = await pool.query(text, params);
  return result;
};

export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
