import { useState, useEffect } from 'react';
import { AuthStatus } from '../types';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication check failed');
      setAuthStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setAuthStatus({ authenticated: false });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    ...authStatus,
    loading,
    error,
    login,
    logout,
    refresh: checkAuthStatus
  };
}