export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export interface CalendarEvent {
  id: string;
  google_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day: boolean;
  status: string;
  sync_timestamp: string;
}

export interface SyncStatus {
  id?: number;
  last_sync: string;
  status: 'success' | 'error' | 'in_progress';
  error_message?: string;
  events_synced: number;
}

export interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

export interface TimeSlot {
  hour: number;
  displayTime: string;
  is24Hour: boolean;
}