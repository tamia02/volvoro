import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Filter, DollarSign, Calendar, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';

const ExpensesHistory = () => {
  const { user } = useAuth();

  // State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState(''); // 'manual_expense', 'payout'
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/expenses/history');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load transaction ledger history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    // Source filter
    if (sourceFilter && item.source !== sourceFilter) return false;
    
    // Type/Category filter
    if (typeFilter && item.type !== typeFilter) return false;
    
    // Date range filter
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    
    return true;
  });

  const getSourceBadge = (source) => {
    if (source === 'manual_expense') {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50';
    }
    return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50';
  };

  const getCategoryLabel = (type) => {
    const labels = {
      meta_ads: 'Meta Ads Spend',
      software: 'Software Subscription',
      refund: 'Customer Refund',
      misc: 'Miscellaneous Expense',
      salary: 'Staff Salary Payout',
      commission: 'Sales Commission Payout',
      vendor_payment: 'B2B Vendor Payment'
    };
    return labels[type] || type.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/expenses"
          className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-surface-800/40 text-slate-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Outflow Ledger History</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Standalone historical record of all manual expenses and verified payouts</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Transaction Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full glass-input py-2 text-xs font-semibold"
          >
            <option value="">All Sources</option>
            <option value="manual_expense">Manual Expenses Only</option>
            <option value="payout">Verified Payouts Only</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full glass-input py-2 text-xs font-semibold"
          >
            <option value="">All Categories</option>
            <option value="meta_ads">Meta Ads Spends</option>
            <option value="software">Software Subscriptions</option>
            <option value="refund">Refunds</option>
            <option value="salary">Staff Salaries</option>
            <option value="commission">Commissions</option>
            <option value="vendor_payment">Vendor Payments</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full glass-input py-2 text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full glass-input py-2 text-xs"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-xs font-semibold">Loading ledger records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Transaction Date</th>
                  <th className="py-4 px-6">Purpose/Category</th>
                  <th className="py-4 px-6">Source Module</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6">UTR / Reference ID</th>
                  <th className="py-4 px-6 text-right">Outflow Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 transition-colors">
                      <td className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {item.date}
                      </td>
                      <td className="py-4 px-6 font-semibold dark:text-white">
                        {getCategoryLabel(item.type)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getSourceBadge(item.source)}`}>
                          {item.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">
                        {item.recipient}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 capitalize">
                        {item.payment_mode.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-slate-400 dark:text-slate-500">
                        {item.reference_id}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-rose-600 dark:text-rose-400 text-right">
                        ₹{parseFloat(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No outflow records found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesHistory;
