import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral' }) => {
  const trendColors = {
    positive: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/10',
    negative: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-500/10',
    neutral: 'text-slate-500 bg-slate-50 dark:bg-surface-800/40 border-slate-200/10'
  };

  return (
    <div className="glass-card p-6 flex items-start justify-between relative overflow-hidden group hover:scale-[1.02] active:scale-[0.99] transition-all duration-300">
      {/* Glow background accent */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/5 group-hover:bg-brand-500/10 rounded-full blur-xl transition-colors duration-300" />
      
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-extrabold dark:text-white transition-all duration-300">
            {value}
          </span>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${trendColors[trendType]}`}>
              {trend}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>

      <div className="bg-gradient-to-tr from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 p-3.5 rounded-xl border border-brand-100/10 dark:border-brand-900/10 group-hover:rotate-6 transition-transform duration-300">
        <Icon className="w-6 h-6 text-brand-500 dark:text-violet-400" />
      </div>
    </div>
  );
};

export default StatCard;
