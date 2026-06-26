import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, nextUser) => {
    if (token) localStorage.setItem('dc_token', token);
    localStorage.setItem('dc_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  // On first load, if we have a token, confirm it's still valid.
  useEffect(() => {
    const token = localStorage.getItem('dc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data; // { success, message } — no token; must verify email first
  };

  const googleLogin = async (credential, role) => {
    const { data } = await api.post('/auth/google', { credential, role });
    persist(data.token, data.user);
    return data.user;
  };

  // Used by the verify-email and reset-password flows, which return a token.
  const setSession = (token, nextUser) => persist(token, nextUser);

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('dc_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, setSession, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
