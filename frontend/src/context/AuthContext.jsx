import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// 🛠️ THE DUAL-HEADER INTERCEPTOR: Restored and hardened
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
    if (!user || !user.id) return;
    
    try {
      const res = await axios.get(`http://localhost:5000/api/badges/${user.id}`);
      setBadges(res.data);
    } catch (err) { 
      if (err.response?.status !== 401) {
        console.error("Badge sync failed"); 
      }
    }
  };

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 🛠️ LOGIN
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('runly_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('runly_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  };

  // 🟢 REGISTER (THE MISSING FUNCTION)
  const register = async (name, email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password
      });

      const { token, user } = res.data;

      // Reuse login logic
      login(user, token);

      return { success: true };
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      return { 
        success: false, 
        error: err.response?.data?.error || "Registration failed" 
      };
    }
  };

  // Merge updated fields into user state and persist to localStorage
const updateUser = (updatedFields) => {
  setUser(prev => {
    const merged = { ...prev, ...updatedFields };
    try {
      localStorage.setItem('runly_user', JSON.stringify(merged));
    } catch (e) {
      // ignore localStorage errors
    }
    return merged;
  });
};


  // 🛠️ LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem('runly_user');
    localStorage.removeItem('runly_token');
    localStorage.removeItem('runly_role');
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register,   // <-- ADDED HERE
      badges, 
      fetchBadges, 
      roleMode, 
      toggleRole,
      updateUser   // <-- ADDED HERE 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
