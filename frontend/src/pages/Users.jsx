import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Edit3, Trash2, UserCheck, CreditCard, MapPin } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    role: 'sales_exec',
    joining_date: new Date().toISOString().split('T')[0],
    address: '',
    payout_type: 'Salary',
    salary_amount: '',
    commission_percentage: ''
  });

  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
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
    fetchUsers(searchQuery);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || (!editingUser && !formData.password)) {
      alert('Name, mobile, and password are required');
      return;
    }

    try {
      let res;
      const payload = {
        ...formData,
        salary_amount: formData.salary_amount ? parseFloat(formData.salary_amount) : null,
        commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null
      };

      if (editingUser) {
        res = await apiClient.put(`/users/${editingUser.id}`, payload);
      } else {
        res = await apiClient.post('/users', payload);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setEditingUser(null);
        resetForm();
        fetchUsers(searchQuery);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      role: 'sales_exec',
      joining_date: new Date().toISOString().split('T')[0],
      address: '',
      payout_type: 'Salary',
      salary_amount: '',
      commission_percentage: ''
    });
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === currentUser.id) {
      alert('You cannot delete your own profile');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${targetUser.name}'s employee profile?`)) return;

    try {
      const res = await apiClient.delete(`/users/${targetUser.id}`);
      if (res.data.success) {
        fetchUsers(searchQuery);
        alert('Employee profile soft-deleted successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
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
      joining_date: targetUser.joining_date || '',
      address: targetUser.address || '',
      payout_type: targetUser.payout_type || 'Salary',
      salary_amount: targetUser.salary_amount !== null ? targetUser.salary_amount.toString() : '',
      commission_percentage: targetUser.commission_percentage !== null ? targetUser.commission_percentage.toString() : ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Staff Directory</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage employee profiles, address logs, payouts configurations, and roles</p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 font-bold text-xs self-start"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Name, Mobile, Email, or Role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs focus:ring-0 font-semibold text-slate-600 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.filter(u => u.status === 'active').length > 0 ? (
          users.filter(u => u.status === 'active').map((u) => (
            <div key={u.id} className="glass-card p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
              {/* Status Indicator */}
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'} shadow-lg`} />
                <span className="text-[10px] font-extrabold uppercase text-slate-400">{u.status}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-extrabold text-base">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white leading-tight">{u.name}</h3>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{u.role.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                  <p className="flex justify-between">Mobile: <span className="dark:text-slate-200">{u.mobile}</span></p>
                  <p className="flex justify-between">Email: <span className="dark:text-slate-200 truncate max-w-[150px]">{u.email || 'None'}</span></p>
                  <p className="flex justify-between">Payout: <span className="text-brand-600 dark:text-brand-400 font-extrabold">{u.payout_type}</span></p>
                  {u.salary_amount && <p className="flex justify-between">Salary: <span className="dark:text-slate-200">₹{parseFloat(u.salary_amount).toLocaleString()}</span></p>}
                  {u.commission_percentage && <p className="flex justify-between">Comm Rate: <span className="dark:text-slate-200">{u.commission_percentage}%</span></p>}
                  {u.address && (
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/40 flex items-start gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="truncate">{u.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                <button
                  onClick={() => startEdit(u)}
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="p-2 rounded-xl border border-rose-200/30 hover:bg-rose-500/10 text-rose-500 transition-all flex items-center justify-center"
                    title="Delete Employee Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">No employee profiles logged matching parameters.</div>
        )}
      </div>

      {/* Modal - Create/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit Staff Profile' : 'Create Staff Profile'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
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
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full glass-input"
              placeholder="Full mailing address..."
            />
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand-500" /> Payout Profile Configurations
            </h4>
            
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payout Type</label>
              <select
                value={formData.payout_type}
                onChange={(e) => setFormData({ ...formData, payout_type: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="Salary">Salary</option>
                <option value="Commission Only">Commission Only</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Salary Amount (₹)</label>
                <input
                  type="number"
                  value={formData.salary_amount}
                  onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value })}
                  className="w-full glass-input"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Commission (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                  className="w-full glass-input"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
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

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-4">
            Save Employee Profile
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
