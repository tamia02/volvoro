import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();

  if (!user) return null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-brand-950/40 backdrop-blur-xl sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Date tracker */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-surface-800/40 px-3 py-1.5 rounded-lg border border-slate-200/30 dark:border-slate-800/30">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span>{todayStr}</span>
        </div>

        {/* User context info */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-semibold block dark:text-white">{user.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
