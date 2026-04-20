import { createRequire } from 'module';
import env from './env.js';

const require = createRequire(import.meta.url);

/**
 * mssql/msnodesqlv8 = Windows Authentication + ODBC (chỉ Windows, cần native build).
 * mssql (Tedious) = SQL Auth qua TCP — dùng trên Linux (Render, Docker, Vercel serverless không áp dụng).
 *
 * Trên máy local Windows với Trusted Connection: đặt SQL_USE_MSNODESQLV8=true
 * Trên cloud: không đặt biến này (hoặc false), dùng SQLSERVER_CONNECTION_STRING kiểu SQL login.
 */
const useMsNodeSqlV8 = process.env.SQL_USE_MSNODESQLV8 === 'true' && process.platform === 'win32';

const sql = useMsNodeSqlV8
  ? require('mssql/msnodesqlv8')
  : require('mssql');

const poolOptions = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
};

const buildPool = () => {
  if (!env.sqlServerConnectionString?.trim()) {
    throw new Error(
      'SQLSERVER_CONNECTION_STRING is empty. Set it in .env (local) or Render environment variables.'
    );
  }

  if (useMsNodeSqlV8) {
    return new sql.ConnectionPool({
      connectionString: env.sqlServerConnectionString,
      pool: poolOptions
    });
  }

  // Tedious: connection string ADO-style; thêm Encrypt=true trong env nếu Azure / bắt buộc TLS
  return new sql.ConnectionPool(env.sqlServerConnectionString);
};

let poolPromise;

export const getPool = async () => {
  if (!poolPromise) {
    const pool = buildPool();
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
