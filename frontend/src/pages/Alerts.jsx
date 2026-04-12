import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CreditCard, CheckCircle2, Navigation, MessageSquare, AlertCircle, X, ChevronRight } from 'lucide-react';

const Alerts = () => {
  const { user, fetchBadges } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
        setAlerts(res.data);
      } catch (err) { console.error("Failed to load alerts"); }
    };
    if (user) fetchAlerts();
  }, [user]);

  const handleOpenAlert = async (alert) => {
    try {
      // Mark as read in DB
      await axios.put(`http://localhost:5000/api/notifications/read/${alert.id}`);
      
      // Update local state instantly
      setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
      setSelectedAlert(alert);
      
      // Update global Nav badge
      fetchBadges();
    } catch (err) { console.error("Failed to read alert"); }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'accepted': return { icon: Navigation, color: 'text-emerald-500', bg: 'bg-emerald-100' };
      case 'delivered': return { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' };
      case 'payment': return { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-100' };
      default: return { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-100' };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
      </div>
      
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">You have no new alerts.</div>
        ) : (
          alerts.map(alert => {
            const { icon: Icon, color, bg } = getIcon(alert.type);
            const isUnread = !alert.is_read;

            return (
              <div 
                key={alert.id} 
                onClick={() => handleOpenAlert(alert)}
                className={`bg-card border rounded-2xl p-4 shadow-sm flex items-start gap-4 cursor-pointer transition-all ${isUnread ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <div className={`p-3 rounded-full flex-shrink-0 ${bg} ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm truncate pr-2 ${isUnread ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>
                      {alert.title}
                    </h4>
                    {isUnread && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>}
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 leading-snug truncate">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeSlideIn">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl transform transition-transform translate-y-0 relative border border-border">
            <button onClick={() => setSelectedAlert(null)} className="absolute top-4 right-4 p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${getIcon(selectedAlert.type).bg} ${getIcon(selectedAlert.type).color}`}>
              {React.createElement(getIcon(selectedAlert.type).icon, { size: 32 })}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{selectedAlert.title}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{selectedAlert.message}</p>
            <button onClick={() => setSelectedAlert(null)} className="w-full bg-foreground text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition shadow-lg">
              Close <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;