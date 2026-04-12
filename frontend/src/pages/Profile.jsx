import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  ShieldCheck, Star, Wallet, Camera, CheckCircle, 
  MapPin, Edit2, LogOut, CreditCard, TrendingDown, X, Loader2 
} from 'lucide-react';
import VerificationFlow from '../components/VerificationFlow';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', location: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/profile/${user.id}`);
      setProfile(res.data);
      setEditForm({ bio: res.data.bio || '', location: res.data.location || '' });
    } catch (err) { console.error("Load failed"); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpload = () => {
    window.cloudinary.openUploadWidget({ 
      cloudName: 'dybe866xr', 
      uploadPreset: 'runly_profiles' 
    }, async (error, result) => {
      if (!error && result && result.event === "success") {
        await axios.put('http://localhost:5000/api/profile/picture', { url: result.info.secure_url });
        fetchProfile();
      }
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await axios.put('http://localhost:5000/api/profile/update', editForm);
      setShowEdit(false);
      fetchProfile();
    } catch (err) { alert("Update failed"); }
    finally { setIsSaving(false); }
  };

  if (!profile) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-24 p-4 space-y-5">
      
      {/* Profile Card */}
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center relative">
        <button onClick={() => setShowEdit(true)} className="absolute top-4 right-4 p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition">
          <Edit2 size={16} />
        </button>

        <div className="relative w-24 h-24 mx-auto mb-4">
          <img 
            src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}`} 
            className="w-24 h-24 rounded-full border-4 border-primary object-cover" 
          />
          <button onClick={handleUpload} className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-2 border-card">
            <Camera size={14} />
          </button>
        </div>

        <h2 className="text-2xl font-black text-foreground">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        
        {profile.location && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin size={12} /> {profile.location}
          </div>
        )}
        
        {profile.bio && <p className="text-sm text-muted-foreground mt-3 italic">"{profile.bio}"</p>}

        <div className="flex flex-col items-center mt-4">
          {profile.v_status === 'verified' ? (
            <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full">
              <ShieldCheck size={14} /> Verified Member
            </span>
          ) : (
            <div className="text-center">
              <button onClick={() => setShowVerify(true)} className="text-xs font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full hover:bg-primary/20 transition">
                {profile.v_status === 'pending' ? 'Verification Pending...' : 'Get Verified ✅'}
              </button>
              {profile.v_status === 'rejected' && <p className="text-[10px] text-destructive mt-1 font-bold">Previous attempt rejected. Try again.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border text-center shadow-sm">
          <Star className="mx-auto mb-1 text-amber-500" size={18} fill="currentColor" />
          <p className="text-lg font-black">{parseFloat(profile.avg_rating || 0).toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rating</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border text-center shadow-sm">
          <CheckCircle className="mx-auto mb-1 text-emerald-500" size={18} />
          <p className="text-lg font-black">{profile.jobs_done || 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Jobs</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border text-center shadow-sm">
          <Wallet className="mx-auto mb-1 text-blue-500" size={18} />
          <p className="text-lg font-black">{profile.review_count || 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reviews</p>
        </div>
      </div>

      {/* Wallet & Earnings (Merged Logic) */}
      <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest text-muted-foreground">
          <Wallet size={16}/> Finance Dashboard
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available for Payout</p>
            <h4 className="text-2xl font-black text-emerald-700">€{Number(profile.total_earned || 0).toFixed(2)}</h4>
            <button className="w-full mt-3 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition">Cash Out</button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Lifetime Spending</p>
             <h4 className="text-xl font-black text-blue-700">€{Number(profile.total_spent || 0).toFixed(2)}</h4>
            </div>
            <div className="p-3 bg-blue-200/50 rounded-xl text-blue-700"><CreditCard size={20}/></div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Recent Feedback</h3>
        {profile.reviews.length > 0 ? profile.reviews.map(rev => (
          <div key={rev.id} className="bg-card p-4 rounded-2xl border border-border flex gap-3 shadow-sm">
            <img src={rev.reviewer_pic || `https://ui-avatars.com/api/?name=${rev.reviewer_name}`} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="font-bold text-sm text-foreground">{rev.reviewer_name}</p>
                <div className="flex text-amber-500 gap-0.5"><Star size={10} fill="currentColor"/> <span className="text-xs font-bold">{rev.rating}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">"{rev.comment}"</p>
            </div>
          </div>
        )) : <p className="text-center text-xs text-muted-foreground py-4">No reviews yet.</p>}
      </div>

      {/* Logout Button */}
      <button onClick={logout} className="w-full bg-secondary text-foreground font-bold py-4 rounded-2xl border border-border flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition">
        <LogOut size={18} /> Sign Out
      </button>

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border border-border shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-secondary rounded-full"><X/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Location</label>
                <input 
                  type="text" 
                  value={editForm.location} 
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  placeholder="e.g. Brussels, BE"
                  className="w-full p-3 mt-1 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Bio</label>
                <textarea 
                  rows="3"
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="Tell people a bit about yourself..."
                  className="w-full p-3 mt-1 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerify && <VerificationFlow onClose={() => setShowVerify(false)} onRefresh={fetchProfile} />}
    </div>
  );
};

export default Profile;