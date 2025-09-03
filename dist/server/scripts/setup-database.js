import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { Database } from '../database/database.js';
// Load environment variables
dotenv.config();
// Create data directory if it doesn't exist
const dbPath = process.env.DB_PATH || './data/calendar.db';
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`Created directory: ${dbDir}`);
}
// Initialize database
const database = new Database(dbPath);
console.log('Database initialized successfully');
// Close database connection
database.close().then(() => {
    console.log('Database connection closed');
    console.log('1. Configure your .env file with Google OAuth credentials');
    console.log('2. Run the application with: npm run dev');
}).catch((error) => {
    console.error('Error closing database:', error);
});
