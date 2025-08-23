import { useState, useEffect } from 'react';
import { AuthStatus } from '../types';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Auth check failed:', error);
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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setAuthStatus({ authenticated: false });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    ...authStatus,
    loading,
    login,
    logout,
    refresh: checkAuthStatus
  };
}