import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom'; 
import axios from 'axios';
import { 
  ShieldCheck, Star, Wallet, Camera, CheckCircle, 
  MapPin, Pencil, LogOut, CreditCard, TrendingDown, 
  TrendingUp, X, Loader2, CalendarDays, Plus, ClipboardList, UserRound
} from 'lucide-react';
import VerificationFlow from '../components/VerificationFlow';
import { formatBudget } from '../Utils/formatters';
import ReviewCard from "../components/Reviewcard";

const Profile = () => {
  const { user, logout, roleMode } = useContext(AuthContext); 
  const navigate = useNavigate(); 
  const { id } = useParams(); // 🟢 Extracts the ID from the URL (e.g., /profile/123)

  // 🟢 DYNAMIC LOGIC: If an ID is in the URL, fetch that user. Otherwise, fetch ME.
  const targetProfileId = id || user.id;
  const isMyProfile = !id || String(id) === String(user.id);

  const [profile, setProfile] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', location: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  // Review State
  const [ratingValue, setRatingValue] = useState(5);
  const [comment, setComment] = useState("");
  const [latestReviews, setLatestReviews] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); 

  const getNextPayoutDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    return targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const submitReview = async () => {
    if (!comment.trim()) return alert("Please write a review first.");
    
    setIsSubmittingReview(true); 
    
    try {
      const token = localStorage.getItem('runly_token');
      const res = await axios.post(
        `http://localhost:5000/api/reviews`,
        { targetUserId: profile.id, rating: ratingValue, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLatestReviews(prev => [res.data, ...prev]);
      setComment("");
      setRatingValue(5);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false); 
    }
  };

  const fetchProfile = async () => {
    try {
      // 🟢 FETCH THE TARGET PROFILE
      const res = await axios.get(`http://localhost:5000/api/profile/${targetProfileId}`);
      setProfile(res.data);
      setEditForm({ bio: res.data.bio || '', location: res.data.location || '' });
    } catch (err) { console.error("Load failed", err); }
  };

  // 🟢 Re-fetch if the URL ID changes
  useEffect(() => { fetchProfile(); }, [targetProfileId]);
  
  useEffect(() => {
    if (!profile) return; 

    const fetchLatestReviews = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reviews/latest/${profile.id}`);
        setLatestReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch latest reviews");
      }
    };

    fetchLatestReviews();
  }, [profile]);

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

  const completedCount = roleMode === "customer" ? profile.errands_posted : profile.jobs_done;

  return (
    <div className="min-h-screen bg-background pb-24 p-4 space-y-6 animate-fadeSlideIn">
      
      {/* PAGE TITLE */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl font-black text-foreground">
          {isMyProfile ? "Profile" : `${profile.name}'s Profile`}
        </h1>
        {profile.is_admin && (
           <span className="text-[10px] bg-destructive/10 text-destructive font-black px-2 py-1 rounded-md uppercase tracking-tighter">Admin Access</span>
        )}
      </div>

      {/* PROFILE HERO CARD */}
      <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm text-center relative overflow-hidden">
        
        {/* 🟢 HIDE EDIT BUTTON FROM STRANGERS */}
        {isMyProfile && (
          <button onClick={() => setShowEdit(true)} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full text-muted-foreground hover:text-foreground transition z-10">
            <Pencil size={16} />
          </button>
        )}

        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center bg-muted overflow-hidden">
             {profile.profile_picture ? (
               <img src={profile.profile_picture} className="w-full h-full object-cover" alt="avatar" />
             ) : (
               <span className="text-3xl font-bold text-primary">{profile.name?.[0]?.toUpperCase()}</span>
             )}
          </div>
          
          {/* 🟢 HIDE UPLOAD BUTTON FROM STRANGERS */}
          {isMyProfile && (
            <button onClick={handleUpload} className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-2 border-card shadow-lg">
              <Camera size={12} />
            </button>
          )}
        </div>

        <h2 className="text-2xl font-black text-foreground">{profile.name}</h2>
        
        {/* 🟢 HIDE EMAIL FROM STRANGERS (Privacy) */}
        {isMyProfile && (
          <p className="text-sm text-muted-foreground font-medium">{profile.email}</p>
        )}
        
        {/* ⭐ RATING SYSTEM */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={16} fill="currentColor" strokeWidth={0} />
            <span className="font-bold text-sm">{Number(profile.avg_rating).toFixed(1)}</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            ({profile.review_count})
          </span>
        </div>

        <p className="text-xs text-muted-foreground font-bold mt-1">
          {completedCount} Jobs Completed
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          
          {/* 🟢 UPGRADED VERIFICATION BADGE (Now handles Pending state!) */}
          <div 
            onClick={() => {
              // Only open the upload flow if they are NOT verified AND NOT pending
              if (isMyProfile && profile.v_status !== 'verified' && profile.v_status !== 'pending') {
                setShowVerify(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              profile.v_status === 'verified' 
                ? 'bg-emerald-100 text-emerald-700' 
                : profile.v_status === 'pending'
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed' // 🟡 YELLOW PENDING STATE
                  : isMyProfile
                    ? 'bg-rose-100 text-rose-700 cursor-pointer hover:bg-rose-200 shadow-sm animate-pulse'
                    : 'bg-muted text-muted-foreground'
            }`}
          >
            <ShieldCheck size={12} strokeWidth={3} />
            {profile.v_status === 'verified' 
              ? "Verified" 
              : profile.v_status === 'pending' 
                ? "Pending Review" 
                : (isMyProfile ? "Verify Account" : "Not Verified")
            }
          </div>

          {profile.location && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/50 rounded-full text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <MapPin size={12} /> {profile.location}
            </div>
          )}
        </div>
      </div>

      {/* 🟢 HIDE ENTIRE FINANCIAL AND PAYMENT SECTIONS FROM STRANGERS */}
      {isMyProfile && (
        <>
          {/* DYNAMIC EARNINGS/SPENDING VIEW */}
          {roleMode === "helper" ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 px-1">
                <Wallet size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Earnings</h3>
              </div>

              {/* Main Balance Card */}
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mb-1">Available Balance</p>
                <h4 className="text-4xl font-black text-emerald-600 mb-4">
                  €{formatBudget(profile.total_earned)}
                </h4>
                
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700/70 bg-white/50 w-fit px-3 py-2 rounded-xl">
                  <CalendarDays size={14} />
                  <span>Next payout: <strong>{getNextPayoutDate()}</strong></span>
                </div>

                <button className="w-full mt-6 bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition flex flex-col items-center">
                  <span>Cash Out Immediately</span>
                  <span className="text-[9px] opacity-80 font-medium">15% processing fee applies for instant transfers</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <TrendingUp size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">This Week</span>
                  </div>
                  <p className="text-xl font-black text-foreground">€{formatBudget(profile.total_earned)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{profile.jobs_done} tasks</p>
                </div>

                <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <Wallet size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">All Time</span>
                  </div>
                  <p className="text-xl font-black text-foreground">€{formatBudget(profile.total_earned)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{profile.jobs_done} tasks total</p>
                </div>
              </div>
              <p className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                Free scheduled payouts every Monday · Instant cashout available 24/7
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="flex items-center gap-2 px-1">
                 <TrendingDown size={14} className="text-muted-foreground" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Spending History</h3>
               </div>
               <div className="bg-card p-5 rounded-[2rem] border border-border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                      <TrendingDown size={24} strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Spent</p>
                      <h4 className="text-2xl font-black text-foreground">€{formatBudget(profile.total_spent)}</h4>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">{profile.errands_posted} errands paid</p>
               </div>
            </div>
          )}

          {/* PAYMENT METHODS SECTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Methods</h3>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                <Plus size={12} strokeWidth={3} /> Add
              </button>
            </div>

            <div className="bg-card border-2 border-dashed border-border rounded-[2rem] p-8 text-center">
              <p className="text-sm font-bold text-foreground mb-1">No payment methods added</p>
              <p className="text-xs text-muted-foreground">Add one to post errands or receive payments</p>
            </div>
          </div>
        </>
      )}

      {/* ⭐ USER REVIEWS SECTION (Visible to everyone) */}
      <div className="space-y-4 mt-6">
        <div className="flex items-center gap-2 px-1">
          <UserRound size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reviews</h3>
        </div>

        {profile.reviews && profile.reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No reviews yet.</p>
        )}

        {latestReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}

        <button
          onClick={() => navigate(`/reviews/${profile.id}`)}
          className="text-blue-600 underline mt-2 text-sm font-medium"
        >
          See all reviews
        </button>
      </div>

      {/* 🟢 LEAVE A REVIEW (ONLY Show if visiting someone else!) */}
      {!isMyProfile && (
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm mt-4">
          <h3 className="text-sm font-bold mb-3">Leave a Review</h3>

          <select 
            className="w-full p-3 bg-background border border-border rounded-xl mb-3 outline-none focus:ring-2 focus:ring-primary/20"
            value={ratingValue}
            onChange={(e) => setRatingValue(Number(e.target.value))}
          >
            <option value={5}>5 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={2}>2 Stars</option>
            <option value={1}>1 Star</option>
          </select>

          <textarea
            rows="3"
            className="w-full p-3 bg-background border border-border rounded-xl mb-3 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder={`Write a review for ${profile.name}...`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button 
            onClick={submitReview}
            disabled={isSubmittingReview}
            className="w-full bg-primary text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-70"
          >
            {isSubmittingReview ? <><Loader2 className="animate-spin" size={18}/> Submitting...</> : "Submit Review"}
          </button>
        </div>
      )}

      {/* 🟢 ACCOUNT ACTIONS (ONLY Show if it is MY profile!) */}
      {isMyProfile && (
        <div className="grid grid-cols-1 gap-3 pt-4">
          {profile.is_admin && (
             <button onClick={() => window.location.href='/admin'} className="w-full bg-destructive/10 text-destructive font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm">
               <ShieldCheck size={18} strokeWidth={2.5}/> Admin Dashboard
             </button>
          )}
          <button onClick={logout} className="w-full bg-secondary text-foreground font-black py-4 rounded-2xl flex items-center justify-center gap-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      )}

      {/* EDIT MODAL (Only for MY profile) */}
      {showEdit && isMyProfile && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl">
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
                  className="w-full p-4 mt-1 bg-background border border-border rounded-2xl text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Bio</label>
                <textarea 
                  rows="3" 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})} 
                  className="w-full p-4 mt-1 bg-background border border-border rounded-2xl text-sm" 
                />
              </div>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving} 
                className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerify && isMyProfile && (
        <VerificationFlow 
          onClose={() => setShowVerify(false)} 
          onRefresh={fetchProfile} 
        />
      )}
    </div>
  );
};

export default Profile;