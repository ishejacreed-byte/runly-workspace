import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, MessageCircle, Bell, User, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Pulling state from context
  const { badges, user } = useContext(AuthContext); 

  // Base navigation items for all users
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList },
    { name: 'Messages', path: '/messages', icon: MessageCircle, badge: badges?.unreadMessages || 0 },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: badges?.unreadAlerts || 0 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // 🛡️ ENTERPRISE RBAC CHECK: Bridge between old is_admin and new system_role
  const hasAdminClearance = user?.is_admin || ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user?.system_role);

  if (hasAdminClearance) {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldAlert }); // Renamed to "Ops" for a cleaner look!
  }

  // Safety catch: Don't render if user data hasn't loaded yet
  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        
        return (
          <Link 
            key={item.name} 
            to={item.path} 
            className="relative flex flex-col items-center gap-1 flex-1 min-w-0 group"
          >
            <div className="relative">
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors duration-200 ${
                  isActive 
                    ? (item.name === 'Ops' ? 'text-rose-600' : 'text-primary') 
                    : 'text-muted-foreground group-hover:text-foreground'
                }`} 
              />
              
              {/* 🔴 DYNAMIC RED BADGE */}
              {item.badge > 0 && (
                <div className="absolute -top-1.5 -right-2 bg-destructive text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-card shadow-sm animate-pulse">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </div>
            
            <span className={`text-[10px] font-bold truncate transition-colors duration-200 uppercase tracking-wide ${
              isActive 
                ? (item.name === 'Ops' ? 'text-rose-600' : 'text-primary') 
                : 'text-muted-foreground group-hover:text-foreground'
            }`}>
              {item.name}
            </span>
            
            {/* Active Indicator Dot (Cleaner than a line) */}
            {isActive && (
               <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${item.name === 'Ops' ? 'bg-rose-600' : 'bg-primary'}`}></div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;