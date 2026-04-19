import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatBudget } from '../Utils/formatters';
import { 
  ArrowLeft, MapPin, Clock, Trash2, CheckCircle, 
  Navigation, PackageCheck, MessageSquare, 
  ShoppingCart, Package, Pill, Shirt, Utensils, Zap,
  Loader2, Wallet, Info, ShieldCheck 
} from 'lucide-react';

// 🛠️ SMART ICON ENGINE
const CATEGORIES = [
  { name: 'Grocery', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Package', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Food', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'Pharmacy', icon: Pill, color: 'text-rose-600', bg: 'bg-rose-100' },
  { name: 'Laundry', icon: Shirt, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Other', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' }
];

const getCategoryConfig = (categoryName) => {
  return CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[CATEGORIES.length - 1];
};

const ErrandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [errand, setErrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/errands/${id}`);
      setErrand(res.data);
    } catch (err) { console.error("Error fetching details"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this errand?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/errands/${id}`);
      navigate('/'); 
    } catch (err) { alert("Delete failed."); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/errands/${id}/status`, { status: newStatus });
      fetchDetails(); 
      if (newStatus === 'completed') setShowReview(true);
    } catch (err) { alert("Update failed"); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;
  if (!errand) return <div className="p-10 text-center text-muted-foreground uppercase font-black">Errand not found</div>;

  const isMyErrand = Number(user.id) === Number(errand.customer_id);
  const isMyJob = Number(user.id) === Number(errand.helper_id);
  const catConfig = getCategoryConfig(errand.category);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fadeSlideIn">
      {/* HEADER */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition"><ArrowLeft size={20} /></button>
        <h1 className="font-black text-xs uppercase tracking-widest">Errand Details</h1>
        {isMyErrand && (errand.status === 'open' || errand.status === 'posted') ? (
          <button onClick={handleDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition"><Trash2 size={20} /></button>
        ) : <div className="w-10"></div>}
      </div>

      {/* HERO SECTION */}
      <div className={`w-full h-52 flex flex-col items-center justify-center relative ${catConfig.bg} overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <catConfig.icon size={300} className="absolute -top-20 -right-20 rotate-12" />
        </div>
        <catConfig.icon size={100} className={`${catConfig.color} drop-shadow-sm`} strokeWidth={1.5} />
        <div className="mt-4 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black shadow-sm uppercase tracking-widest text-primary border border-primary/10">
          {errand.status.replace('_', ' ')}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 -mt-6 bg-background rounded-t-[3rem] relative z-10">
        <div>
          <h2 className="text-3xl font-black text-foreground leading-tight tracking-tight">{errand.title}</h2>
          
          {/* 🟢 CLICKABLE CUSTOMER NAME */}
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Requested by{' '}
            <span 
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${errand.customer_id}`); }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              {errand.customer_name}
            </span>
          </p>

          {/* 🟢 NEW: CLICKABLE HELPER NAME (If assigned) */}
          {errand.helper_id && (
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Assigned to{' '}
              <span 
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${errand.helper_id}`); }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                {errand.helper_name || "A Helper"}
              </span>
            </p>
          )}
        </div>

        {/* LOGISTICS CARD */}
        <div className="bg-card border border-border rounded-[2rem] p-6 space-y-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Pickup From</p>
              <p className="text-sm font-bold text-foreground">{errand.pickup_location}</p>
            </div>
          </div>
          <div className="h-px w-full bg-border/50 ml-14"></div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <Navigation size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Drop-off To</p>
              <p className="text-sm font-bold text-foreground">{errand.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* FINANCIALS CARD */}
        <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Budget</p>
            <p className="text-sm font-black">€{formatBudget(errand.budget)}</p>
          </div>
          <div className="flex justify-between items-center mb-4 text-muted-foreground">
            <p className="text-xs font-medium">Platform Fee (15%)</p>
            <p className="text-xs font-bold">- €{(errand.budget * 0.15).toFixed(2)}</p>
          </div>
          <div className="h-px w-full bg-border mb-4"></div>
          <div className="flex justify-between items-center bg-primary/5 -mx-6 -mb-6 p-6">
            <p className="text-sm font-black text-foreground uppercase tracking-widest">Helper Earnings</p>
            <p className="text-3xl font-black text-primary">€{(errand.budget * 0.85).toFixed(2)}</p>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Task Info</h3>
            <div className="bg-secondary/30 p-5 rounded-3xl border border-border">
                <p className="text-sm text-foreground leading-relaxed font-medium italic">"{errand.description}"</p>
                <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12}/> {errand.urgency}</span>
                    <span className="flex items-center gap-1"><Info size={12}/> {errand.category}</span>
                </div>
            </div>
        </div>

        {/* DYNAMIC CONTROL FLOW */}
        <div className="space-y-3 pt-4">
          {!isMyErrand && (errand.status === 'open' || errand.status === 'posted') && (
            <button onClick={() => updateStatus('accepted')} className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition">
              <CheckCircle size={22} /> Accept Errand
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'accepted' && (
            <button onClick={() => updateStatus('in_progress')} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition">
              <Navigation size={22} /> I'm On The Way
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'in_progress' && (
            <button onClick={() => updateStatus('delivered')} className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-200 flex items-center justify-center gap-3 active:scale-95 transition">
              <PackageCheck size={22} /> Mark as Delivered
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'delivered' && (
            <div className="w-full bg-secondary/50 text-muted-foreground font-black py-5 rounded-2xl text-center border-2 border-dashed border-border text-xs uppercase tracking-widest">
              Awaiting Payment Release...
            </div>
          )}

          {isMyErrand && errand.status === 'delivered' && (
            <button onClick={() => updateStatus('completed')} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 animate-pulse active:scale-95 transition">
              <CheckCircle size={22} /> Confirm & Release Payment
            </button>
          )}

          {errand.status === 'completed' && (
            <div className="w-full bg-emerald-100 text-emerald-700 font-black py-5 rounded-2xl text-center border border-emerald-200 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
              <ShieldCheck size={20} /> Transaction Finalized
            </div>
          )}

          {(isMyErrand || isMyJob) && (errand.status !== 'open' && errand.status !== 'posted') && (
            <button 
              onClick={() => navigate(`/chat/${errand.id}`)}
              className="w-full bg-white border border-border text-foreground font-black py-4 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-secondary transition"
            >
              <MessageSquare size={20} /> Open Conversation
            </button>
          )}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {showReview && (
        <ReviewModal 
          errandId={errand.id} 
          reviewedUserId={isMyErrand ? errand.helper_id : errand.customer_id}
          onClose={() => setShowReview(false)} 
        />
      )}
    </div>
  );
};

export default ErrandDetails;