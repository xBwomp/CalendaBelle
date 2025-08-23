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

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  status: string;
  is_all_day: boolean;
  created: string;
  updated: string;
}

export interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

export interface TimeSlot {
  hour: number;
  displayTime: string;
}