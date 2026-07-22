import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Normalisasi perbandingan role
  const roleLower = user?.role ? user.role.toLowerCase() : '';
  const isSuperAdmin = !!roleLower && (
    roleLower === 'superadmin' || 
    roleLower === 'super admin' || 
    roleLower.includes('admin')
  );

  const isStaff = !!roleLower && (
    roleLower === 'staf' || 
    roleLower === 'staf perpustakaan' || 
    roleLower.includes('staf')
  );

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const response = await api.get('/me');
          const userData = response.data?.data || response.data;
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error("Sesi login tidak valid atau telah kedaluwarsa:", error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/login', { username, password });
    const { token: authToken, user: userData } = response.data?.data || response.data;

    localStorage.setItem('token', authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    setToken(authToken);
    setUser(userData);

    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Abaikan error jika token sudah di-revoke
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      isSuperAdmin,
      isStaff,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
