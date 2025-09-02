import express from 'express';
export function createCalendarRoutes(database, syncService) {
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
    router.get('/events/all', requireAuth, async (req, res) => {
        try {
            const events = await database.getAllEvents();
            res.json(events);
        }
        catch (error) {
            console.error('Get all events error:', error);
            res.status(500).json({ error: 'Failed to fetch all events' });
        }
    });
    // Manual sync
    router.post('/sync', requireAuth, async (req, res) => {
        try {
            console.log('Manual sync requested');
            const result = await syncService.syncCalendarEvents();
            if (result.success) {
                res.json({
                    success: true,
                    message: `Successfully synced ${result.eventsCount} events`,
                    eventsCount: result.eventsCount
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    eventsCount: 0
                });
            }
        }
        catch (error) {
            console.error('Manual sync error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to sync calendar events'
            });
        }
    });
    // Get sync status
    router.get('/sync/status', requireAuth, async (req, res) => {
        try {
            const syncStatus = await database.getLastSyncStatus();
            res.json(syncStatus);
        }
        catch (error) {
            console.error('Get sync status error:', error);
            res.status(500).json({ error: 'Failed to get sync status' });
        }
    });
    return router;
}
