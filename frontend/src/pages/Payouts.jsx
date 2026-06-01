import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { DollarSign, CheckCircle, ChevronRight, Filter, AlertCircle, Plus, Calendar, User, Truck, Receipt } from 'lucide-react';

const Payouts = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [payouts, setPayouts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('salary'); // 'salary', 'commission', 'vendor_payment'
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [verifiedDate, setVerifiedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [transactionId, setTransactionId] = useState('');

  // Log Form State
  const [formType, setFormType] = useState('salary');
  // Salary Payout Form fields
  const [salMonth, setSalMonth] = useState('');
  const [salEmployeeId, setSalEmployeeId] = useState('');
  const [salAmount, setSalAmount] = useState('');
  const [salComm, setSalComm] = useState('');
  const [salDeduction, setSalDeduction] = useState('');
  const [salFinal, setSalFinal] = useState('');

  // Commission Payout Form fields
  const [commEmployeeId, setCommEmployeeId] = useState('');
  const [commDestination, setCommDestination] = useState('');
  const [commRevenue, setCommRevenue] = useState('');
  const [commB2B, setCommB2B] = useState('');
  const [commProfit, setCommProfit] = useState('');
  const [commPct, setCommPct] = useState('');
  const [commAmount, setCommAmount] = useState('');

  // Vendor Payment Form fields
  const [vendId, setVendId] = useState('');
  const [vendDestination, setVendDestination] = useState('');
  const [vendCustomer, setVendCustomer] = useState('');
  const [vendPax, setVendPax] = useState('0');
  const [vendTravelDate, setVendTravelDate] = useState('');
  const [vendPackageName, setVendPackageName] = useState('');
  const [vendB2cRate, setVendB2cRate] = useState('');
  const [vendB2bRate, setVendB2bRate] = useState('');
  const [vendPaid, setVendPaid] = useState('');
  const [vendRemaining, setVendRemaining] = useState('');

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/payouts');
      if (res.data.success) {
        setPayouts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch payouts list');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndVendors = async () => {
    try {
      const [uRes, vRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/vendors')
      ]);
      if (uRes.data.success) {
        setEmployees(uRes.data.data.filter(u => u.status === 'active'));
      }
      if (vRes.data.success) {
        setVendors(vRes.data.data.filter(v => v.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching users/vendors:', err);
    }
  };

  useEffect(() => {
    fetchPayouts();
    fetchUsersAndVendors();
  }, []);

  // Recalculate salary final amount
  useEffect(() => {
    const s = parseFloat(salAmount || 0);
    const c = parseFloat(salComm || 0);
    const d = parseFloat(salDeduction || 0);
    setSalFinal((s + c - d).toString());
  }, [salAmount, salComm, salDeduction]);

  // Recalculate commission amounts
  useEffect(() => {
    const rev = parseFloat(commRevenue || 0);
    const b2b = parseFloat(commB2B || 0);
    const profit = rev - b2b;
    setCommProfit(profit.toString());
    
    const pct = parseFloat(commPct || 0);
    setCommAmount((profit * (pct / 100)).toString());
  }, [commRevenue, commB2B, commPct]);

  // Recalculate vendor remaining amount
  useEffect(() => {
    const b2b = parseFloat(vendB2bRate || 0);
    const paid = parseFloat(vendPaid || 0);
    setVendRemaining((b2b - paid).toString());
  }, [vendB2bRate, vendPaid]);

  // Set default values when employee selected for Salary
  const handleSalaryEmployeeChange = (empId) => {
    setSalEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setSalAmount(emp.salary_amount || '0');
      setSalComm('0');
      setSalDeduction('0');
    }
  };

  // Set default values when employee selected for Commission
  const handleCommissionEmployeeChange = (empId) => {
    setCommEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setCommPct(emp.commission_percentage || '0');
    }
  };

  const handleLogPayoutSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = { payout_type: formType };
      if (formType === 'salary') {
        payload = {
          ...payload,
          month: salMonth,
          employee_id: salEmployeeId,
          salary_amount: parseFloat(salAmount || 0),
          commission_amount: parseFloat(salComm || 0),
          deduction_amount: parseFloat(salDeduction || 0),
          final_amount: parseFloat(salFinal || 0)
        };
      } else if (formType === 'commission') {
        payload = {
          ...payload,
          employee_id: commEmployeeId,
          destination: commDestination,
          revenue_amount: parseFloat(commRevenue || 0),
          b2b_amount: parseFloat(commB2B || 0),
          profit_amount: parseFloat(commProfit || 0),
          commission_percentage: parseFloat(commPct || 0),
          commission_amount: parseFloat(commAmount || 0)
        };
      } else if (formType === 'vendor_payment') {
        payload = {
          ...payload,
          vendor_id: vendId,
          destination: vendDestination,
          customer_name: vendCustomer,
          pax_count: parseInt(vendPax || 0),
          travel_date: vendTravelDate,
          package_name: vendPackageName,
          b2c_rate: parseFloat(vendB2cRate || 0),
          b2b_rate: parseFloat(vendB2bRate || 0),
          amount_paid: parseFloat(vendPaid || 0),
          remaining_amount: parseFloat(vendRemaining || 0)
        };
      }

      const res = await apiClient.post('/payouts', payload);
      if (res.data.success) {
        setIsLogModalOpen(false);
        resetForm();
        fetchPayouts();
        alert('Payout logged successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging payout');
    }
  };

  const resetForm = () => {
    setSalMonth('');
    setSalEmployeeId('');
    setSalAmount('');
    setSalComm('');
    setSalDeduction('');
    setSalFinal('');
    setCommEmployeeId('');
    setCommDestination('');
    setCommRevenue('');
    setCommB2B('');
    setCommProfit('');
    setCommPct('');
    setCommAmount('');
    setVendId('');
    setVendDestination('');
    setVendCustomer('');
    setVendPax('0');
    setVendTravelDate('');
    setVendPackageName('');
    setVendB2cRate('');
    setVendB2bRate('');
    setVendPaid('');
    setVendRemaining('');
  };

  const handleStatusTransitionSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus || !selectedPayout) return;

    try {
      const payload = {
        status: newStatus,
        verified_amount: parseFloat(verifiedAmount || 0),
        verified_date: verifiedDate,
        payment_mode: paymentMode,
        transaction_id: transactionId
      };

      const res = await apiClient.put(`/payouts/${selectedPayout.id}/status`, payload);
      if (res.data.success) {
        setIsDetailModalOpen(false);
        setSelectedPayout(null);
        fetchPayouts();
        alert('Payout verified and status updated successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating payout status');
    }
  };

  const handleRowClick = (payout) => {
    setSelectedPayout(payout);
    setNewStatus(payout.status);
    
    let defaultAmt = 0;
    if (payout.payout_type === 'salary') {
      defaultAmt = payout.final_amount;
    } else if (payout.payout_type === 'commission') {
      defaultAmt = payout.commission_amount;
    } else if (payout.payout_type === 'vendor_payment') {
      defaultAmt = payout.amount_paid;
    }
    
    setVerifiedAmount(payout.verified_amount || defaultAmt);
    setVerifiedDate(payout.verified_date || new Date().toISOString().split('T')[0]);
    setPaymentMode(payout.payment_mode || 'Bank Transfer');
    setTransactionId(payout.transaction_id || '');
    setIsDetailModalOpen(true);
  };

  const filteredPayouts = payouts.filter(p => {
    const tabMatch = p.payout_type === activeTab;
    const statusMatch = statusFilter ? p.status === statusFilter : true;
    return tabMatch && statusMatch;
  });

  const getStatusBadge = (status) => {
    const classes = {
      unpaid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      received: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200/50',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50',
      hold: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50'
    };
    return `text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Payout Management</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage salaries, commissions, and B2B vendor payments</p>
        </div>
        {hasPermission('manage_payouts') && (
          <button
            onClick={() => {
              setFormType(activeTab);
              setIsLogModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            Log New Payout
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('salary'); setStatusFilter(''); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'salary' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Salary Payouts
        </button>
        <button
          onClick={() => { setActiveTab('commission'); setStatusFilter(''); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'commission' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Commission Payouts
        </button>
        <button
          onClick={() => { setActiveTab('vendor_payment'); setStatusFilter(''); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'vendor_payment' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Vendor Payments
        </button>
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
            <option value="unpaid">Unpaid / Unsettled</option>
            <option value="pending">Pending Verification</option>
            <option value="paid">Paid</option>
            {activeTab === 'vendor_payment' && <option value="received">Received</option>}
            <option value="rejected">Rejected</option>
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
                <th className="py-4 px-6">Details</th>
                {activeTab !== 'vendor_payment' ? <th className="py-4 px-6">Employee</th> : <th className="py-4 px-6">Vendor</th>}
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(p)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold">
                          {p.payout_type === 'salary' ? <Calendar className="w-4 h-4" /> : p.payout_type === 'commission' ? <User className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-semibold block dark:text-white">
                            {p.payout_type === 'salary' && `Salary - ${p.month}`}
                            {p.payout_type === 'commission' && `Commission - ${p.destination || 'N/A'}`}
                            {p.payout_type === 'vendor_payment' && `B2B Payment - ${p.destination || 'N/A'}`}
                          </span>
                          <span className="text-[10px] text-slate-400">ID: {p.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold dark:text-slate-200">
                      {p.payout_type !== 'vendor_payment' ? (p.employee?.name || 'Staff') : (p.vendor?.company_name || p.vendor?.name || 'Vendor')}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-brand-600 dark:text-brand-400">
                      ₹{parseFloat(p.final_amount || p.commission_amount || p.amount_paid || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(p.status)}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {p.createdAt ? p.createdAt.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No payout records generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Log Payout */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Payout Transaction">
        <form onSubmit={handleLogPayoutSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Category Type</label>
            <select
              value={formType}
              onChange={(e) => { setFormType(e.target.value); resetForm(); }}
              className="w-full glass-input"
            >
              <option value="salary">Salary Form</option>
              <option value="commission">Commission Form</option>
              <option value="vendor_payment">Vendor Payment Form</option>
            </select>
          </div>

          {/* Salary Form Fields */}
          {formType === 'salary' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Month</label>
                <input
                  type="month"
                  required
                  value={salMonth}
                  onChange={(e) => setSalMonth(e.target.value)}
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Employee</label>
                <select
                  required
                  value={salEmployeeId}
                  onChange={(e) => handleSalaryEmployeeChange(e.target.value)}
                  className="w-full glass-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Base Salary</label>
                  <input
                    type="number"
                    value={salAmount}
                    onChange={(e) => setSalAmount(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Commission</label>
                  <input
                    type="number"
                    value={salComm}
                    onChange={(e) => setSalComm(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Deduction</label>
                  <input
                    type="number"
                    value={salDeduction}
                    onChange={(e) => setSalDeduction(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Final Salary (Auto-calculated)</label>
                <input
                  type="number"
                  readOnly
                  value={salFinal}
                  className="w-full glass-input bg-slate-100 dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-extrabold"
                  placeholder="₹"
                />
              </div>
            </>
          )}

          {/* Commission Form Fields */}
          {formType === 'commission' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Employee</label>
                <select
                  required
                  value={commEmployeeId}
                  onChange={(e) => handleCommissionEmployeeChange(e.target.value)}
                  className="w-full glass-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Destination</label>
                <input
                  type="text"
                  value={commDestination}
                  onChange={(e) => setCommDestination(e.target.value)}
                  className="w-full glass-input"
                  placeholder="e.g. Kashmir"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Revenue Amount</label>
                  <input
                    type="number"
                    value={commRevenue}
                    onChange={(e) => setCommRevenue(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">B2B Amount</label>
                  <input
                    type="number"
                    value={commB2B}
                    onChange={(e) => setCommB2B(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Profit (calculated)</label>
                  <input
                    type="number"
                    readOnly
                    value={commProfit}
                    className="w-full glass-input bg-slate-100 dark:bg-surface-800"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Commission %</label>
                  <input
                    type="number"
                    value={commPct}
                    onChange={(e) => setCommPct(e.target.value)}
                    className="w-full glass-input"
                    placeholder="%"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Commission Amount (calculated)</label>
                <input
                  type="number"
                  readOnly
                  value={commAmount}
                  className="w-full glass-input bg-slate-100 dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-extrabold"
                  placeholder="₹"
                />
              </div>
            </>
          )}

          {/* Vendor Payment Form Fields */}
          {formType === 'vendor_payment' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Vendor Partner</label>
                <select
                  required
                  value={vendId}
                  onChange={(e) => setVendId(e.target.value)}
                  className="w-full glass-input"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name || v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Destination</label>
                  <input
                    type="text"
                    value={vendDestination}
                    onChange={(e) => setVendDestination(e.target.value)}
                    className="w-full glass-input"
                    placeholder="e.g. Ladakh"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={vendCustomer}
                    onChange={(e) => setVendCustomer(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Pax Count</label>
                  <input
                    type="number"
                    value={vendPax}
                    onChange={(e) => setVendPax(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Travel Date</label>
                  <input
                    type="date"
                    value={vendTravelDate}
                    onChange={(e) => setVendTravelDate(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Package</label>
                  <input
                    type="text"
                    value={vendPackageName}
                    onChange={(e) => setVendPackageName(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">B2C Rate</label>
                  <input
                    type="number"
                    value={vendB2cRate}
                    onChange={(e) => setVendB2cRate(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">B2B Rate</label>
                  <input
                    type="number"
                    value={vendB2bRate}
                    onChange={(e) => setVendB2bRate(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Amount Paid</label>
                  <input
                    type="number"
                    value={vendPaid}
                    onChange={(e) => setVendPaid(e.target.value)}
                    className="w-full glass-input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Remaining (calculated)</label>
                  <input
                    type="number"
                    readOnly
                    value={vendRemaining}
                    className="w-full glass-input bg-slate-100 dark:bg-surface-800"
                    placeholder="₹"
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-4">
            Save Payout Request
          </button>
        </form>
      </Modal>

      {/* Modal - Payout Details & Verification */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Payout Details & Verification">
        {selectedPayout && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Payout Category</span>
                <span className="dark:text-white capitalize font-bold">{selectedPayout.payout_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Current Status</span>
                <span className={getStatusBadge(selectedPayout.status)}>{selectedPayout.status}</span>
              </div>

              {selectedPayout.payout_type === 'salary' && (
                <>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Salary Month</span>
                    <span className="dark:text-white">{selectedPayout.month}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Employee Name</span>
                    <span className="dark:text-white">{selectedPayout.employee?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Base Salary</span>
                    <span className="dark:text-white">₹{selectedPayout.salary_amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Commission / Deductions</span>
                    <span className="dark:text-white">₹{selectedPayout.commission_amount} / -₹{selectedPayout.deduction_amount}</span>
                  </div>
                </>
              )}

              {selectedPayout.payout_type === 'commission' && (
                <>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Employee Name</span>
                    <span className="dark:text-white">{selectedPayout.employee?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Destination / Profit</span>
                    <span className="dark:text-white">{selectedPayout.destination || 'N/A'} (₹{selectedPayout.profit_amount})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Rate / Amount</span>
                    <span className="dark:text-white">{selectedPayout.commission_percentage}% / ₹{selectedPayout.commission_amount}</span>
                  </div>
                </>
              )}

              {selectedPayout.payout_type === 'vendor_payment' && (
                <>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Vendor Partner</span>
                    <span className="dark:text-white">{selectedPayout.vendor?.company_name || selectedPayout.vendor?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Customer Name / Pax</span>
                    <span className="dark:text-white">{selectedPayout.customer_name} ({selectedPayout.pax_count} Pax)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Destination / Package</span>
                    <span className="dark:text-white">{selectedPayout.destination} ({selectedPayout.package_name})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Travel Date</span>
                    <span className="dark:text-white">{selectedPayout.travel_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-bold text-emerald-600 dark:text-emerald-400">B2B Rate / Paid</span>
                    <span className="dark:text-white">₹{selectedPayout.b2b_rate} / ₹{selectedPayout.amount_paid}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Remaining Balance</span>
                    <span className="dark:text-white">₹{selectedPayout.remaining_amount}</span>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-900/30 border border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Total Requested Payout</span>
              <span className="text-brand-600 dark:text-brand-400 text-lg font-extrabold">
                ₹{parseFloat(selectedPayout.final_amount || selectedPayout.commission_amount || selectedPayout.amount_paid || 0).toLocaleString()}
              </span>
            </div>

            {/* Display verification details if verified */}
            {['paid', 'received'].includes(selectedPayout.status) && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold space-y-1">
                <span className="text-[10px] uppercase font-extrabold block text-emerald-700 dark:text-emerald-400">Payment Verification Log</span>
                <p><strong>Verified Amount:</strong> ₹{selectedPayout.verified_amount}</p>
                <p><strong>Payment Date:</strong> {selectedPayout.verified_date}</p>
                <p><strong>Payment Method:</strong> {selectedPayout.payment_mode}</p>
                <p><strong>Transaction ID/Ref (UTR):</strong> {selectedPayout.transaction_id || 'N/A'}</p>
                <p><strong>Verified By:</strong> {selectedPayout.verifier?.name || 'System'}</p>
              </div>
            )}

            {/* Edit / Transition form (visible to admin/finance) */}
            {hasPermission('manage_payouts') && !['paid', 'received'].includes(selectedPayout.status) && (
              <form onSubmit={handleStatusTransitionSubmit} className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <div className="flex gap-3 bg-brand-500/5 border border-brand-500/10 p-3.5 rounded-xl text-brand-600 dark:text-violet-400 text-xs font-semibold">
                  <Receipt className="w-5 h-5 shrink-0" />
                  <p>Submit payment verification details when marking this transaction as Paid (or Received).</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full glass-input"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending Verification</option>
                      <option value="paid">Paid</option>
                      {selectedPayout.payout_type === 'vendor_payment' && <option value="received">Received</option>}
                      <option value="rejected">Rejected</option>
                      <option value="hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Verified Amount</label>
                    <input
                      type="number"
                      required
                      value={verifiedAmount}
                      onChange={(e) => setVerifiedAmount(e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {['paid', 'received'].includes(newStatus) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Verification Date</label>
                        <input
                          type="date"
                          required
                          value={verifiedDate}
                          onChange={(e) => setVerifiedDate(e.target.value)}
                          className="w-full glass-input"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full glass-input"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Transaction ID / UTR Code</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full glass-input"
                        placeholder="e.g. UTR123456789"
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
                  Apply Status Change
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payouts;
