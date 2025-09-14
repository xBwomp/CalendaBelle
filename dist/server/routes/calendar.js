import express from 'express';
export function createCalendarRoutes(database, syncService, calendarManagement) {
    const router = express.Router();
    // Middleware to check authentication
    const requireAuth = (req, res, next) => {
        if (!req.session.isAuthenticated) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        next();
    };
    // Get calendar events for date range
    router.get('/events', requireAuth, async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required' });
            }
            const events = await database.getEvents(startDate, endDate);
            res.json(events);
        }
        catch (error) {
            console.error('Get events error:', error);
            res.status(500).json({ error: 'Failed to fetch events' });
        }
    });
    // Get all events
    router.get('/events/all', requireAuth, async (_req, res) => {
        try {
            const events = await database.getAllEvents();
            res.json(events);
        }
        catch (error) {
            console.error('Error fetching all events:', error);
            res.status(500).json({ error: 'Failed to fetch events' });
        }
    });
    // Get user calendars
    router.get('/calendars', requireAuth, async (_req, res) => {
        try {
            const user = await database.getUser();
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            const calendars = await database.getUserCalendars(user.id);
            res.json(calendars);
        }
        catch (error) {
            console.error('Error fetching calendars:', error);
            res.status(500).json({ error: 'Failed to fetch calendars' });
        }
    });
    // Sync calendars from Google
    router.post('/calendars/sync', requireAuth, async (_req, res) => {
        try {
            const calendars = await calendarManagement.fetchAndSaveUserCalendars();
            res.json(calendars);
        }
        catch (error) {
            console.error('Error syncing calendars:', error);
            res.status(500).json({ error: 'Failed to sync calendars' });
        }
    });
    // Select a calendar
    router.post('/calendars/:id/select', requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            await calendarManagement.selectUserCalendar(id);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error selecting calendar:', error);
            res.status(500).json({ error: 'Failed to select calendar' });
        }
    });
    // Get selected calendar
    router.get('/calendars/selected', requireAuth, async (_req, res) => {
        try {
            const settings = await calendarManagement.getUserSettings();
            res.json({ selectedCalendarId: settings?.selected_calendar_id || null });
        }
        catch (error) {
            console.error('Error getting selected calendar:', error);
            res.status(500).json({ error: 'Failed to get selected calendar' });
        }
    });
    // Manual sync events
    router.post('/sync', requireAuth, async (_req, res) => {
        try {
            const result = await syncService.syncCalendarEvents();
            res.json(result);
        }
        catch (error) {
            console.error('Error syncing calendar:', error);
            res.status(500).json({ error: 'Failed to sync calendar' });
        }
    });
    // Get sync status - this should work even without authentication for basic status
    router.get('/sync/status', async (_req, res) => {
        try {
            const status = await database.getLastSyncStatus();
            res.json(status);
        }
        catch (error) {
            console.error('Error fetching sync status:', error);
            res.status(500).json({ error: 'Failed to fetch sync status' });
        }
    });
    return router;
}
