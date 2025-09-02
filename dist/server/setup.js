import { Database } from './database/database.js';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
async function setup() {
    console.log('Setting up Google Calendar Kiosk...');
    // Initialize database
    const database = new Database(process.env.DB_PATH || './calendar.db');
    console.log('✅ Database initialized');
    console.log('✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Configure your .env file with Google OAuth credentials');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('3. Visit http://localhost:3000 to access the application');
    await database.close();
}
setup().catch(console.error);
