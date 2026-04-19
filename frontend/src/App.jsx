import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Messages from './pages/Messages';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import ErrandDetail from './pages/ErrandDetail';
import Admin from './pages/Admin';
import AllReviews from './pages/AllReviews'; // (Adjust the path if it's in components instead of pages)
// 🛠️ The Wrapper knows exactly when to hide the Bottom Nav
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  if (!user) return <Navigate to="/login" />;
  
  // Hide nav on Chat screens AND Errand Detail screens
  const hideNav = location.pathname.startsWith('/chat') || location.pathname.startsWith('/errand');

  return (
    <div className="relative min-h-screen bg-background">
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
};

// 💡 We separate the routes so 'useLocation' works properly inside the Router context
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Full-Screen Routes (No bottom nav here) */}
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/errand/:id" element={<ProtectedRoute><ErrandDetail /></ProtectedRoute>} />

      {/* Standard Pages with Bottom Nav */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      
      {/* 🟢 YOUR OWN PROFILE */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* 🟢 SOMEONE ELSE'S PROFILE (Now properly protected!) */}
      <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/reviews/:id" element={<ProtectedRoute><AllReviews /></ProtectedRoute>} />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
             <Admin />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;