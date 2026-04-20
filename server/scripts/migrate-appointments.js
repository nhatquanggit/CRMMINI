import { createRequire } from 'module';
import env from '../src/config/env.js';

const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');
const fs = require('fs');
const path = require('path');

const config = {
  connectionString: env.sqlServerConnectionString,
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function runMigration() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to database');

    const sqlFile = path.join(process.cwd(), 'sql', '012_create_appointments.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    await pool.request().query(sqlContent);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigration();