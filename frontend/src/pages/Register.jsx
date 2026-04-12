import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, 'user');
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-sm border border-border">
        <h2 className="text-2xl font-bold text-foreground text-center mb-6">Create an Account</h2>
        {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input type="text" required className="w-full p-2 border border-border rounded-md bg-background focus:outline-ring" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input type="email" required className="w-full p-2 border border-border rounded-md bg-background focus:outline-ring" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input type="password" required className="w-full p-2 border border-border rounded-md bg-background focus:outline-ring" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:bg-primary/90 transition-colors">
            Sign Up
          </button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;