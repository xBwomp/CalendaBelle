import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, LogOut, Calendar as CalendarIcon, Wifi, WifiOff } from 'lucide-react';
import { CalendarEvent, CalendarDay, TimeSlot } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  loading: boolean;
  syncing: boolean;
  onSyncEvents: () => void;
  onShowSettings: () => void;
  onLogout: () => void;
  userName: string;
}

export function CalendarView({
  events,
  loading,
  syncing,
  onSyncEvents,
  onShowSettings,
  onLogout,
  userName
}: CalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const days = generateDays();
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
                  Calendar Kiosk
                </h1>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
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
                  onClick={onSyncEvents}
                  disabled={syncing || !isOnline}
                  className="btn-secondary flex items-center space-x-2"
                  title={!isOnline ? 'Sync requires internet connection' : 'Sync events'}
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {syncing ? 'Syncing...' : 'Sync'}
                  </span>
                </button>

                <button
                  onClick={onShowSettings}
                  className="btn-secondary"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  className="btn-secondary text-red-600 hover:bg-red-50"
                  title={`Sign out ${userName}`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <main className="p-6">
        <div className="card overflow-hidden">
          <div className="calendar-grid">
            {/* Time column header */}
            <div className="day-header">Time</div>
            
            {/* Day headers */}
            {days.map((day) => (
              <div key={day.date.toISOString()} className={`day-header ${day.isToday ? 'bg-primary-50 text-primary-900' : ''}`}>
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
                {days.map((day) => (
                  <div key={`${day.date.toISOString()}-${timeSlot.hour}`} className="calendar-cell">
                    {getEventsForTimeSlot(events, day.date, timeSlot.hour).map((event, index) => (
                      <EventBlock key={`${event.id}-${index}`} event={event} />
                    ))}
                  </div>
                ))}
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
  const startTime = new Date(event.start_datetime);
  const endTime = new Date(event.end_datetime);
  
  return (
    <div className="event-block" title={`${event.summary}\n${event.location || ''}\n${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`}>
      <div className="event-title">{event.summary}</div>
      {!event.is_all_day && (
        <div className="event-time">
          {startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      )}
    </div>
  );
}

function generateDays(): CalendarDay[] {
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
      isToday: i === 0
    });
  }

  return days;
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      displayTime: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      })
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
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime);

    // Check if event overlaps with this time slot
    return eventStart < slotEnd && eventEnd > slotStart;
  });
}