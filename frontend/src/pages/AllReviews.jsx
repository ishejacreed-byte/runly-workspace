import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Star, Loader2, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AllReviews = () => {
  const { id } = useParams(); // 🟢 Extracts the ID from the URL
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('runly_token');
        const res = await axios.get(`http://localhost:5000/api/reviews/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchReviews();
  }, [id]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      const token = localStorage.getItem('runly_token');
      await axios.delete(`http://localhost:5000/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Instantly remove from screen
      setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
    } catch (err) {
      alert("Could not delete review. Make sure you are the author.");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <div className="min-h-screen bg-background pb-24 animate-fadeSlideIn">
      
      {/* 🟢 STICKY HEADER WITH BACK BUTTON */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition"><ArrowLeft size={20} /></button>
        <h1 className="font-black text-xs uppercase tracking-widest">All Reviews</h1>
        <div className="w-10"></div> {/* Empty div to perfectly center the title */}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground font-black uppercase tracking-widest py-10">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative hover:shadow-md transition">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {/* Generated Avatar */}
                  <div className="w-10 h-10 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full">
                     {review.reviewer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-sm text-foreground">{review.reviewer_name}</p>
                    <div className="flex text-amber-500 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < review.rating ? "currentColor" : "none"} 
                          strokeWidth={i < review.rating ? 0 : 1.5}
                          className={i >= review.rating ? "text-muted-foreground/30" : ""}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 🛡️ SECURITY: Only show Trash button if I wrote this review! */}
                {user && Number(user.id) === Number(review.reviewer_id) && (
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition active:scale-95"
                    title="Delete my review"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              <p className="text-sm text-foreground font-medium bg-secondary/30 p-3 rounded-xl border border-border/50">
                "{review.comment}"
              </p>
              
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-3 text-right">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllReviews;