import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { Plus, DollarSign, ArrowRight, TrendingDown } from 'lucide-react';

const Expenses = () => {
  // State
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

  const fetchExpensesSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const sumRes = await apiClient.get('/expenses/summary');
      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesSummary();
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
        fetchExpensesSummary();
        alert('Expense logged successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Business Expenses</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Log and track operating expenses, ad spends, and cash outflows</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/expenses/history"
            className="px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-surface-800/40 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-all"
          >
            Outflow History <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
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

      {/* Quick Access Actions */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <TrendingDown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-semibold text-sm dark:text-white">Unified Ledger & Outflows</h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Salary payouts, vendor fees, and manual expenses are merged in a standalone ledger.</p>
          </div>
        </div>
        <Link
          to="/expenses/history"
          className="w-full md:w-auto text-center btn-primary font-bold text-xs bg-indigo-600 hover:bg-indigo-500 border-none px-6"
        >
          Access Ledger History
        </Link>
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
                <option value="software">Software subscription</option>
                <option value="refund">Refund payment</option>
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
                placeholder="₹"
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
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Internal notes / Description</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input h-24 resize-none"
              placeholder="Provide itemization or purpose details..."
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
