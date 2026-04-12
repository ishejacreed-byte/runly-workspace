import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// 🛠️ THE DUAL-HEADER INTERCEPTOR: Restored and hardened
// This ensures that EVERY axios call in the app has the token in both standard formats.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('runly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('runly_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });

  // 🛠️ RESTORED: PERSISTENT ROLE SYSTEM
  const [roleMode, setRoleMode] = useState(() => {
    return localStorage.getItem('runly_role') || 'customer';
  });

  const toggleRole = () => {
    const newRole = roleMode === 'customer' ? 'helper' : 'customer';
    setRoleMode(newRole);
    localStorage.setItem('runly_role', newRole);
  };

  // 🛠️ RESTORED: GLOBAL BADGE ENGINE
  const [badges, setBadges] = useState({ unreadMessages: 0, unreadAlerts: 0 });

  const fetchBadges = async () => {
    // Strict Guard: Prevent calling with undefined ID
    if (!user || !user.id) return;
    
    try {
      const res = await axios.get(`http://localhost:5000/api/badges/${user.id}`);
      setBadges(res.data);
    } catch (err) { 
      // Silently fail if it's just a temporary network hiccup during polling
      if (err.response?.status !== 401) {
        console.error("Badge sync failed"); 
      }
    }
  };

  // 🛠️ RESTORED: POLLING INTERVAL (5 Seconds)
  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 🛠️ UPGRADED LOGIN: Syncs Axios defaults immediately on login
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('runly_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('runly_token', token);
      // Force immediate header update for subsequent calls
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('runly_user');
    localStorage.removeItem('runly_token');
    localStorage.removeItem('runly_role');
    // Wipe headers on logout
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      badges, 
      fetchBadges, 
      roleMode, 
      toggleRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};