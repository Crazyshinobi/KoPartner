import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API endpoint - use relative URL for same-origin requests
const API = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Memoized fetchCurrentUser to prevent unnecessary re-renders
  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000 // 15 second timeout
      });
      setUser(response.data);
      // Cache user data for resilience
      localStorage.setItem('cached_user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      
      // Only logout on authentication errors (401, 403)
      // Don't logout on network errors or server errors (5xx)
      const status = error.response?.status;
      
      if (status === 401 || status === 403) {
        // Token is invalid or expired - logout
        console.log('Auth error - logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('cached_user');
        setToken(null);
        setUser(null);
      } else {
        // Network error or server error - try to use cached user
        console.log('Network/Server error - trying cached data');
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            console.error('Failed to parse cached user');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const refreshUser = async () => {
    if (!token) return null;
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      setUser(response.data);
      // Cache user data
      localStorage.setItem('cached_user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return user; // Return current user on error
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('cached_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cached_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('cached_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);