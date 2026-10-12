import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api('/auth/me').then(setUser).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
