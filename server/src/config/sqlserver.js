import { createRequire } from 'module';
import env from './env.js';

const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: env.sqlServerConnectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

export const getPool = async () => {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(config);
    pool.on('error', (error) => {
      console.error('SQL Server pool error:', error);
    });
    poolPromise = pool.connect();
  }

  return poolPromise;
};

export const createRequest = async () => {
  const pool = await getPool();
  return pool.request();
};

export { sql };