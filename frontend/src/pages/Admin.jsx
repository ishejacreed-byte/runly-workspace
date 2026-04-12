import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, ShieldAlert, User, Check, X, 
  MessageSquare, Mail, Trash2, Eye, Loader2, AlertOctagon 
} from 'lucide-react';

const Admin = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('verifications');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ DUAL-HEADER FIX: Guaranteed Token acceptance for Admin routes
  const getTokenConfig = () => {
    const token = localStorage.getItem('runly_token');
    return { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      } 
    };
  };

  const fetchAdminData = async (tab) => {
    setLoading(true);
    try {
      // Maps the tab name to your backend endpoints
      const endpoint = tab === 'verifications' ? '/api/admin/verifications' : '/api/reports/admin/all';
      const res = await axios.get(`http://localhost:5000${endpoint}`, getTokenConfig());
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      // If 403, it means the user needs to log out and back in to refresh their Admin status
      if (err.response?.status === 403) {
        alert("Access Denied: Please log out and log back in to refresh your Admin session.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData(activeTab);
    }
  }, [activeTab, user]);

  const handleAction = async (id, action, type) => {
    if (!window.confirm(`Are you sure you want to ${action} this?`)) return;
    
    try {
      if (type === 'verify') {
        await axios.put(`http://localhost:5000/api/admin/verify/${id}`, { status: action }, getTokenConfig());
      }
      fetchAdminData(activeTab); // Refresh the list after action
    } catch (err) {
      alert("Action failed. Check console for details.");
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertOctagon size={48} className="text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view the Command Center.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-destructive/10 text-destructive rounded-2xl">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground">System Administration & Safety</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 bg-card p-1 rounded-2xl border border-border shadow-sm">
        {['verifications', 'reports', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-foreground text-background shadow-lg scale-[1.02]' 
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest">Scanning Database...</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* VERIFICATIONS TAB */}
          {activeTab === 'verifications' && (
            data.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No pending verification requests.</p>
              </div>
            ) : (
              data.map(item => (
                <div key={item.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Pending Review</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">ID Document</p>
                      <img 
                        src={item.id_url} 
                        className="rounded-xl h-32 w-full object-cover border border-border cursor-pointer hover:opacity-90 transition" 
                        onClick={() => window.open(item.id_url)} 
                        alt="ID"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Selfie</p>
                      <img 
                        src={item.selfie_url} 
                        className="rounded-xl h-32 w-full object-cover border border-border cursor-pointer hover:opacity-90 transition" 
                        onClick={() => window.open(item.selfie_url)} 
                        alt="Selfie"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(item.id, 'verified', 'verify')} 
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition active:scale-95"
                    >
                      <Check size={18} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, 'rejected', 'verify')} 
                      className="flex-1 bg-destructive/10 text-destructive font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive/20 transition active:scale-95"
                    >
                      <X size={18} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
             data.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Zero reports found. The community is safe!</p>
              </div>
             ) : (
               data.map(report => (
                 <div key={report.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                   <div className="flex items-center gap-2 text-destructive font-black text-xs uppercase tracking-widest">
                     <ShieldAlert size={14} /> {report.category}
                   </div>
                   <p className="text-sm text-foreground italic bg-secondary/30 p-3 rounded-xl border border-border">
                     "{report.description}"
                   </p>
                   <div className="flex justify-between items-center pt-2">
                     <div className="text-[10px] text-muted-foreground">
                       Reporter: <span className="font-bold text-foreground">{report.reporter_name}</span><br/>
                       Target: <span className="font-bold text-destructive">{report.reported_user_name}</span>
                     </div>
                     <div className="flex gap-2">
                       <button className="p-2 bg-secondary rounded-full hover:text-primary transition" title="Message User"><Mail size={16}/></button>
                       <button className="p-2 bg-secondary rounded-full hover:text-destructive transition" title="Dismiss Report"><Trash2 size={16}/></button>
                     </div>
                   </div>
                 </div>
               ))
             )
          )}

          {/* USERS TAB - Placeholder for User Management */}
          {activeTab === 'users' && (
            <div className="text-center py-10 text-muted-foreground">
              <User size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">User search and management coming in next patch.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Admin;