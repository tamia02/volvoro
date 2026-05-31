import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import StatCard from '../components/StatCard';
import { 
  Users, UserCheck, Briefcase, CreditCard, Compass, 
  DollarSign, TrendingUp, AlertTriangle, ArrowRight, CheckCircle, ShieldAlert 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');
        let endpoint = '/dashboard/admin';
        if (user.role === 'sales_exec') endpoint = '/dashboard/sales';
        else if (user.role === 'finance') endpoint = '/dashboard/finance';
        else if (user.role === 'operations') endpoint = '/dashboard/operations';
        else if (user.role === 'marketing') endpoint = '/dashboard/marketing';

        const res = await apiClient.get(endpoint);
        if (res.data.success) {
          setStats(res.data.data);
        } else {
          setError(res.data.message || 'Failed to fetch dashboard metrics');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Connection error. Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 border border-rose-500/20 text-rose-500 max-w-xl mx-auto mt-10">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Error Loading Dashboard
        </h3>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  // Admin Dashboard UI
  if (user.role === 'admin') {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="glass-panel bg-gradient-to-r from-brand-900 to-indigo-950 p-6 text-white relative overflow-hidden flex flex-col justify-center border-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
          <h2 className="text-2xl font-bold font-display">Welcome Back, {user.name}!</h2>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Here is the high-level business oversight of Volvoro CRM operations for today.
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Leads" value={stats.total_leads} icon={Users} description={`${stats.today_leads} new leads today`} trend={`+${stats.today_leads}`} trendType="positive" />
          <StatCard title="Confirmed Bookings" value={stats.total_bookings} icon={Briefcase} description={`${stats.booking_requests_pending} requests pending`} trend={`${stats.booking_requests_pending} pending`} trendType="neutral" />
          <StatCard title="Verified Revenue" value={`₹${stats.monthly_revenue.toLocaleString()}`} icon={CreditCard} description="Accumulated monthly intake" trend="Live intake" trendType="positive" />
          <StatCard title="Estimated Net Profit" value={`₹${stats.total_profit.toLocaleString()}`} icon={DollarSign} description="Net total based on active bills" trend="Profit margin" trendType="positive" />
        </div>

        {/* Alert Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending tasks alerts */}
          <div className="glass-panel p-6 col-span-2">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 dark:text-white">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> Action Items Pending Approval
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Booking Approvals</span>
                  <p className="text-xl font-extrabold dark:text-white mt-1">{stats.booking_requests_pending}</p>
                </div>
                <CheckCircle className={`w-8 h-8 ${stats.booking_requests_pending > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
              </div>
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payment Verifications</span>
                  <p className="text-xl font-extrabold dark:text-white mt-1">{stats.payments_pending_verification}</p>
                </div>
                <CreditCard className={`w-8 h-8 ${stats.payments_pending_verification > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
              </div>
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pending Deletes</span>
                  <p className="text-xl font-extrabold dark:text-white mt-1">{stats.delete_requests_pending}</p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${stats.delete_requests_pending > 0 ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'}`} />
              </div>
              <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Operations Alerts</span>
                  <p className="text-xl font-extrabold dark:text-white mt-1">{stats.pending_vendor_confirmations}</p>
                </div>
                <Compass className={`w-8 h-8 ${stats.pending_vendor_confirmations > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
              </div>
            </div>
          </div>

          {/* Sales Leaderboard */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 dark:text-white">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Sales Leaderboard
            </h3>
            <div className="space-y-3.5">
              {stats.leaderboard && stats.leaderboard.length > 0 ? (
                stats.leaderboard.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-surface-900/40 border border-slate-200/20 dark:border-slate-800/20">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold dark:text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{user.rate}% conv. rate</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                      {user.count} Trips
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 font-medium">No sales data recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sales Executive Dashboard UI
  if (user.role === 'sales_exec') {
    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass-panel bg-gradient-to-r from-indigo-900 to-violet-950 p-6 text-white border-none">
          <h2 className="text-2xl font-bold font-display">Sales Dashboard — {user.name}</h2>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Manage your leads queue, follow up callbacks, and track personal commissions.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Assigned Leads" value={stats.my_leads} icon={Users} description={`${stats.my_hot_leads} classified as hot`} />
          <StatCard title="Follow-Ups Today" value={stats.my_followups_today} icon={Compass} description={`${stats.my_missed_followups} overdue follow-ups`} trendType={stats.my_missed_followups > 0 ? 'negative' : 'neutral'} trend={stats.my_missed_followups > 0 ? `${stats.my_missed_followups} Missed` : 'On track'} />
          <StatCard title="Commission Due" value={`₹${stats.my_commission_pending.toLocaleString()}`} icon={DollarSign} description="Payable upon trip completion" />
          <StatCard title="Commission Paid" value={`₹${stats.my_commission_paid.toLocaleString()}`} icon={CheckCircle} description="Total bonus payout received" />
        </div>
      </div>
    );
  }

  // Finance Dashboard UI
  if (user.role === 'finance') {
    return (
      <div className="space-y-6">
        <div className="glass-panel bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white border-none">
          <h2 className="text-2xl font-bold font-display">Finance Control Panel</h2>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Verify transaction receipts, approve payouts, and manage operational expenditure records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pending Payments" value={stats.payments_pending_verification} icon={CreditCard} description="Awaiting proof approval" trendType={stats.payments_pending_verification > 0 ? 'negative' : 'neutral'} trend={stats.payments_pending_verification > 0 ? 'Action required' : 'Clear'} />
          <StatCard title="Total Cash Intake" value={`₹${stats.verified_payments_total.toLocaleString()}`} icon={TrendingUp} description="Accumulated verified payments" />
          <StatCard title="Commissions Due" value={`₹${stats.commissions_pending.toLocaleString()}`} icon={DollarSign} description="Awaiting payout approval" />
          <StatCard title="Monthly Expenses" value={`₹${stats.total_expenses_month.toLocaleString()}`} icon={CheckCircle} description="Current month outlays" />
        </div>
      </div>
    );
  }

  // Operations Dashboard UI
  if (user.role === 'operations') {
    return (
      <div className="space-y-6">
        <div className="glass-panel bg-gradient-to-r from-emerald-950 to-brand-950 p-6 text-white border-none">
          <h2 className="text-2xl font-bold font-display">Operations Logistics Desk</h2>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Coordinate confirmed trips, verify vendor confirmation slips, and trigger travel confirmations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Upcoming Trips" value={stats.upcoming_trips} icon={Compass} description="Reservations starting soon" />
          <StatCard title="Ongoing Trips" value={stats.ongoing_trips} icon={TrendingUp} description="Customers currently traveling" />
          <StatCard title="Completed Trips" value={stats.completed_trips} icon={CheckCircle} description="Archived successful operations" />
        </div>

        <div className="glass-panel p-6 max-w-2xl">
          <h3 className="text-base font-bold mb-4 dark:text-white">Alert Actions Needed</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40">
              <span className="text-xs font-semibold dark:text-white">Vendor Confirmations Pending</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">{stats.pending_vendor_confirmations} items</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40">
              <span className="text-xs font-semibold dark:text-white">Vouchers to Send</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">{stats.vouchers_to_send} items</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/40">
              <span className="text-xs font-semibold dark:text-white">Itineraries to Dispatch</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">{stats.itineraries_to_send} items</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Marketing Dashboard UI
  if (user.role === 'marketing') {
    const pieData = Object.keys(stats.leads_by_source || {}).map((source) => ({
      name: source,
      value: stats.leads_by_source[source]
    }));

    return (
      <div className="space-y-6">
        <div className="glass-panel bg-gradient-to-r from-purple-900 to-indigo-950 p-6 text-white border-none">
          <h2 className="text-2xl font-bold font-display">Marketing Campaign Panel</h2>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Monitor incoming leads by acquisition channel, conversion percentages, and advertising metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Ad Leads" value={stats.total_leads} icon={Users} description="Combined Meta and Referral channels" />
          <StatCard title="Total Booked Trips" value={stats.booked_leads} icon={Briefcase} description="Successfully converted customers" />
          <StatCard title="Overall Conv. Rate" value={`${stats.conversion_rate}%`} icon={TrendingUp} description="Acquisition funnel percentage" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold mb-4 dark:text-white">Lead Acquisition Source Breakdown</h3>
            <div className="h-64 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No leads generated yet</p>
              )}
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((d, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-semibold">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="capitalize">{d.name.replace('_', ' ')} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
