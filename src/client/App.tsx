import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { CalendarSetup } from './components/CalendarSetup';
import { CalendarView } from './components/CalendarView';
import { useAuth } from './hooks/useAuth';
import { useCalendar } from './hooks/useCalendar';

type AppState = 'login' | 'setup' | 'calendar';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const { authenticated, user, loading: authLoading, login, logout } = useAuth();
  const {
    calendars,
    selectedCalendarId,
    events,
    loading: calendarLoading,
    syncing,
    syncCalendars,
    selectCalendar,
    syncEvents,
    fetchEvents
  } = useCalendar();

  // Determine app state based on authentication and calendar selection
  useEffect(() => {
    if (authLoading) return;

    if (!authenticated) {
      setAppState('login');
    } else if (!selectedCalendarId) {
      setAppState('setup');
    } else {
      setAppState('calendar');
    }
  }, [authenticated, selectedCalendarId, authLoading]);

  // Fetch events when calendar is selected
  useEffect(() => {
    if (appState === 'calendar' && selectedCalendarId) {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 5);

      fetchEvents(
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    }
  }, [appState, selectedCalendarId, fetchEvents]);

  // Auto-sync events every 15 minutes when online
  useEffect(() => {
    if (appState === 'calendar' && selectedCalendarId && navigator.onLine) {
      const interval = setInterval(() => {
        syncEvents();
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(interval);
    }
  }, [appState, selectedCalendarId, syncEvents]);

  const handleContinueToCalendar = () => {
    setAppState('calendar');
  };

  const handleShowSettings = () => {
    setAppState('setup');
  };

  const handleSyncEventsAndRefresh = async () => {
    await syncEvents();
    
    // Refresh events after sync
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 5);

    fetchEvents(
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'login':
      return <LoginScreen onLogin={login} />;

    case 'setup':
      return (
        <CalendarSetup
          calendars={calendars}
          selectedCalendarId={selectedCalendarId}
          syncing={syncing}
          onSyncCalendars={syncCalendars}
          onSelectCalendar={selectCalendar}
          onContinue={handleContinueToCalendar}
        />
      );

    case 'calendar':
      return (
        <CalendarView
          events={events}
          loading={calendarLoading}
          syncing={syncing}
          onSyncEvents={handleSyncEventsAndRefresh}
          onShowSettings={handleShowSettings}
          onLogout={logout}
          userName={user?.name || 'User'}
        />
      );

    default:
      return null;
  }
}

export default App;