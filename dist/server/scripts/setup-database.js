import { Database } from '../database/database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function setupDatabase() {
    try {
        console.log('Setting up database...');
        const dbPath = process.env.DB_PATH || './data/calendar.db';
        const dbDir = dirname(dbPath);
        // Create data directory if it doesn't exist
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
            console.log(`Created directory: ${dbDir}`);
        }
        // Initialize database
        const database = new Database(dbPath);
        console.log('✅ Database setup completed successfully!');
        console.log(`Database location: ${dbPath}`);
        await database.close();
    }
    catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}
setupDatabase();
