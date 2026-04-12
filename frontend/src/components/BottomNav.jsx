import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, MessageCircle, Bell, User, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // 🛠️ FIX: We now pull both 'badges' AND 'user' from the global state
  const { badges, user } = useContext(AuthContext); 

  // 🛠️ FIX: navItems now dynamically includes the Admin icon if is_admin is true
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList },
    { name: 'Messages', path: '/messages', icon: MessageCircle, badge: badges.unreadMessages },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: badges.unreadAlerts },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // 🛡️ Automatically push Admin to the list if user is authorized
  if (user?.is_admin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldAlert });
  }

  // Safety: If for some reason user is missing, don't render nav to avoid crash
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
            className="relative flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <div className="relative">
              <Icon 
                size={22} 
                className={isActive ? 'text-primary' : 'text-muted-foreground'} 
                // Special color for Admin icon to make it stand out
                style={item.name === 'Admin' ? { color: isActive ? '#ef4444' : '#64748b' } : {}}
              />
              
              {/* 🔴 DYNAMIC RED BADGE */}
              {item.badge > 0 && (
                <div className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-card shadow-sm animate-bounce">
                  {item.badge}
                </div>
              )}
            </div>
            
            <span className={`text-[10px] font-medium truncate ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.name}
            </span>
            
            {isActive && <div className="w-6 h-0.5 bg-primary rounded-full mt-0.5"></div>}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;