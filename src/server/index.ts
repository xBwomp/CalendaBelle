import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';

import { Database } from './database/database.js';
import { GoogleAuthService } from './services/googleAuth.js';
import { CalendarSyncService } from './services/calendarSync.js';
import { CalendarManagementService } from './services/calendarManagement.js';
import { createAuthRoutes } from './routes/auth.js';
import { createCalendarRoutes } from './routes/calendar.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize services
const dbPath = process.env.DB_PATH || './data/calendar.db';
const dbDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

// Initialize services with error handling
let database: Database;
let googleAuth: GoogleAuthService;
let calendarManagement: CalendarManagementService;
let syncService: CalendarSyncService;

try {
  console.log('Initializing database...');
  database = new Database(dbPath);
  
  console.log('Initializing Google Auth...');
  googleAuth = new GoogleAuthService();
  
  console.log('Initializing Calendar Management...');
  calendarManagement = new CalendarManagementService(googleAuth, database);
  
  console.log('Initializing Sync Service...');
  syncService = new CalendarSyncService(googleAuth, database, calendarManagement);
  
  console.log('✅ All services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
}

// API Routes
app.use('/api/auth', createAuthRoutes(googleAuth, database));
app.use('/api/calendar', createCalendarRoutes(database, syncService, calendarManagement));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Development mode - API only
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Raspberry Pi Calendar Dashboard API',
    status: 'running',
    environment: 'development',
    note: 'Frontend should be served by Vite on port 3000'
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await database.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Calendar Dashboard API ready`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${dbPath}`);
});

export default app;