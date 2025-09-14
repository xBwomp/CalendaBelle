export const createTablesSQL = `
  -- Users table for storing authentication data
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

  -- Calendar events table
  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_event_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location TEXT,
    is_all_day BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'confirmed',
    sync_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User calendars table
  CREATE TABLE IF NOT EXISTS user_calendars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    calendar_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    access_role TEXT DEFAULT 'reader',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, calendar_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  -- User settings table
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    selected_calendar_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  -- Sync status table
  CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_sync DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'in_progress')),
    error_message TEXT,
    events_synced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes for efficient queries
  CREATE INDEX IF NOT EXISTS idx_events_start_time ON calendar_events(start_time);
  CREATE INDEX IF NOT EXISTS idx_events_end_time ON calendar_events(end_time);
  CREATE INDEX IF NOT EXISTS idx_events_google_id ON calendar_events(google_event_id);
  CREATE INDEX IF NOT EXISTS idx_events_time_range ON calendar_events(start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_sync_status_timestamp ON sync_status(last_sync);
  CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
`;