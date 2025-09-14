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

export interface UserSettings {
  id: number;
  user_id: string;
  selected_calendar_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCalendar {
  id: number;
  user_id: string;
  calendar_id: string;
  summary: string;
  description?: string;
  is_primary: boolean;
  access_role: string;
  created_at: string;
}