import { useState, useEffect } from 'react';
import { Calendar, CalendarEvent } from '../types';

export function useCalendar() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/calendars', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCalendars(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    }
  };

  const fetchSelectedCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/calendars/selected', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedCalendarId(data.selectedCalendarId);
      }
    } catch (error) {
      console.error('Failed to fetch selected calendar:', error);
    }
  };

  const syncCalendars = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/calendars/sync', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCalendars(data);
      }
    } catch (error) {
      console.error('Failed to sync calendars:', error);
    } finally {
      setSyncing(false);
    }
  };

  const selectCalendar = async (calendarId: string) => {
    try {
      const response = await fetch(`/api/calendar/calendars/${calendarId}/select`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setSelectedCalendarId(calendarId);
      }
    } catch (error) {
      console.error('Failed to select calendar:', error);
    }
  };

  const syncEvents = async () => {
    if (!selectedCalendarId) return;
    
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/events/sync', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to sync events');
      }
    } catch (error) {
      console.error('Failed to sync events:', error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchEvents = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/calendar/events?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchSelectedCalendar();
  }, []);

  return {
    calendars,
    selectedCalendarId,
    events,
    loading,
    syncing,
    syncCalendars,
    selectCalendar,
    syncEvents,
    fetchEvents
  };
}