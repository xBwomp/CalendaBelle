import React from 'react';
import { Calendar, Shield, Wifi } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 p-4 rounded-full">
              <Calendar className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Calendar Kiosk
          </h1>
          
          <p className="text-gray-600 mb-8">
            Sync your Google Calendar and view your schedule in a clean, kiosk-friendly interface.
          </p>
          
          <button
            onClick={onLogin}
            className="btn-primary w-full mb-6 py-3 text-lg"
          >
            Sign in with Google
          </button>
          
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Secure OAuth2 authentication</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Works offline after initial sync</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Read-only access to your calendars</span>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Perfect for Raspberry Pi kiosk displays</p>
        </div>
      </div>
    </div>
  );
}