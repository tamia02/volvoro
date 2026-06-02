import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  Plus, Search, Filter, Briefcase, FileText, CheckCircle, XCircle, 
  Clock, CreditCard, ChevronRight, AlertTriangle, Upload 
} from 'lucide-react';

const Bookings = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'upi',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    received_account: ''
  });
  const [paymentFile, setPaymentFile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openBookingDetails = async (bookingId) => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}`);
      if (res.data.success) {
        setSelectedBooking(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching details');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.transaction_id) return;

    try {
      // Use multipart form data for uploading local screenshots
      const formData = new FormData();
      formData.append('booking_id', selectedBooking.id);
      formData.append('lead_id', selectedBooking.lead_id);
      formData.append('amount', paymentForm.amount);
      formData.append('payment_mode', paymentForm.payment_mode);
      formData.append('transaction_id', paymentForm.transaction_id);
      formData.append('payment_date', paymentForm.payment_date);
      formData.append('received_account', paymentForm.received_account);
      if (paymentFile) {
        formData.append('screenshot', paymentFile);
      }

      const res = await apiClient.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setIsPaymentModalOpen(false);
        setPaymentFile(null);
        setPaymentForm({
          amount: '',
          payment_mode: 'upi',
          transaction_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          received_account: ''
        });
        openBookingDetails(selectedBooking.id); // Refresh
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading payment proof');
    }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    try {
      const res = await apiClient.patch(`/bookings/${selectedBooking.id}/approve`);
      if (res.data.success) {
        setIsDetailModalOpen(false);
        fetchBookings();
        alert('Booking request approved successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason || !selectedBooking) return;

    try {
      const res = await apiClient.patch(`/bookings/${selectedBooking.id}/reject`, {
        rejected_reason: rejectReason
      });
      if (res.data.success) {
        setIsRejectModalOpen(false);
        setRejectReason('');
        setIsDetailModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      const res = await apiClient.patch(`/payments/${paymentId}/verify`);
      if (res.data.success) {
        alert('Payment verified successfully. Booking balance adjusted.');
        openBookingDetails(selectedBooking.id);
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      const res = await apiClient.patch(`/payments/${paymentId}/reject`, {
        rejection_reason: reason
      });
      if (res.data.success) {
        alert('Payment verification rejected.');
        openBookingDetails(selectedBooking.id);
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-surface-800 dark:text-gray-400 border-gray-200/50'
    };
    return `text-xs font-bold px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Trip Bookings</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage trip requests, payments verification, and logistics coordination</p>
      </div>

      {/* Bookings List */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Client Name</th>
                <th className="py-4 px-6">Travel Date</th>
                <th className="py-4 px-6">Agent assigned</th>
                {user.role !== 'operations' && <th className="py-4 px-6">Package Price</th>}
                <th className="py-4 px-6">Booking Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {bookings.length > 0 ? (
                bookings.map((b) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 cursor-pointer transition-colors"
                    onClick={() => openBookingDetails(b.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block dark:text-white">{b.destination}</span>
                          <span className="text-[10px] text-slate-400">{b.pax_count} pax</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold dark:text-slate-200">
                      {b.customer.name}
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {b.travel_date}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {b.lead?.assignedUser?.name || 'Unassigned'}
                    </td>
                    {user.role !== 'operations' && (
                      <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                        ₹{parseFloat(b.package_amount).toLocaleString()}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(b.status)}>
                        {b.status}
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
                    No bookings logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Booking Details & Approvals */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Booking Request Profile">
        {selectedBooking && (
          <div className="space-y-6">
            {/* Summary Panel */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Destination</span>
                <span className="dark:text-white text-sm font-bold capitalize">{selectedBooking.destination} ({selectedBooking.pax_count} Pax)</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Customer Name</span>
                <span className="dark:text-white text-sm font-bold">{selectedBooking.customer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Travel Date</span>
                <span className="dark:text-white">{selectedBooking.travel_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Booking Status</span>
                <span className={getStatusBadge(selectedBooking.status)}>{selectedBooking.status}</span>
              </div>
            </div>

            {/* Financial tracking */}
            {user.role !== 'operations' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-900/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2.5 text-xs font-semibold">
                <h4 className="font-bold border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 dark:text-white">Financial Summary</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Price</span>
                  <span className="dark:text-white font-extrabold">₹{parseFloat(selectedBooking.package_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Advance paid</span>
                  <span className="text-emerald-500 font-extrabold">₹{parseFloat(selectedBooking.advance_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-bold">
                  <span className="text-slate-400">Remaining Balance</span>
                  <span className="text-brand-600 dark:text-brand-400 font-extrabold">₹{parseFloat(selectedBooking.remaining_amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payments checklist */}
            {user.role !== 'operations' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deposits / Uploaded proofs</h4>
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="btn-secondary py-1 px-3 text-xs font-bold text-brand-600 dark:text-violet-400 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Payment
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                    selectedBooking.payments.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 flex items-center justify-between gap-4 text-xs font-semibold">
                        <div>
                          <p className="dark:text-slate-200">Mode: {p.payment_mode.toUpperCase()} • ID: {p.transaction_id}</p>
                          <div className="flex gap-2 items-center text-[10px] mt-0.5">
                            <span className="text-slate-400">Date: {p.payment_date}</span>
                            {p.screenshot_url && (
                              <>
                                <span className="text-slate-500">•</span>
                                <a
                                  href={`http://localhost:5000${p.screenshot_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-600 dark:text-violet-400 hover:underline font-bold"
                                >
                                  View Receipt
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold block dark:text-white">₹{p.amount ? parseFloat(p.amount).toLocaleString() : '0'}</span>
                          <div className="flex items-center justify-end gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold ${
                              p.verification_status === 'verified' ? 'text-emerald-500' :
                              p.verification_status === 'rejected' ? 'text-rose-500' : 'text-amber-500'
                            }`}>{p.verification_status}</span>
                            {p.verification_status === 'pending' && hasPermission('verify_payment') && (
                              <div className="flex gap-1.5 ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyPayment(p.id);
                                  }}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 rounded border border-emerald-500/20 transition-all cursor-pointer"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectPayment(p.id);
                                  }}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 rounded border border-rose-500/20 transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2 font-medium">No payment proofs uploaded.</p>
                  )}
                </div>
              </div>
            )}

            {/* Admin Approvals */}
            {selectedBooking.status === 'pending' && hasPermission('approve_booking') && (
              <div className="flex gap-3 justify-end border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="btn-secondary text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-500/20 font-bold"
                >
                  Reject Booking
                </button>
                <button
                  onClick={handleApprove}
                  className="btn-primary font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  Approve Booking
                </button>
              </div>
            )}

            {selectedBooking.status === 'rejected' && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold block mb-1">Rejection Reason</span>
                <p>{selectedBooking.rejected_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - Log Payment Proof */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Upload Payment Proof">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment Amount (₹)</label>
              <input
                type="number"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment Mode</label>
              <select
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                className="w-full glass-input"
              >
                <option value="upi">UPI / Scanner</option>
                <option value="scanner">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Transaction ID / UTR</label>
              <input
                type="text"
                required
                value={paymentForm.transaction_id}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                className="w-full glass-input"
                placeholder="UTR number"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Deposit Account / Details</label>
            <input
              type="text"
              value={paymentForm.received_account}
              onChange={(e) => setPaymentForm({ ...paymentForm, received_account: e.target.value })}
              className="w-full glass-input"
              placeholder="e.g. HDFC Current Account"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Upload Receipt Screenshot</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 transition-colors">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">{paymentFile ? paymentFile.name : 'Choose JPG, PNG, or PDF file (Max 5MB)'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setPaymentFile(e.target.files[0])}
                className="hidden"
                id="screenshot-file-input"
              />
              <button 
                type="button" 
                onClick={() => document.getElementById('screenshot-file-input').click()}
                className="btn-secondary py-1 px-3 text-xs mt-1"
              >
                Select File
              </button>
            </div>
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Submit Payment Proof
          </button>
        </form>
      </Modal>

      {/* Modal - Reject booking */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Booking Request">
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Rejection Reason</label>
            <textarea
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full glass-input h-24 resize-none"
              placeholder="Provide context on why this booking is rejected..."
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

export default Bookings;
