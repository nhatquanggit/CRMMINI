import { query, pool } from '../src/config/db.js';

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'SALES',
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    company VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    lead_source VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    stage VARCHAR(20) NOT NULL DEFAULT 'LEAD',
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS avatars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to)`,
  `CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_avatars_user_id_created_at ON avatars(user_id, created_at DESC)`
];

const main = async () => {
  for (const statement of statements) {
    await query(statement);
  }

  console.log('Database initialized successfully.');
  await pool.end();
};

main().catch(async (error) => {
  console.error('Database initialization failed:', error);
  await pool.end();
  process.exit(1);
});
