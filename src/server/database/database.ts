import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { createTablesSQL } from './schema.js';
import { User, CalendarEvent, SyncStatus } from '../types/index.js';

export class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log(`Connected to SQLite database at ${dbPath}`);
    });
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.exec(createTablesSQL);
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  private get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  private all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User management
  async saveUser(user: User): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO users 
      (id, email, name, picture, access_token, refresh_token, expires_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await this.run(sql, [
      user.id,
      user.email,
      user.name,
      user.picture || null,
      user.access_token,
      user.refresh_token || null,
      user.expires_at
    ]);
  }

  async getUser(): Promise<User | null> {
    const sql = 'SELECT * FROM users ORDER BY updated_at DESC LIMIT 1';
    const row = await this.get(sql);
    return row || null;
  }

  async deleteUser(): Promise<void> {
    await this.run('DELETE FROM users');
  }

  // Calendar events management
  async saveEvents(events: CalendarEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Clear existing events
    await this.run('DELETE FROM calendar_events');

    // Insert new events
    const sql = `
      INSERT INTO calendar_events 
      (google_event_id, title, description, start_time, end_time, location, is_all_day, status, sync_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const event of events) {
      await this.run(sql, [
        event.google_event_id,
        event.title,
        event.description || null,
        event.start_time,
        event.end_time,
        event.location || null,
        event.is_all_day,
        event.status
      ]);
    }
  }

  async getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const sql = `
      SELECT * FROM calendar_events 
      WHERE (
        (start_time >= ? AND start_time <= ?) OR
        (end_time >= ? AND end_time <= ?) OR
        (start_time <= ? AND end_time >= ?)
      )
      ORDER BY start_time ASC
    `;
    
    const rows = await this.all(sql, [startDate, endDate, startDate, endDate, startDate, endDate]);
    
    return rows.map(row => ({
      id: row.id,
      google_event_id: row.google_event_id,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      is_all_day: Boolean(row.is_all_day),
      status: row.status,
      sync_timestamp: row.sync_timestamp
    }));
  }

  async getAllEvents(): Promise<CalendarEvent[]> {
    const sql = 'SELECT * FROM calendar_events ORDER BY start_time ASC';
    const rows = await this.all(sql);
    
    return rows.map(row => ({
      id: row.id,
      google_event_id: row.google_event_id,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      is_all_day: Boolean(row.is_all_day),
      status: row.status,
      sync_timestamp: row.sync_timestamp
    }));
  }

  // Sync status management
  async saveSyncStatus(status: Omit<SyncStatus, 'id'>): Promise<void> {
    const sql = `
      INSERT INTO sync_status (last_sync, status, error_message, events_synced)
      VALUES (?, ?, ?, ?)
    `;
    
    await this.run(sql, [
      status.last_sync,
      status.status,
      status.error_message || null,
      status.events_synced
    ]);
  }

  async getLastSyncStatus(): Promise<SyncStatus | null> {
    const sql = 'SELECT * FROM sync_status ORDER BY last_sync DESC LIMIT 1';
    const row = await this.get(sql);
    return row || null;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}