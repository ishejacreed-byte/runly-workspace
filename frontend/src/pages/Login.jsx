import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // 🛠️ THE FIX: Pass BOTH the user object AND the token to the context
      login(res.data.user, res.data.token);
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">Runly</h1>
          <p className="text-muted-foreground font-medium">Welcome back. Let's get things done.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm font-bold rounded-xl text-center border border-destructive/20">{error}</div>}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="email" 
              placeholder="Email address" 
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground font-medium focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground font-medium focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <button type="submit" className="w-full bg-foreground text-background font-bold py-4 rounded-2xl shadow-lg hover:bg-foreground/90 transition transform active:scale-95 flex justify-center items-center gap-2 mt-2">
            Log In <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
          Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;