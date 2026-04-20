import { createRequire } from 'module';
import env from '../src/config/env.js';
const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: env.sqlServerConnectionString,
  pool: { max: 1, min: 0, idleTimeoutMillis: 30000 }
};

(async () => {
  const pool = await sql.connect(config);
  try {
    const result = await pool.request().query('SELECT TOP 5 id, email, name FROM Users');
    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.close();
  }
})();
