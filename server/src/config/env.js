import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  sqlServerConnectionString: process.env.SQLSERVER_CONNECTION_STRING || '',
  jwtSecret: process.env.JWT_SECRET || 'please-change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
};

export default env;
