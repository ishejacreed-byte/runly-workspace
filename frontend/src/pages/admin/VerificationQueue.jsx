import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, X, Loader2, ZoomIn } from 'lucide-react';

const VerificationQueue = ({ data, refreshData, getTokenConfig }) => {
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to mark this as ${action}?`)) return;
    setProcessingId(id);
    
    try {
      await axios.put(`http://localhost:5000/api/admin/verify/${id}`, { status: action }, getTokenConfig());
      refreshData('verifications'); 
    } catch (err) {
      alert("Action failed. Check console for details.");
    } finally {
      setProcessingId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border">
        <ShieldCheck size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Queue Empty</p>
        <p className="text-xs text-muted-foreground mt-1">No pending verification requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(item => (
        <div key={item.id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* User Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-black text-foreground">{item.name}</h4>
                <p className="text-sm font-medium text-muted-foreground">{item.email}</p>
              </div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
            </div>
            
            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 relative group cursor-pointer" onClick={() => window.open(item.id_url)}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ID Document</p>
                <div className="h-32 w-full rounded-2xl overflow-hidden border border-border">
                  <img src={item.id_url} alt="ID" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><ZoomIn size={24}/></div>
                </div>
              </div>
              <div className="space-y-1 relative group cursor-pointer" onClick={() => window.open(item.selfie_url)}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Selfie</p>
                <div className="h-32 w-full rounded-2xl overflow-hidden border border-border">
                  <img src={item.selfie_url} alt="Selfie" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><ZoomIn size={24}/></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 justify-end w-full md:w-48 pt-4 md:pt-0">
            <button 
              onClick={() => handleAction(item.id, 'verified')} 
              disabled={processingId === item.id}
              className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {processingId === item.id ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18} />} Approve
            </button>
            <button 
              onClick={() => handleAction(item.id, 'rejected')} 
              disabled={processingId === item.id}
              className="w-full bg-destructive/10 text-destructive font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-95 transition disabled:opacity-50"
            >
              <X size={18} /> Reject
            </button>
          </div>

        </div>
      ))}
    </div>
  );
};

export default VerificationQueue;