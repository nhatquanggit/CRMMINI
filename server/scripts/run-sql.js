import { createRequire } from 'module';
import env from '../src/config/env.js';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: env.sqlServerConnectionString,
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const runSql = async (filename) => {
  const pool = await sql.connect(config);
  try {
    const sqlFile = path.join(process.cwd(), 'sql', filename);
    const text = fs.readFileSync(sqlFile, 'utf8');
    const result = await pool.request().query(text);
    console.log(`Executed ${filename} successfully.`);
    return result;
  } finally {
    await pool.close();
  }
};

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node scripts/run-sql.js <filename>');
  process.exit(1);
}

runSql(filename).catch((err) => {
  console.error('SQL execution error:', err);
  process.exit(1);
});
