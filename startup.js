import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create data directory if it doesn't exist
const dbPath = process.env.DB_PATH || './data/calendar.db';
const dbDir = dirname(dbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Created directory: ${dbDir}`);
} else {
  console.log(`✅ Directory exists: ${dbDir}`);
}

console.log('✅ Startup checks completed');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database path:', dbPath);
