import React from 'react';
import { Calendar, RefreshCw, Check } from 'lucide-react';
import { Calendar as CalendarType } from '../types';

interface CalendarSetupProps {
  calendars: CalendarType[];
  selectedCalendarId: string | null;
  syncing: boolean;
  onSyncCalendars: () => void;
  onSelectCalendar: (calendarId: string) => void;
  onContinue: () => void;
}

export function CalendarSetup({
  calendars,
  selectedCalendarId,
  syncing,
  onSyncCalendars,
  onSelectCalendar,
  onContinue
}: CalendarSetupProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Select Your Calendar
            </h1>
            <p className="text-gray-600">
              Choose which Google Calendar to display on your kiosk
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Available Calendars
              </h2>
              <button
                onClick={onSyncCalendars}
                disabled={syncing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>

            {calendars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No calendars found. Click "Refresh" to sync your calendars.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCalendarId === calendar.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => onSelectCalendar(calendar.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${
                            calendar.primary ? 'bg-primary-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {calendar.summary}
                              {calendar.primary && (
                                <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                  Primary
                                </span>
                              )}
                            </h3>
                            {calendar.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {calendar.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedCalendarId === calendar.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCalendarId && (
              <div className="pt-6 border-t">
                <button
                  onClick={onContinue}
                  className="btn-primary w-full py-3"
                >
                  Continue to Calendar View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}