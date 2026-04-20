import dotenv from 'dotenv';
import { createRequire } from 'module';
import util from 'util';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');

const pool = new sql.ConnectionPool({
  connectionString: process.env.SQLSERVER_CONNECTION_STRING,
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 30000
  }
});

try {
  const connected = await pool.connect();
  const result = await connected.request().query('SELECT DB_NAME() AS databaseName, SUSER_SNAME() AS loginName');
  console.log(JSON.stringify({ success: true, data: result.recordset[0] }, null, 2));
  await connected.close();
} catch (error) {
  const normalizedMessage =
    typeof error?.message === 'string'
      ? error.message
      : error?.message?.message || error?.toString?.() || 'Unknown SQL connection error';

  console.error(
    JSON.stringify(
      {
        success: false,
        name: error?.name || null,
        code: error.code,
        message: normalizedMessage,
        original: error.originalError?.message || error?.originalError || null,
        details: util.inspect(error, { depth: 6, colors: false })
      },
      null,
      2
    )
  );
  process.exit(1);
}