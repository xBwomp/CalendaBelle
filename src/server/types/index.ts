export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  sync_timestamp: string;
  google_event_id: string;
  is_all_day: boolean;
  status: string;
}

export interface SyncStatus {
  last_sync: string;
  status: 'success' | 'error' | 'in_progress';
  error_message?: string;
  events_synced: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  status: string;
  created: string;
  updated: string;
}