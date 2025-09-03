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
import { createAuthRoutes } from './routes/auth.js';
import { createCalendarRoutes } from './routes/calendar.js';
import { securityMiddleware, createRateLimit, requestLogger } from './middleware/security.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityMiddleware);
app.use(createRateLimit());
app.use(requestLogger);

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
const dbPath = process.env.DB_PATH || 'dist/server/database/calendar.db';
const dbDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

// Initialize services with error handling
let database: Database;
let googleAuth: GoogleAuthService;
let syncService: CalendarSyncService;

try {
  database = new Database(dbPath);
  googleAuth = new GoogleAuthService();
  syncService = new CalendarSyncService(googleAuth, database);
  console.log('✅ Services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
}

// API Routes
app.use('/api/auth', createAuthRoutes(googleAuth, database));
app.use('/api/calendar', createCalendarRoutes(database, syncService));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
} else {
  // Development mode - API only
  app.get('/', (_req, res) => {
    res.json({ 
      message: 'Raspberry Pi Calendar Dashboard API',
      status: 'running',
      environment: 'development',
      note: 'Frontend should be served by Vite on port 3000'
    });
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// Auto-sync setup
let syncInterval: NodeJS.Timeout;

async function startAutoSync() {
  const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '15');
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`Setting up auto-sync every ${intervalMinutes} minutes`);
  
  syncInterval = setInterval(async () => {
    try {
      const user = await database.getUser();
      if (user) {
        console.log('Running automatic sync...');
        await syncService.syncCalendarEvents();
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }, intervalMs);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  try {
    await database.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
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
  
  // Start auto-sync after server is running
  startAutoSync();
});

export default app;