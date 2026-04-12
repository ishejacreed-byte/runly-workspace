import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowLeft, MapPin, Clock, Trash2, CheckCircle, 
  Navigation, PackageCheck, MessageSquare, 
  ShoppingCart, Package, Pill, Shirt, Utensils, Zap 
} from 'lucide-react';

// 🛠️ SMART ICON ENGINE (Synced with Dashboard)
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

const ErrandDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [errand, setErrand] = useState(null);
  const [showReview, setShowReview] = useState(false);

  const fetchErrand = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/errands/${id}`);
      setErrand(res.data);
    } catch (err) {
      console.error("Failed to fetch errand");
    }
  };

  useEffect(() => {
    fetchErrand();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this errand?")) {
      try {
        await axios.delete(`http://localhost:5000/api/errands/${id}`);
        navigate('/'); 
      } catch (err) { 
        alert(err.response?.data?.error || "Failed to delete."); 
      }
    }
  };

 const updateStatus = async (newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/errands/${id}/status`, { status: newStatus });
      fetchErrand(); 
      
      // 🛠️ AUTO-TRIGGER REVIEW MODAL
      if (newStatus === 'completed') {
          setShowReview(true);
      }
    } catch (err) { alert("Update failed"); }
};

  if (!errand || !user) return <div className="p-8 text-center mt-20 text-muted-foreground">Loading details...</div>;

  const isMyErrand = Number(user.id) === Number(errand.customer_id);
  const isMyJob = Number(user.id) === Number(errand.helper_id);
  const catConfig = getCategoryConfig(errand.category);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-foreground">Errand Details</h1>
        
        {/* SECURE DELETE BUTTON */}
        {isMyErrand && (errand.status === 'open' || errand.status === 'posted') ? (
          <button onClick={handleDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition">
            <Trash2 size={20} />
          </button>
        ) : <div className="w-8"></div>}
      </div>

      {/* HERO SECTION (Now using Icons) */}
      <div className={`w-full h-48 flex items-center justify-center relative ${catConfig.bg}`}>
        <catConfig.icon size={80} className={catConfig.color} />
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm uppercase tracking-wider text-primary">
          {errand.status.replace('_', ' ')}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">{errand.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Posted by <span className="font-semibold text-foreground">{errand.customer_name}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <MapPin className="text-primary mt-0.5" size={18} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Pickup</p>
              <p className="text-sm font-medium text-foreground">{errand.pickup_location}</p>
            </div>
          </div>
          <div className="h-px w-full bg-border"></div>
          <div className="flex items-start gap-3">
            <MapPin className="text-amber-500 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Drop-off</p>
              <p className="text-sm font-medium text-foreground">{errand.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* FINANCIALS */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-foreground">Customer Budget</p>
            <p className="text-sm font-bold">€{errand.budget}</p>
          </div>
          <div className="flex justify-between items-center mb-4 text-muted-foreground">
            <p className="text-sm">Platform Fee (15%)</p>
            <p className="text-sm">- €{(errand.budget * 0.15).toFixed(2)}</p>
          </div>
          <div className="h-px w-full bg-border mb-3"></div>
          <div className="flex justify-between items-center">
            <p className="text-base font-bold text-foreground">Helper Earnings</p>
            <p className="text-xl font-black text-primary">€{(errand.budget * 0.85).toFixed(2)}</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-3 mt-8">
          {!isMyErrand && (errand.status === 'open' || errand.status === 'posted') && (
            <button onClick={() => updateStatus('accepted')} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition flex items-center justify-center gap-2">
              <CheckCircle size={20} /> Accept Errand
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'accepted' && (
            <button onClick={() => updateStatus('in_progress')} className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
              <Navigation size={20} /> I'm On The Way
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'in_progress' && (
            <button onClick={() => updateStatus('delivered')} className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-amber-600 transition flex items-center justify-center gap-2">
              <PackageCheck size={20} /> Mark as Delivered
            </button>
          )}

          {!isMyErrand && isMyJob && errand.status === 'delivered' && (
            <div className="w-full bg-secondary text-muted-foreground font-bold py-4 rounded-xl text-center border border-border">
              Waiting for Customer to Release Payment...
            </div>
          )}

          {isMyErrand && (errand.status === 'open' || errand.status === 'posted') && (
            <div className="w-full bg-secondary text-muted-foreground font-bold py-4 rounded-xl text-center border border-border flex items-center justify-center gap-2">
              <Clock size={18} /> Waiting for a Helper...
            </div>
          )}

          {isMyErrand && errand.status === 'delivered' && (
            <button onClick={() => updateStatus('completed')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle size={20} /> Confirm & Release Payment
            </button>
          )}

          {errand.status === 'completed' && (
            <div className="w-full bg-emerald-100 text-emerald-700 font-bold py-4 rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle size={20} /> Errand Completed
            </div>
          )}

          {(isMyErrand || isMyJob) && (errand.status !== 'open' && errand.status !== 'posted') && (
            <button 
              onClick={() => navigate(`/chat/${errand.id}`)}
              className="w-full bg-card border border-border text-foreground font-bold py-4 rounded-xl shadow-sm hover:bg-secondary transition flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} /> Open Chat
            </button>
          )}
          {showReview && (
    <ReviewModal 
        errandId={errand.id} 
        reviewedUserId={isMyErrand ? errand.helper_id : errand.customer_id}
        onClose={() => setShowReview(false)} 
    />
)}
        </div>
      </div>
    </div>
    
  );
};

export default ErrandDetail;