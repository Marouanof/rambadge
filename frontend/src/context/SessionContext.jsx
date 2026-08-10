import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { applyTheme } from '@/lib/theme';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('ram-theme');
    if (cached) applyTheme(cached);
  }, []);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/auth/preferences')
      .then((res) => setPreferences(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preferences?.theme) {
      localStorage.setItem('ram-theme', preferences.theme);
      applyTheme(preferences.theme);
    }
  }, [preferences?.theme]);

  const updatePreferences = useCallback(async (patch) => {
    const res = await api.put('/auth/preferences', patch);
    setPreferences(res.data.data);
    return res.data.data;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.put('/employes/profile', payload);
    setUser(res.data.data);
    return res.data.data;
  }, []);

  return (
    <SessionContext.Provider value={{ user, preferences, updatePreferences, updateProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
