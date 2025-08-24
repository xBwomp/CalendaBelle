import express from 'express';
import { CalendarService } from '../services/calendarService.js';
import { Database } from '../database/database.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}
export function createCalendarRoutes(calendarService: CalendarService, database: Database) {
  const router = express.Router();

  // Middleware to check authentication
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  router.use(requireAuth);

  router.get('/calendars', async (req, res) => {
    try {
      const calendars = await database.getCalendars(req.session.userId!);
      res.json(calendars);
    } catch (error) {
      console.error('Get calendars error:', error);
      res.status(500).json({ error: 'Failed to get calendars' });
    }
  });

  router.post('/calendars/sync', async (req, res) => {
    try {
      const calendars = await calendarService.syncCalendars(req.session.userId!);
      res.json(calendars);
    } catch (error) {
      console.error('Sync calendars error:', error);
      res.status(500).json({ error: 'Failed to sync calendars' });
    }
  });

  router.post('/calendars/:calendarId/select', async (req, res) => {
    try {
      const { calendarId } = req.params;
      await database.setSelectedCalendar(req.session.userId!, calendarId);
      res.json({ success: true });
    } catch (error) {
      console.error('Select calendar error:', error);
      res.status(500).json({ error: 'Failed to select calendar' });
    }
  });

  router.get('/calendars/selected', async (req, res) => {
    try {
      const selectedCalendarId = await database.getSelectedCalendar(req.session.userId!);
      res.json({ selectedCalendarId });
    } catch (error) {
      console.error('Get selected calendar error:', error);
      res.status(500).json({ error: 'Failed to get selected calendar' });
    }
  });

  router.post('/events/sync', async (req, res) => {
    try {
      const selectedCalendarId = await database.getSelectedCalendar(req.session.userId!);
      if (!selectedCalendarId) {
        return res.status(400).json({ error: 'No calendar selected' });
      }

      await calendarService.syncEvents(req.session.userId!, selectedCalendarId);
      res.json({ success: true });
    } catch (error) {
      console.error('Sync events error:', error);
      res.status(500).json({ error: 'Failed to sync events' });
    }
  });

  router.get('/events', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const events = await calendarService.getEvents(
        req.session.userId!,
        startDate as string,
        endDate as string
      );
      
      res.json(events);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Failed to get events' });
    }
  });

  return router;
}