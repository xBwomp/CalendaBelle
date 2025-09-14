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
    syncStatus,
    loading: calendarLoading,
    syncing,
    syncCalendars,
    selectCalendar,
    syncEvents,
    fetchEvents
  } = useCalendar();

  console.log('App render - authenticated:', authenticated, 'selectedCalendarId:', selectedCalendarId, 'authLoading:', authLoading);

  // Determine app state based on authentication and calendar selection
  useEffect(() => {
    console.log('App useEffect - authLoading:', authLoading, 'authenticated:', authenticated, 'selectedCalendarId:', selectedCalendarId);
    
    if (authLoading) {
      console.log('Still loading auth...');
      return;
    }

    if (!authenticated) {
      console.log('Not authenticated, showing login');
      setAppState('login');
    } else if (!selectedCalendarId) {
      console.log('Authenticated but no calendar selected, showing setup');
      setAppState('setup');
    } else {
      console.log('Authenticated and calendar selected, showing calendar');
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

  console.log('App rendering state:', appState);

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
          syncStatus={syncStatus}
          loading={calendarLoading}
          syncing={syncing}
          user={user!}
          onSyncCalendar={handleSyncEventsAndRefresh}
          onLogout={logout}
          onRefreshEvents={() => {
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + 5);
            fetchEvents(
              today.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            );
          }}
        />
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Unknown app state: {appState}</p>
          </div>
        </div>
      );
  }
}

export default App;