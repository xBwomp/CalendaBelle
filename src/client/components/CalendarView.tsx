import React, { useState, useEffect } from 'react';
import { RefreshCw, LogOut, Calendar as CalendarIcon, Wifi, WifiOff, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { CalendarEvent, CalendarDay, TimeSlot, SyncStatus, User } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  syncStatus: SyncStatus | null;
  loading: boolean;
  syncing: boolean;
  user: User;
  onSyncCalendar: () => Promise<any>;
  onLogout: () => void;
  onRefreshEvents: () => void;
}

export function CalendarView({
  events,
  syncStatus,
  loading,
  syncing,
  user,
  onSyncCalendar,
  onLogout,
  onRefreshEvents
}: CalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    try {
      setSyncError(null);
      await onSyncCalendar();
      onRefreshEvents();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const days = generateWorkDays();
  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Calendar Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-500">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                {syncStatus && (
                  <div className={`sync-indicator ${syncStatus.status}`}>
                    {syncStatus.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {syncStatus.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {syncStatus.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                    <span>
                      Last sync: {new Date(syncStatus.last_sync).toLocaleTimeString()}
                      {syncStatus.status === 'success' && ` (${syncStatus.events_synced} events)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-medium text-gray-900">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSync}
                  disabled={syncing || !isOnline}
                  className="btn-secondary flex items-center space-x-2"
                  title={!isOnline ? 'Sync requires internet connection' : 'Sync calendar'}
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {syncing ? 'Syncing...' : 'Sync'}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="btn-secondary text-red-600 hover:bg-red-50"
                  title={`Sign out ${user.name}`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Messages */}
      {syncError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800">{syncError}</p>
          </div>
        </div>
      )}

      {syncStatus?.status === 'error' && syncStatus.error_message && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800">Sync Error: {syncStatus.error_message}</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <main className="p-6">
        <div className="card overflow-hidden">
          <div className="calendar-grid">
            {/* Headers */}
            <div className="time-header">Time</div>
            {days.map((day) => (
              <div key={day.date.toISOString()} className={`day-header ${day.isToday ? 'today' : ''}`}>
                <div className="font-semibold">{day.dayName}</div>
                <div className={`text-lg ${day.isToday ? 'text-primary-600' : 'text-gray-600'}`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}

            {/* Time slots and calendar cells */}
            {timeSlots.map((timeSlot) => (
              <React.Fragment key={timeSlot.hour}>
                {/* Time label */}
                <div className="time-slot">
                  <div className="font-medium">{timeSlot.displayTime}</div>
                </div>
                
                {/* Calendar cells for each day */}
                {days.map((day) => {
                  const isCurrentHour = day.isToday && timeSlot.hour === currentTime.getHours();
                  return (
                    <div 
                      key={`${day.date.toISOString()}-${timeSlot.hour}`} 
                      className={`calendar-cell ${isCurrentHour ? 'current-hour' : ''}`}
                    >
                      {getEventsForTimeSlot(events, day.date, timeSlot.hour).map((event, index) => (
                        <EventBlock key={`${event.id}-${index}`} event={event} />
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading events...</span>
            </div>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No events found for the next 5 days</p>
            <p className="text-sm mt-2">
              {isOnline ? 'Try syncing your calendar' : 'Connect to internet to sync events'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function EventBlock({ event }: { event: CalendarEvent }) {
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  return (
    <div 
      className="event-block" 
      title={`${event.title}${event.location ? `\n📍 ${event.location}` : ''}${event.description ? `\n${event.description}` : ''}\n🕐 ${formatTime(startTime)} - ${formatTime(endTime)}`}
    >
      <div className="event-title">{event.title}</div>
      {!event.is_all_day && (
        <div className="event-time">
          {formatTime(startTime)}
        </div>
      )}
      {event.location && (
        <div className="event-location">
          📍 {event.location}
        </div>
      )}
    </div>
  );
}

function generateWorkDays(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    days.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: i === 0,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }

  return days;
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // 6 AM to 10 PM (18 hours)
  for (let hour = 6; hour <= 22; hour++) {
    slots.push({
      hour,
      displayTime: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      }),
      is24Hour: false
    });
  }

  return slots;
}

function getEventsForTimeSlot(events: CalendarEvent[], date: Date, hour: number): CalendarEvent[] {
  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);
  
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  return events.filter(event => {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    // Check if event overlaps with this time slot
    return eventStart < slotEnd && eventEnd > slotStart;
  });
}