import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { ShoppingCart, Package, Pill, Shirt, Utensils, Zap, MapPin, Clock, Plus, ChevronRight, X } from 'lucide-react';

const CATEGORIES = [
  { name: 'Grocery', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Package', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Food', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'Pharmacy', icon: Pill, color: 'text-rose-600', bg: 'bg-rose-100' },
  { name: 'Laundry', icon: Shirt, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Other', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' }
];

const URGENCY_FILTERS = ['Any', 'ASAP', '1 Hour', 'Scheduled'];

// 🛠️ SMART ICON ENGINE: Now globally accessible within this file
const getCategoryConfig = (categoryName) => {
  return CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[CATEGORIES.length - 1];
};

const Dashboard = () => {
  const { user, roleMode, toggleRole, logout } = useContext(AuthContext);
  const navigate = useNavigate(); 
  
  const [feedErrands, setFeedErrands] = useState([]);
  const [myErrands, setMyErrands] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeUrgency, setActiveUrgency] = useState('Any');
  
  const [showPostForm, setShowPostForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', 
    description: 'No description provided', 
    category: 'Package', 
    urgency: 'ASAP', 
    pickup_location: '', 
    dropoff_location: '', 
    budget: ''
  });

  // 🛠️ DUAL-HEADER FIX: Guaranteed Token acceptance
  const getTokenConfig = () => {
    const token = localStorage.getItem('runly_token');
    return { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      } 
    };
  };

  useEffect(() => {
    if (!user) return;
    fetchFeedErrands();
    fetchMyErrands();
  }, [roleMode, user]);

  const fetchFeedErrands = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/errands', getTokenConfig());
      setFeedErrands(res.data);
    } catch (err) { 
      console.error("Failed to fetch feed", err);
      if (err.response?.status === 401) handleAuthError();
    }
  };

  const fetchMyErrands = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/errands/me', getTokenConfig());
      setMyErrands(res.data);
    } catch (err) { 
      console.error("Failed to fetch my errands", err);
      if (err.response?.status === 401) handleAuthError();
    }
  };

  const handleAuthError = () => {
    logout();
    navigate('/login');
  };

  const handlePostErrand = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/errands', formData, getTokenConfig());
      setFormData({ title: '', description: 'No description provided', category: 'Package', urgency: 'ASAP', pickup_location: '', dropoff_location: '', budget: '' });
      setShowPostForm(false);
      fetchMyErrands(); 
      fetchFeedErrands(); 
    } catch (err) { 
      const exactError = err.response?.data?.msg || err.response?.data?.error || err.message;
      alert(`Failed to post: ${exactError}`);
    }
  };

  const filteredErrands = feedErrands.filter(e => {
    const matchCat = activeCategory === 'All' || e.category.includes(activeCategory);
    const matchUrg = activeUrgency === 'Any' || e.urgency === activeUrgency;
    return matchCat && matchUrg;
  });

  const displayName = user?.name?.split(' ')[0] || user?.username?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      
      {/* HEADER & GLOBAL ROLE TOGGLE */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {displayName} <span className="text-2xl">👋</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 border border-border rounded-full p-1 bg-card shadow-sm">
          <span className={`text-sm font-medium pl-3 pr-1 transition-colors ${roleMode === 'helper' ? 'text-muted-foreground' : 'text-foreground'}`}>
            {roleMode === 'customer' ? 'Customer' : 'Helper'}
          </span>
          <button 
            onClick={toggleRole} 
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${roleMode === 'helper' ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${roleMode === 'helper' ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {/* ================= CUSTOMER VIEW ================= */}
      {roleMode === 'customer' && (
        <div className="animate-fadeSlideIn">
          <div onClick={() => setShowPostForm(true)} className="bg-primary rounded-2xl p-5 mb-8 text-primary-foreground shadow-lg flex justify-between items-center cursor-pointer hover:bg-primary/90 transition transform active:scale-95">
            <div>
              <h2 className="text-xl font-bold mb-1">Request an Errand</h2>
              <p className="text-primary-foreground/80 text-sm">Get help with anything nearby</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Plus size={24} className="text-white" />
            </div>
          </div>

          <h3 className="text-sm font-bold text-muted-foreground tracking-wider mb-3">QUICK REQUEST</h3>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.name} 
                onClick={() => {
                   setFormData({...formData, category: cat.name});
                   setShowPostForm(true);
                }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:border-primary/50 transition"
              >
                <div className={`p-3 rounded-xl ${cat.bg} ${cat.color}`}><cat.icon size={20} /></div>
                <span className="text-xs font-semibold text-foreground">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-muted-foreground tracking-wider">ACTIVE ERRANDS</h3>
            <button onClick={() => navigate('/tasks')} className="text-primary text-sm font-bold flex items-center">View all <ChevronRight size={16}/></button>
          </div>
          
          <div className="space-y-3">
            {myErrands
              .filter(e => e.status !== 'completed') 
              .slice(0, 3) 
              .map(errand => {
                const catConfig = getCategoryConfig(errand.category);
                return (
                  <div key={errand.id} onClick={() => navigate(`/errand/${errand.id}`)} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/50 transition">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${catConfig.bg} ${catConfig.color}`}>
                      <catConfig.icon size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{errand.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase">{errand.status.replace('_', ' ')}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">{errand.urgency}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1">
                        <div className="flex items-center gap-1"><MapPin size={12}/> {errand.dropoff_location}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0"><p className="font-bold text-primary text-lg">€{errand.budget}</p></div>
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* ================= HELPER VIEW ================= */}
      {roleMode === 'helper' && (
        <div className="animate-fadeSlideIn">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button onClick={() => setActiveCategory('All')} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeCategory === 'All' ? 'bg-primary text-white shadow-md' : 'bg-card border border-border text-foreground hover:bg-secondary'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCategory === cat.name ? 'border-2 border-primary bg-primary/5' : 'bg-card border border-border text-foreground hover:bg-secondary'}`}>
                <cat.icon size={16} className={cat.color} /> {cat.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
            {URGENCY_FILTERS.map(urgency => (
              <button key={urgency} onClick={() => setActiveUrgency(urgency)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeUrgency === urgency ? 'bg-blue-500 text-white shadow-sm' : 'bg-card border border-border text-foreground hover:bg-secondary'}`}>
                {urgency === 'ASAP' && <Zap size={12} className="inline mr-1 text-orange-500"/>}
                {urgency === '1 Hour' && <Clock size={12} className="inline mr-1"/>}
                {urgency}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-muted-foreground tracking-wider">AVAILABLE NEARBY</h3>
          </div>
          
          <div className="space-y-3">
            {filteredErrands.map(errand => {
              const catConfig = getCategoryConfig(errand.category);
              return (
                <div key={errand.id} onClick={() => navigate(`/errand/${errand.id}`)} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:border-primary/50 transition cursor-pointer">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${catConfig.bg} ${catConfig.color}`}>
                    <catConfig.icon size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-sm truncate">{errand.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase">{errand.status.replace('_', ' ')}</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">{errand.urgency}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1"><MapPin size={12}/> {errand.pickup_location}</div>
                      <div className="flex items-center gap-1"><Clock size={12}/> {new Date(errand.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0"><p className="font-bold text-primary text-lg">€{errand.helper_earnings}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= POST ERRAND MODAL ================= */}
      {showPostForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeSlideIn">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-border">
            <button onClick={() => setShowPostForm(false)} className="absolute top-4 right-4 p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-foreground">What do you need done?</h2>
            
            <form onSubmit={handlePostErrand} className="space-y-4">
              <input type="text" placeholder="E.g., Pick up 2 bags of ice" required className="w-full p-3 border border-border rounded-lg bg-background text-sm"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-3 border border-border rounded-lg bg-background text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select className="w-full p-3 border border-border rounded-lg bg-background text-sm" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                  {URGENCY_FILTERS.slice(1).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <input type="text" placeholder="Pickup Address" required className="w-full p-3 border border-border rounded-lg bg-background text-sm"
                value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} />
              <input type="text" placeholder="Drop-off Address" required className="w-full p-3 border border-border rounded-lg bg-background text-sm"
                value={formData.dropoff_location} onChange={e => setFormData({...formData, dropoff_location: e.target.value})} />
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Your Total Budget (€)</label>
                <input type="number" placeholder="15.00" required className="w-full p-3 border border-border rounded-lg bg-background text-lg font-semibold text-primary"
                  value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-foreground text-background font-bold py-3 rounded-xl shadow-md hover:bg-foreground/90 transition">
                Post Errand
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;