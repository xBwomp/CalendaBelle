import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, SyncStatus } from '../types';

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/calendar/events?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/sync/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, []);

  const syncCalendar = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      
      // Refresh sync status and events after successful sync
      await fetchSyncStatus();
      
      return data;
    } catch (error) {
      console.error('Calendar sync failed:', error);
      setError(error instanceof Error ? error.message : 'Calendar sync failed');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [fetchSyncStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  return {
    events,
    syncStatus,
    loading,
    syncing,
    error,
    fetchEvents,
    fetchSyncStatus,
    syncCalendar
  };
}