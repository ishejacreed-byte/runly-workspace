import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 🟢 Added useNavigate
import { User, Ban, ShieldCheck, Mail, Search, ShieldAlert, Loader2 } from 'lucide-react';

const UserDirectory = ({ getTokenConfig }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // 🟢 Initialized navigate

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', getTokenConfig());
      console.log("🔥 Users loaded from DB:", res.data); // <-- Check your browser console!
      setUsers(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch directory. Check your backend terminal for SQL errors.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBan = async (userId, currentStatus) => {
    const action = currentStatus ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/ban`, { is_banned: !currentStatus }, getTokenConfig());
      fetchUsers();
    } catch (err) {
      alert("Action failed. Make sure you are the SUPER_ADMIN.");
    }
  };

  // 🛡️ BULLETPROOF FILTER: Won't crash if a user has a NULL name or email
  const filteredUsers = users.filter(u => {
    const safeName = (u.name || 'Unknown User').toLowerCase();
    const safeEmail = (u.email || 'No Email').toLowerCase();
    const search = searchTerm.toLowerCase();
    return safeName.includes(search) || safeEmail.includes(search);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-[2rem] p-4 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="text-muted-foreground ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="bg-transparent border-none outline-none flex-1 font-medium text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition">
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* 🟢 CLICKABLE AVATAR */}
              <div 
                onClick={() => navigate(`/profile/${u.id}`)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner cursor-pointer hover:scale-105 transition-transform ${u.is_banned ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
                title={`View ${u.name || 'User'}'s Profile`}
              >
                {u.is_banned ? <ShieldAlert size={24}/> : <User size={24}/>}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  {/* 🟢 CLICKABLE NAME */}
                  <h4 
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="font-black text-foreground cursor-pointer hover:underline hover:text-primary transition-colors"
                  >
                    {u.name || 'Unknown User'}
                  </h4>
                  {u.v_status === 'verified' && <ShieldCheck size={14} className="text-emerald-500" title="Verified ID" />}
                  {u.system_role && <span className="bg-foreground text-background text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{u.system_role}</span>}
                </div>
                <p className="text-xs font-medium text-muted-foreground">{u.email || 'No email provided'}</p>
                <div className="flex gap-3 mt-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <span>Trust Score: <span className={u.trust_score < 50 ? 'text-rose-500' : 'text-emerald-500'}>{u.trust_score || 100}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none p-3 bg-secondary rounded-xl hover:text-primary transition active:scale-95" title="Message User">
                <Mail size={18}/>
              </button>
              <button 
                onClick={() => handleBan(u.id, u.is_banned)}
                className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 active:scale-95 ${u.is_banned ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
              >
                <Ban size={16}/> {u.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>

          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-muted-foreground font-black uppercase tracking-widest">
            No users found in database.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;