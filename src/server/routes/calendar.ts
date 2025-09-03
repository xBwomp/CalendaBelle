import express from 'express';
import { Database } from '../database/database.js';
import { CalendarSyncService } from '../services/calendarSync.js';

export function createCalendarRoutes(database: Database, syncService: CalendarSyncService) {
  const router = express.Router();

  // Middleware to check authentication
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

      const events = await database.getEvents(startDate as string, endDate as string);
      res.json(events);

    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get all events
  router.get('/events/all', requireAuth, async (_req, res) => {
    try {
      const events = await database.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching all events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Manual sync
  router.post('/sync', requireAuth, async (_req, res) => {
    try {
      const result = await syncService.syncCalendarEvents();
      res.json(result);
    } catch (error) {
      console.error('Error syncing calendar:', error);
      res.status(500).json({ error: 'Failed to sync calendar' });
    }
  });

  // Get sync status
  router.get('/sync/status', requireAuth, async (_req, res) => {
    try {
      const status = await database.getLastSyncStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      res.status(500).json({ error: 'Failed to fetch sync status' });
    }
  });

  return router;
}