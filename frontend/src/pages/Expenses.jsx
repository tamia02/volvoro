import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Filter, DollarSign, Calendar, FileText, CheckCircle, ArrowRight } from 'lucide-react';

const Expenses = () => {
  const { user } = useAuth();

  // State
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    expense_type: 'misc',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: 'bank_transfer',
    notes: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await apiClient.get('/expenses');
      const sumRes = await apiClient.get('/expenses/summary');

      if (res.data.success && sumRes.data.success) {
        setExpenses(res.data.data);
        setSummary(sumRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.expense_date) return;

    try {
      const res = await apiClient.post('/expenses', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          expense_type: 'misc',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
          payment_mode: 'bank_transfer',
          notes: ''
        });
        fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding expense');
    }
  };

  const getExpenseTypeClass = (type) => {
    const classes = {
      meta_ads: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50',
      staff: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50',
      commission: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50',
      vendor_payment: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50',
      refund: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50',
      software: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-200/50',
      misc: 'bg-slate-100 text-slate-700 dark:bg-surface-800 dark:text-slate-400 border-slate-200/50'
    };
    return `text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${classes[type] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Business Expenses</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Log ad spends, office salaries, software subscriptions, and payouts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {/* Summary grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-brand-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Monthly Spends</span>
            <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">₹{parseFloat(summary.total).toLocaleString()}</span>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-indigo-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meta Ads Spends</span>
            <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">₹{parseFloat(summary.by_type.meta_ads || 0).toLocaleString()}</span>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor Payments</span>
            <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">₹{parseFloat(summary.by_type.vendor_payment || 0).toLocaleString()}</span>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Salaries</span>
            <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">₹{parseFloat(summary.by_type.staff || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Expense category</th>
                <th className="py-4 px-6">Payment Mode</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Notes / Description</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 transition-colors">
                    <td className="py-4 px-6">
                      <span className={getExpenseTypeClass(e.expense_type)}>
                        {e.expense_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-500 capitalize">
                      {e.payment_mode.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {e.expense_date}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {e.notes || '-'}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-rose-600 dark:text-rose-400">
                      ₹{parseFloat(e.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-semibold">
                      {e.addedByUser?.name || 'Manager'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No expense entries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add Expense */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Business Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Expense Type</label>
              <select
                value={formData.expense_type}
                onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="meta_ads">Meta Ads spend</option>
                <option value="staff">Staff salaries</option>
                <option value="commission">Commission payout</option>
                <option value="vendor_payment">Vendor billing payment</option>
                <option value="refund">Refund payment</option>
                <option value="software">Software subscription</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Expense Amount (₹)</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment Mode</label>
              <input
                type="text"
                required
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. UPI, Bank Transfer"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Internal notes / Description</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input h-24 resize-none"
              placeholder="Provide itemization or vendor confirmation references..."
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Log Cash Outflow
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
