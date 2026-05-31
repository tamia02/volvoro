import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, UserCheck, Edit3, Key, ShieldCheck } from 'lucide-react';

const Users = () => {
  const { user } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    role: 'sales_exec',
    joining_date: new Date().toISOString().split('T')[0]
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || (!editingUser && !formData.password)) {
      alert('Name, mobile, and password are required');
      return;
    }

    try {
      let res;
      if (editingUser) {
        res = await apiClient.put(`/users/${editingUser.id}`, formData);
      } else {
        res = await apiClient.post('/users', formData);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
          name: '',
          mobile: '',
          email: '',
          password: '',
          role: 'sales_exec',
          joining_date: new Date().toISOString().split('T')[0]
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleStatusToggle = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to set status of ${targetUser.name} to ${nextStatus}?`)) return;

    try {
      const res = await apiClient.patch(`/users/${targetUser.id}/status`, { status: nextStatus });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const startEdit = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name,
      mobile: targetUser.mobile,
      email: targetUser.email || '',
      password: '', // clear for safety, optional update
      role: targetUser.role,
      joining_date: targetUser.joining_date || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Staff Management</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Create employee logins, adjust access roles, and monitor status overrides</p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              mobile: '',
              email: '',
              password: '',
              role: 'sales_exec',
              joining_date: new Date().toISOString().split('T')[0]
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} className="glass-card p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
              {/* Glow for active */}
              {u.status === 'active' && (
                <div className="absolute right-3 top-3 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              )}
              {u.status === 'inactive' && (
                <div className="absolute right-3 top-3 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-extrabold text-base">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{u.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{u.role.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <p>Mobile: <span className="dark:text-slate-300">{u.mobile}</span></p>
                  <p>Email: <span className="dark:text-slate-300">{u.email || 'None'}</span></p>
                  <p>Joined: <span className="dark:text-slate-300">{u.joining_date || 'Not set'}</span></p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(u)}
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                {u.id !== user.id && (
                  <button
                    onClick={() => handleStatusToggle(u)}
                    className={`btn-secondary text-xs py-2 px-3 font-bold ${
                      u.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">No employee profiles logged.</div>
        )}
      </div>

      {/* Modal - Create/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit Staff Profile' : 'Create Staff Profile'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Role Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="sales_exec">Sales Executive</option>
                <option value="finance">Finance Manager</option>
                <option value="operations">Operations Coordinator</option>
                <option value="marketing">Marketing Coordinator</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password {editingUser && '(Leave blank to keep current)'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full glass-input"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Joining Date</label>
            <input
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full glass-input"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Save Employee Profile
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
