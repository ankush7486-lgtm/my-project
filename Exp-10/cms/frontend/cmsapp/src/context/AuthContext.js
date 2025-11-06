// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/api'; // ✅ ensure correct path

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await API.get('/me'); // Goes to /api/auth/me
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async ({ username, password }) => {
    const response = await API.post('/login', { username, password }); // /api/auth/login
    localStorage.setItem('token', response.data.token);
    await fetchCurrentUser();
  };

  const register = async ({ username, email, password }) => {
    const response = await API.post('/register', { username, email, password }); // /api/auth/register
    localStorage.setItem('token', response.data.token);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
