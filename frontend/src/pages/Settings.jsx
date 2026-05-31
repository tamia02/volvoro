import React, { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Key, Sliders, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  // Settings State
  const [commRate, setCommRate] = useState('10.00');
  const [advanceThreshold, setAdvanceThreshold] = useState('20.00');

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      const res = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (res.data.success) {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert('Password changed successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    alert('System thresholds configuration saved locally.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Workspace Settings</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Configure system-wide parameters and update your profile password</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: System Config (Admin only) */}
        {user.role === 'admin' && (
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-500" /> Commission & Deposits Thresholds
            </h3>

            <form onSubmit={handleConfigSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-400 block mb-1">Default Sales Commission (%)</label>
                <input
                  type="number"
                  value={commRate}
                  onChange={(e) => setCommRate(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Minimum Booking Advance Deposit (%)</label>
                <input
                  type="number"
                  value={advanceThreshold}
                  onChange={(e) => setAdvanceThreshold(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-2.5 font-bold mt-2">
                Save System Config
              </button>
            </form>
          </div>
        )}

        {/* Right Card: Change Password (All Users) */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" /> Update Account Password
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="text-slate-400 block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <button type="submit" className="w-full btn-primary py-2.5 font-bold mt-2 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10">
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;
