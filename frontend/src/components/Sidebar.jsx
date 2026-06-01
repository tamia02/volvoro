import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Compass,
  Briefcase,
  CreditCard,
  Truck,
  DollarSign,
  BarChart3,
  ShieldAlert,
  UserCheck,
  Settings,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, hasPermission, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    { path: '/leads', label: 'Leads', icon: Users, permission: 'view_lead_own' },
    { path: '/bookings', label: 'Bookings', icon: Briefcase, permission: 'view_lead_own' },
    { path: '/payments', label: 'Payments', icon: CreditCard, permission: 'verify_payment' },
    { path: '/operations', label: 'Operations', icon: Compass, permission: 'view_operations' },
    { path: '/vendors', label: 'Vendors', icon: Truck, permission: 'manage_vendors' },
    { path: '/payouts', label: 'Payouts', icon: DollarSign, permission: null }, // Visible to all, filtered inside
    { path: '/expenses', label: 'Expenses', icon: DollarSign, permission: 'view_expenses' },
    { path: '/reports', label: 'Reports', icon: BarChart3, permission: 'view_lead_source_reports' },
    { path: '/delete-requests', label: 'Delete Requests', icon: ShieldAlert, permission: 'approve_delete_request' },
    { path: '/users', label: 'Staff Directory', icon: UserCheck, permission: 'create_user' },
    { path: '/settings', label: 'Settings', icon: Settings, permission: 'create_user' },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel flex flex-col p-4 z-20 m-0 rounded-none border-y-0 border-l-0 bg-white/95 dark:bg-brand-950/95">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-brand-500/20">
          <Compass className="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <span className="font-display font-bold text-xl bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Volvoro CRM
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
            Tour Explorer
          </p>
        </div>
      </div>

      {/* Nav items list */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 space-y-2">
        {/* Theme toggler */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800/40"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* User Card info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-surface-900/40 border border-slate-200/30 dark:border-slate-800/30">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate dark:text-white">{user.name}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
