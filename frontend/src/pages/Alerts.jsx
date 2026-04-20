import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCircle2, ChevronRight, Loader2, ShieldCheck, CreditCard, ClipboardList } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchBadges } = useContext(AuthContext); // We will build this in AuthContext next!

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('runly_token');
      const res = await axios.get('http://localhost:5000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data);
    } catch (err) {
      console.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = async (alert) => {
    // If unread, mark it as read in the backend
    if (!alert.is_read) {
      try {
        const token = localStorage.getItem('runly_token');
        await axios.put(`http://localhost:5000/api/alerts/${alert.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local state instantly so the red dot goes away
        setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
        
        // Refresh the bottom nav badge count
        if(fetchBadges) fetchBadges();
      } catch (err) { console.error("Failed to mark read", err); }
    }

    // Navigate to the linked page
    if (alert.link_url) {
      navigate(alert.link_url);
    }
  };

  // Helper function to pick the right icon based on the alert type
  const getIcon = (type) => {
    switch(type) {
      case 'errand_accepted': return <ClipboardList className="text-blue-500" size={20}/>;
      case 'errand_progress': return <Loader2 className="text-amber-500 animate-spin-slow" size={20}/>;
      case 'errand_delivered': return <CheckCircle2 className="text-emerald-500" size={20}/>;
      case 'payment_released': return <CreditCard className="text-emerald-500" size={20}/>;
      case 'verification': return <ShieldCheck className="text-indigo-500" size={20}/>;
      default: return <Bell className="text-primary" size={20}/>;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <div className="min-h-screen bg-background pb-24 animate-fadeSlideIn">
      
      {/* HEADER */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border p-5 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Alerts</h1>
        <Bell size={24} className="text-muted-foreground opacity-50" />
      </div>

      {/* ALERTS LIST */}
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border mt-10">
            <Bell size={48} className="mx-auto mb-4 opacity-20 text-muted-foreground" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">All Caught Up</p>
            <p className="text-xs text-muted-foreground mt-1">You have no new alerts.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className={`relative bg-card border ${alert.is_read ? 'border-border/50 opacity-70' : 'border-primary/30 shadow-md'} rounded-[1.5rem] p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/50 transition-all active:scale-95`}
            >
              {/* Red Unread Dot */}
              {!alert.is_read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
              )}

              {/* Icon Container */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${alert.is_read ? 'bg-secondary' : 'bg-primary/10'}`}>
                {getIcon(alert.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pr-4">
                <p className={`text-sm ${alert.is_read ? 'text-muted-foreground font-medium' : 'text-foreground font-bold'}`}>
                  {alert.message}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>

              {/* Chevron */}
              {alert.link_url && <ChevronRight size={18} className="text-muted-foreground shrink-0"/>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;