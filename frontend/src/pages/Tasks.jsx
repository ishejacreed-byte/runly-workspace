import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import SemanticImage from '../components/SemanticImage';

const Tasks = () => {
  const navigate = useNavigate();
  const { user, roleMode } = useContext(AuthContext);
  
  // 🛠️ Smarter Tab Initialization: Syncs automatically with your global role
  const [activeTab, setActiveTab] = useState(roleMode === 'customer' ? 'My Requests' : 'My Jobs');
  
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Auto-switch tabs if the user toggles their role via the navigation bar while on this page
  useEffect(() => {
    setActiveTab(roleMode === 'customer' ? 'My Requests' : 'My Jobs');
  }, [roleMode]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const [reqRes, jobRes] = await Promise.all([
          axios.get('http://localhost:5000/api/errands/me'),   // My Requests
          axios.get('http://localhost:5000/api/errands/jobs')  // My Jobs
        ]);
        setRequests(reqRes.data);
        setJobs(jobRes.data);
      } catch (err) { 
        console.error("Failed to load tasks"); 
      }
    };
    fetchTasks();
  }, [roleMode]); // Re-fetch to ensure fresh data if needed

  // 🛠️ The Display Matrix Engine
  const displayErrands = () => {
    if (activeTab === 'My Requests') {
      // Customer: Active errands only
      return requests.filter(r => r.status !== 'completed');
    }
    if (activeTab === 'My Jobs') {
      // Helper: Active jobs only
      return jobs.filter(j => j.status !== 'completed');
    }
    if (activeTab === 'Completed') {
      // Merged history: Both customer requests and helper jobs that are finished
      const completedRequests = requests.filter(r => r.status === 'completed');
      const completedJobs = jobs.filter(j => j.status === 'completed');
      
      // Merge and sort by creation date descending
      return [...completedRequests, ...completedJobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return []; 
  };

  const tasksToShow = displayErrands();

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <h1 className="text-3xl font-bold text-foreground mb-6">Tasks</h1>

      {/* TAB NAVIGATION */}
      <div className="flex bg-secondary/50 p-1 rounded-xl mb-6 shadow-inner">
        {['My Requests', 'My Jobs', 'Completed'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* DYNAMIC LIST */}
      <div className="space-y-3">
        {tasksToShow.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl">
            No tasks found in this section.
          </div>
        ) : (
          tasksToShow.map(errand => (
            <div 
              key={errand.id} 
              onClick={() => navigate(`/errand/${errand.id}`)} 
              className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/50 transition"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                <SemanticImage title={errand.title} category={errand.category} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-foreground text-sm truncate pr-2">{errand.title}</h4>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </div>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${errand.status === 'completed' ? 'bg-secondary text-muted-foreground' : 'bg-emerald-100 text-emerald-700'}`}>
                    {errand.status.replace('_', ' ')}
                  </span>
                  {errand.status !== 'completed' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">{errand.urgency}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Clock size={12}/> 
                    {new Date(errand.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 self-end">
                {/* Dynamically show what matters based on if they are customer or helper */}
                <p className="font-bold text-primary text-lg">
                  €{user.id === errand.helper_id ? errand.helper_earnings : errand.budget}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;