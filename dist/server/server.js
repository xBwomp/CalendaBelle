import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Database } from './database/database.js';
import { GoogleAuthService } from './services/googleAuth.js';
import { CalendarService } from './services/calendarService.js';
import { createAuthRoutes } from './routes/auth.js';
import { createCalendarRoutes } from './routes/calendar.js';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Initialize services
const database = new Database(process.env.DB_PATH || './calendar.db');
const googleAuth = new GoogleAuthService();
const calendarService = new CalendarService(googleAuth, database);
// Routes
app.use('/api/auth', createAuthRoutes(googleAuth, database));
app.use('/api/calendar', createCalendarRoutes(calendarService, database));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, 'client');
    app.use(express.static(clientPath));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}
else {
    // In development, serve a simple message since Vite handles the frontend
    app.get('/', (_req, res) => {
        res.json({
            message: 'Google Calendar Kiosk API Server',
            status: 'running',
            note: 'Frontend should be served by Vite on port 3000'
        });
    });
}
// Error handling
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
export default app;
