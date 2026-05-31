import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, KeyRound, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_exec'); // Default to sales exec
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password || !role) {
      setError('Please provide your login ID, password, and select a role');
      return;
    }

    setLoading(true);
    const result = await login(identifier, password, role);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-950 relative overflow-hidden p-4">
      {/* Background visual graphics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl animate-soft-pulse" />

      <div className="w-full max-w-md glass-panel p-8 border border-white/10 relative z-10 bg-brand-950/40 backdrop-blur-2xl shadow-2xl shadow-brand-900/10">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-brand-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-brand-500/20 mb-4 animate-soft-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
            Volvoro CRM
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-semibold">
            Tour Explorer Operations Desk
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="mb-6 flex items-start gap-2 bg-rose-950/20 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Workspace Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full glass-input bg-brand-950/30 border-slate-800 text-white focus:border-brand-500 py-3"
              disabled={loading}
            >
              <option value="sales_exec" className="bg-brand-950 text-white">Sales Executive</option>
              <option value="admin" className="bg-brand-950 text-white">System Administrator</option>
              <option value="finance" className="bg-brand-950 text-white">Finance Manager</option>
              <option value="operations" className="bg-brand-950 text-white">Operations Coordinator</option>
              <option value="marketing" className="bg-brand-950 text-white">Marketing Coordinator</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Email or Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="sales@volvoro.com or 9999999992"
                className="w-full glass-input bg-brand-950/30 border-slate-800 text-white pl-11 placeholder-slate-600 focus:border-brand-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-input bg-brand-950/30 border-slate-800 text-white pl-11 pr-11 placeholder-slate-600 focus:border-brand-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 flex items-center justify-center font-bold text-sm tracking-wide mt-4"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/50 pt-4 text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-600 font-semibold tracking-wider">
            SECURE SESSION SYSTEM (EXPIRES IN 8 HOURS)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
