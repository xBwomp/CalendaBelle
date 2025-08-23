import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { DatabaseEvent, User, Calendar } from '../types/index.js';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private init(): void {
    const createTables = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calendars (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        description TEXT,
        is_primary BOOLEAN DEFAULT FALSE,
        access_role TEXT NOT NULL,
        is_selected BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        calendar_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        description TEXT,
        start_datetime TEXT NOT NULL,
        end_datetime TEXT NOT NULL,
        location TEXT,
        status TEXT NOT NULL,
        is_all_day BOOLEAN DEFAULT FALSE,
        created TEXT NOT NULL,
        updated TEXT NOT NULL,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (calendar_id) REFERENCES calendars (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_events_datetime ON events (start_datetime, end_datetime);
      CREATE INDEX IF NOT EXISTS idx_events_calendar ON events (calendar_id);
      CREATE INDEX IF NOT EXISTS idx_calendars_user ON calendars (user_id);
    `;

    this.db.exec(createTables, (err) => {
      if (err) {
        console.error('Error creating tables:', err);
      } else {
        console.log('Database initialized successfully');
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `INSERT OR REPLACE INTO users 
       (id, email, name, picture, access_token, refresh_token, expires_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user.id, user.email, user.name, user.picture, user.access_token, user.refresh_token, user.expires_at]
    );
  }

  async getUser(userId: string): Promise<User | null> {
    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM users WHERE id = ?', [userId]) as any;
    return row || null;
  }

  async saveCalendars(userId: string, calendars: Calendar[]): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Clear existing calendars for this user
    await run('DELETE FROM calendars WHERE user_id = ?', [userId]);
    
    // Insert new calendars
    for (const calendar of calendars) {
      await run(
        `INSERT INTO calendars 
         (id, user_id, summary, description, is_primary, access_role, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [calendar.id, userId, calendar.summary, calendar.description || null, calendar.primary || false, calendar.accessRole]
      );
    }
  }

  async getCalendars(userId: string): Promise<Calendar[]> {
    const all = promisify(this.db.all.bind(this.db));
    const rows = await all('SELECT * FROM calendars WHERE user_id = ? ORDER BY is_primary DESC, summary', [userId]) as any[];
    return rows.map(row => ({
      id: row.id,
      summary: row.summary,
      description: row.description,
      primary: row.is_primary,
      accessRole: row.access_role
    }));
  }

  async setSelectedCalendar(userId: string, calendarId: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Unselect all calendars for this user
    await run('UPDATE calendars SET is_selected = FALSE WHERE user_id = ?', [userId]);
    
    // Select the specified calendar
    await run('UPDATE calendars SET is_selected = TRUE WHERE id = ? AND user_id = ?', [calendarId, userId]);
  }

  async getSelectedCalendar(userId: string): Promise<string | null> {
    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT id FROM calendars WHERE user_id = ? AND is_selected = TRUE', [userId]) as any;
    return row?.id || null;
  }

  async saveEvents(calendarId: string, events: DatabaseEvent[]): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Clear existing events for this calendar
    await run('DELETE FROM events WHERE calendar_id = ?', [calendarId]);
    
    // Insert new events
    for (const event of events) {
      await run(
        `INSERT INTO events 
         (id, calendar_id, summary, description, start_datetime, end_datetime, location, status, is_all_day, created, updated, last_sync) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          event.id, event.calendar_id, event.summary, event.description,
          event.start_datetime, event.end_datetime, event.location, event.status,
          event.is_all_day, event.created, event.updated
        ]
      );
    }
  }

  async getEvents(calendarId: string, startDate: string, endDate: string): Promise<DatabaseEvent[]> {
    const all = promisify(this.db.all.bind(this.db));
    const rows = await all(
      `SELECT * FROM events 
       WHERE calendar_id = ? 
       AND ((start_datetime >= ? AND start_datetime <= ?) 
            OR (end_datetime >= ? AND end_datetime <= ?)
            OR (start_datetime <= ? AND end_datetime >= ?))
       ORDER BY start_datetime`,
      [calendarId, startDate, endDate, startDate, endDate, startDate, endDate]
    ) as any[];
    
    return rows.map(row => ({
      id: row.id,
      calendar_id: row.calendar_id,
      summary: row.summary,
      description: row.description,
      start_datetime: row.start_datetime,
      end_datetime: row.end_datetime,
      location: row.location,
      status: row.status,
      is_all_day: row.is_all_day,
      created: row.created,
      updated: row.updated
    }));
  }

  async close(): Promise<void> {
    const close = promisify(this.db.close.bind(this.db));
    await close();
  }
}