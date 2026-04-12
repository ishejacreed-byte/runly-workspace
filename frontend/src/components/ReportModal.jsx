import React, { useState } from 'react';
import axios from 'axios';
import { X, AlertOctagon, Send } from 'lucide-react';

const ReportModal = ({ reportedUser, onClose }) => {
  const [category, setCategory] = useState('Scammer');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Scammer', 'Not delivered', 'Impersonation', 'Abuse / Harmful content', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/reports', {
        reportedUserId: reportedUser.id,
        category,
        description
      });
      alert("Report submitted.");
      onClose();
    } catch (err) {
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
            <AlertOctagon size={24} /> Report User
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition"><X /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Reporting <span className="font-bold text-foreground">{reportedUser.name}</span>. 
          Your report is anonymous and will be reviewed by admins.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 mt-1 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-destructive/20"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Details</label>
            <textarea 
              required
              rows="4"
              placeholder="Please provide specific details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 mt-1 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-destructive/20"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-destructive text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-destructive/90 transition flex items-center justify-center gap-2"
          >
            {loading ? "Submitting..." : <><Send size={18}/> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;