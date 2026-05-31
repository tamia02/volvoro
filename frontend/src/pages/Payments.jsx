import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  CheckCircle, XCircle, Search, Filter, CreditCard, 
  ChevronRight, AlertTriangle, Eye, ArrowUpRight 
} from 'lucide-react';

const Payments = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Form state
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch payments log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (paymentId) => {
    try {
      const res = await apiClient.patch(`/payments/${paymentId}/verify`);
      if (res.data.success) {
        setIsDetailModalOpen(false);
        fetchPayments();
        alert('Payment verified successfully. Booking balance adjusted.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason || !selectedPayment) return;

    try {
      const res = await apiClient.patch(`/payments/${selectedPayment.id}/reject`, {
        rejection_reason: rejectionReason
      });
      if (res.data.success) {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setIsDetailModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const filteredPayments = payments.filter(p => {
    if (statusFilter) {
      return p.verification_status === statusFilter;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50'
    };
    return `text-xs font-bold px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Transaction Logs</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Verify customer receipts, bank transactions, and adjust balance ledgers</p>
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
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified History</option>
            <option value="rejected">Rejected Entries</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Transaction Detail</th>
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Payment Mode</th>
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-6">Payment Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedPayment(p);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block dark:text-white">ID: {p.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-slate-400">Awaiting approval</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold dark:text-slate-200">
                      {p.booking?.destination || 'Unspecified'}
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
                      {p.payment_mode.toUpperCase()}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-bold">
                      {p.transaction_id}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {p.payment_date}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                      ₹{parseFloat(p.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(p.verification_status)}>
                        {p.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No payment logs recorded under this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Payment details */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Verify Payment Slip">
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Amount</span>
                <span className="dark:text-white text-base font-extrabold">₹{parseFloat(selectedPayment.amount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Transaction ID</span>
                <span className="dark:text-white text-sm font-bold">{selectedPayment.transaction_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Deposit Account</span>
                <span className="dark:text-white">{selectedPayment.received_account || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Payment Date</span>
                <span className="dark:text-white">{selectedPayment.payment_date}</span>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receipt Attachment</span>
              {selectedPayment.screenshot_url ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-surface-900/60 p-4 flex flex-col items-center justify-center gap-2">
                  <a 
                    href={`http://localhost:5000${selectedPayment.screenshot_url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-violet-400 hover:underline"
                  >
                    <Eye className="w-4 h-4" /> View full attachment <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-2 font-medium">No screenshot uploaded.</p>
              )}
            </div>

            {selectedPayment.verification_status === 'pending' && hasPermission('verify_payment') && (
              <div className="flex gap-3 justify-end border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="btn-secondary text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-500/20 font-bold"
                >
                  Reject Proof
                </button>
                <button
                  onClick={() => handleVerify(selectedPayment.id)}
                  className="btn-primary font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  Verify Deposit
                </button>
              </div>
            )}

            {selectedPayment.verification_status === 'rejected' && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold block mb-1">Rejection Reason</span>
                <p>{selectedPayment.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - Reject Payment */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Payment Proof">
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Rejection Reason</label>
            <textarea
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full glass-input h-24 resize-none"
              placeholder="Provide reason (e.g. Transaction mismatch, duplicate entry...)"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2 bg-rose-600 hover:bg-rose-500 shadow-rose-500/10 border-none">
            Confirm Rejection
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
