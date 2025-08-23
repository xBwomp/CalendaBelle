export interface CalendarEvent {
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

export interface DatabaseEvent {
  id: string;
  summary: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  location: string | null;
  status: string;
  created: string;
  updated: string;
  calendar_id: string;
  is_all_day: boolean;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}