import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, Camera, CheckCircle } from 'lucide-react';

const VerificationFlow = ({ onClose, onRefresh }) => {
  const [step, setStep] = useState(1);
  const [urls, setUrls] = useState({ idUrl: '', selfieUrl: '' });

const handleUpload = (field) => {
    window.cloudinary.openUploadWidget({ 
        cloudName: 'dybe866xr', 
        uploadPreset: 'runly_ids', // 🟢 CHANGE THIS TO MATCH YOUR SCREENSHOT EXACTLY
        clientAllowedFormats: ["jpg", "png", "pdf"]
    }, async (error, result) => {
      if (!error && result.event === "success") {
        setUrls({ ...urls, [field]: result.info.secure_url });
        setStep(prev => prev + 1);
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // 🟢 GET THE TOKEN
      const token = localStorage.getItem('runly_token');
      
      // 🟢 ATTACH THE TOKEN TO THE REQUEST
      await axios.post('http://localhost:5000/api/trust/verify', urls, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to submit verification. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-t-3xl p-8 animate-slideUp">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">Identity Verification</h2>
            <button onClick={onClose}><X /></button>
        </div>

        {step === 1 && (
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center"><Upload size={32}/></div>
                <h3 className="font-bold">Step 1: Government ID</h3>
                <p className="text-sm text-muted-foreground">Please upload a clear photo of your Passport or National ID.</p>
                <button onClick={() => handleUpload('idUrl')} className="w-full bg-primary text-white font-bold py-4 rounded-2xl">Upload ID Document</button>
            </div>
        )}

        {step === 2 && (
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center"><Camera size={32}/></div>
                <h3 className="font-bold">Step 2: Selfie Verification</h3>
                <p className="text-sm text-muted-foreground">Take a selfie to verify you are the owner of the document.</p>
                <button onClick={() => handleUpload('selfieUrl')} className="w-full bg-primary text-white font-bold py-4 rounded-2xl">Take Selfie</button>
            </div>
        )}

        {step === 3 && (
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 mx-auto rounded-full flex items-center justify-center"><CheckCircle size={32}/></div>
                <h3 className="font-bold">Ready to Submit</h3>
                <p className="text-sm text-muted-foreground">Your documents are uploaded securely. Submission will be reviewed within 24 hours.</p>
                <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl">Submit for Review</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default VerificationFlow;