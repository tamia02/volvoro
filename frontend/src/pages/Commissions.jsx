import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { DollarSign, CheckCircle, ChevronRight, Filter, AlertCircle } from 'lucide-react';

const Commissions = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComm, setSelectedComm] = useState(null);

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Form states
  const [payReference, setPayReference] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError('');
      const endpoint = hasPermission('approve_commission') ? '/commissions' : '/commissions/my';
      const res = await apiClient.get(endpoint);
      if (res.data.success) {
        setCommissions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch commissions list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleApprove = async (commId) => {
    try {
      const res = await apiClient.patch(`/commissions/${commId}/approve`);
      if (res.data.success) {
        setIsDetailModalOpen(false);
        fetchCommissions();
        alert('Commission approved successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving commission');
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payReference || !selectedComm) return;

    try {
      const res = await apiClient.patch(`/commissions/${selectedComm.id}/paid`, {
        payment_reference: payReference
      });
      if (res.data.success) {
        setIsPayModalOpen(false);
        setPayReference('');
        setIsDetailModalOpen(false);
        fetchCommissions();
        alert('Payout marked as complete.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving payout record');
    }
  };

  const filteredComms = commissions.filter(c => {
    if (statusFilter) return c.status === statusFilter;
    return true;
  });

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      payable: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50',
      approved: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50',
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      hold: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50'
    };
    return `text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Sales Commissions</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Track bonuses, calculate net margins on completed trips, and manage payouts</p>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 flex gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input py-2 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="payable">Payable Trips</option>
            <option value="approved">Approved Awaiting Payout</option>
            <option value="paid">Paid History</option>
            <option value="hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Destination</th>
                {hasPermission('approve_commission') && <th className="py-4 px-6">Sales Representative</th>}
                <th className="py-4 px-6">Net Profit</th>
                <th className="py-4 px-6">Rate</th>
                <th className="py-4 px-6">Commission Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {filteredComms.length > 0 ? (
                filteredComms.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedComm(c);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block dark:text-white">{c.booking.destination}</span>
                          <span className="text-[10px] text-slate-400">ID: {c.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    {hasPermission('approve_commission') && (
                      <td className="py-4 px-6 font-semibold dark:text-slate-200">
                        {c.salesExec?.name || 'Agent'}
                      </td>
                    )}
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      ₹{parseFloat(c.net_profit).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {c.commission_percentage}%
                    </td>
                    <td className="py-4 px-6 font-extrabold text-brand-600 dark:text-brand-400">
                      ₹{parseFloat(c.commission_amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(c.status)}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No payout records generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Details */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Sales Commission Details">
        {selectedComm && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Booking ID</span>
                <span className="dark:text-white font-bold">{selectedComm.booking_id.slice(0, 8)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Representative Name</span>
                <span className="dark:text-white">{selectedComm.salesExec?.name || 'Agent'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Net Profit Margin</span>
                <span className="dark:text-white font-extrabold">₹{parseFloat(selectedComm.net_profit).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Commission Rate</span>
                <span className="dark:text-white">{selectedComm.commission_percentage}%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-900/30 border border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Total Payout Amount</span>
              <span className="text-brand-600 dark:text-brand-400 text-lg font-extrabold">₹{parseFloat(selectedComm.commission_amount).toLocaleString()}</span>
            </div>

            {selectedComm.status === 'paid' && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 rounded-xl text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold block mb-1">Payment Reference</span>
                <p>Paid Date: {selectedComm.paid_date} <br />Ref ID: {selectedComm.payment_reference}</p>
              </div>
            )}

            {/* Admin Moderation buttons */}
            {hasPermission('approve_commission') && (
              <div className="flex gap-3 justify-end border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                {selectedComm.status === 'payable' && (
                  <button
                    onClick={() => handleApprove(selectedComm.id)}
                    className="btn-primary font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
                  >
                    Approve Payout
                  </button>
                )}
                {selectedComm.status === 'approved' && (
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="btn-primary font-bold"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - Mark Paid */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Process Commission Payout">
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/10 p-3.5 rounded-xl text-indigo-600 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Ensure that the payout amount has been debited from company accounts before submitting this transaction log reference.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Payment Transaction UTR / Ref</label>
            <input
              type="text"
              required
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="w-full glass-input"
              placeholder="e.g. Bank Ref number"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Confirm Payout Complete
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Commissions;
