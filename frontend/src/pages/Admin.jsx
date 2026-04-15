import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, ShieldAlert, User, LogOut, LayoutDashboard, Loader2, AlertOctagon 
} from 'lucide-react';

// 🟢 IMPORT ALL 3 MODULES
import VerificationQueue from './admin/VerificationQueue';
import ReportsDesk from './admin/ReportsDesk';
import UserDirectory from './admin/UserDirectory'; 

const Admin = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('verifications');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTokenConfig = () => {
    const token = localStorage.getItem('runly_token');
    return { headers: { 'Authorization': `Bearer ${token}`, 'x-auth-token': token } };
  };

  const fetchAdminData = async (tab) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tab === 'verifications') endpoint = '/api/admin/verifications';
      else if (tab === 'reports') endpoint = '/api/reports/admin/all';
      
      // 🟢 Skip fetching here for 'users', because UserDirectory.jsx fetches its own data!
      if (tab === 'users') {
        setLoading(false);
        return;
      }

      if (endpoint) {
        const res = await axios.get(`http://localhost:5000${endpoint}`, getTokenConfig());
        setData(res.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        console.error("403 Forbidden: Your database role is not SUPER_ADMIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) fetchAdminData(activeTab);
  }, [activeTab, user]);

  // 🛡️ FRONTEND BOUNCER: If the user context says they aren't an admin, block them entirely.
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <AlertOctagon size={64} className="text-destructive mb-4" />
        <h1 className="text-3xl font-black uppercase tracking-tight">Security Lockout</h1>
        <p className="text-muted-foreground font-medium mt-2">You do not have Operations clearance.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
    { id: 'reports', label: 'Safety Reports', icon: ShieldAlert },
    { id: 'users', label: 'User Directory', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row animate-fadeSlideIn">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="w-full md:w-72 bg-card border-r border-border p-6 hidden md:flex flex-col min-h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-foreground text-background rounded-2xl shadow-lg">
            <LayoutDashboard size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest">Runly Ops</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Command Center</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-foreground text-background shadow-md' 
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon size={18} strokeWidth={2.5} /> {tab.label}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="mt-auto w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition active:scale-95">
          <LogOut size={18} strokeWidth={2.5} /> Exit System
        </button>
      </aside>

      {/* MOBILE TOP NAVIGATION */}
      <div className="md:hidden bg-card border-b border-border p-4 flex gap-2 overflow-x-auto pb-4 pt-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <header className="mb-8 hidden md:block">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="animate-spin mb-4 text-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Syncing Database...</p>
          </div>
        ) : (
          <div className="w-full">
            {activeTab === 'verifications' && (
              <VerificationQueue data={data} refreshData={fetchAdminData} getTokenConfig={getTokenConfig} />
            )}
            
            {activeTab === 'reports' && (
              <ReportsDesk data={data} />
            )}

            {/* 🟢 THE REAL USER DIRECTORY IS NOW RENDERED HERE */}
            {activeTab === 'users' && (
              <UserDirectory getTokenConfig={getTokenConfig} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;