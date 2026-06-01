import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, FileDown, Compass, Calendar, Sparkles } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  // State
  const [activeSection, setActiveSection] = useState('sales'); // 'sales', 'operations', 'marketing'
  const [timeframe, setTimeframe] = useState('monthly'); // 'daily', 'weekly', 'monthly'
  const [salesData, setSalesData] = useState([]);
  const [marketingData, setMarketingData] = useState([]);
  const [lostReasons, setLostReasons] = useState({});
  const [rawLeads, setRawLeads] = useState([]);
  const [rawBookings, setRawBookings] = useState([]);
  const [rawOperations, setRawOperations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Marketing reports & baseline metrics
      const [mRes, lRes, leadsRes, bookingsRes, opsRes] = await Promise.all([
        apiClient.get('/reports/marketing'),
        apiClient.get('/reports/lost-reasons'),
        apiClient.get('/leads'),
        apiClient.get('/bookings'),
        apiClient.get('/operations/bookings')
      ]);

      if (mRes.data.success) setMarketingData(mRes.data.data);
      if (lRes.data.success) setLostReasons(lRes.data.data);
      if (leadsRes.data.success) setRawLeads(leadsRes.data.data);
      if (bookingsRes.data.success) setRawBookings(bookingsRes.data.data);
      if (opsRes.data.success) setRawOperations(opsRes.data.data);

      // Financial performance reports (Admin/Finance only)
      if (user.role === 'admin' || user.role === 'finance') {
        const sRes = await apiClient.get('/reports/sales-exec');
        if (sRes.data.success) setSalesData(sRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching reports metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // Helper to format date into grouping key based on timeframe
  const getGroupKey = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';

    if (timeframe === 'daily') {
      return dateStr; // YYYY-MM-DD
    } else if (timeframe === 'weekly') {
      // Calculate week number
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${date.getFullYear()}-W${weekNum}`;
    } else {
      // Monthly
      return dateStr.substring(0, 7); // YYYY-MM
    }
  };

  // Compile Sales Timeline Performance Trend
  const getSalesTrendData = () => {
    const trendMap = {};

    rawBookings.forEach(b => {
      const key = getGroupKey(b.travel_date || b.createdAt?.split('T')[0]);
      if (!trendMap[key]) {
        trendMap[key] = { label: key, revenue: 0, bookingsCount: 0 };
      }
      trendMap[key].revenue += parseFloat(b.package_amount || 0);
      trendMap[key].bookingsCount += 1;
    });

    // Sort by date key
    return Object.keys(trendMap)
      .sort()
      .map(k => trendMap[k]);
  };

  // Compile Operations Timeline Trend
  const getOperationsTrendData = () => {
    const trendMap = {};

    rawOperations.forEach(op => {
      const b = op.booking;
      if (!b) return;
      const key = getGroupKey(b.travel_date);
      if (!trendMap[key]) {
        trendMap[key] = { label: key, upcoming: 0, ongoing: 0, completed: 0 };
      }
      if (op.trip_status === 'upcoming') trendMap[key].upcoming += 1;
      if (op.trip_status === 'ongoing') trendMap[key].ongoing += 1;
      if (op.trip_status === 'completed') trendMap[key].completed += 1;
    });

    return Object.keys(trendMap)
      .sort()
      .map(k => trendMap[k]);
  };

  // Export Sales Exec scorecard
  const exportSalesCSV = () => {
    const headers = 'Representative Name,Mobile,Total Leads,Booked Trips,Revenue Generated,Conversion Rate\n';
    const rows = salesData.map(s => 
      `"${s.name}","${s.mobile}","${s.total_leads}","${s.booked_leads}","${s.revenue_generated}","${s.conversion_rate}%"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salesperson_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const salesTrend = getSalesTrendData();
  const operationsTrend = getOperationsTrendData();

  // Aggregate Operations checklist stats
  const totalOps = rawOperations.length;
  const vouchersSent = rawOperations.filter(op => op.voucher_sent).length;
  const itinerariesSent = rawOperations.filter(op => op.itinerary_sent).length;
  const confirmationsRec = rawOperations.filter(op => op.customer_confirmation_sent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Business Analytics & Performance</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Track conversion metrics, dispatch activity, and lead performance trends</p>
      </div>

      {/* Tab Switcher for Reports Sections */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSection('sales')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeSection === 'sales' ? 'border-brand-500 text-brand-600 dark:text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Sales Analytics
        </button>
        <button
          onClick={() => setActiveSection('operations')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeSection === 'operations' ? 'border-brand-500 text-brand-600 dark:text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Operations Analytics
        </button>
        <button
          onClick={() => setActiveSection('marketing')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeSection === 'marketing' ? 'border-brand-500 text-brand-600 dark:text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Marketing Analytics
        </button>
      </div>

      {/* SECTION 1: SALES ANALYTICS */}
      {activeSection === 'sales' && (
        <div className="space-y-6">
          {/* Section Header with Timeframe switcher */}
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-slate-200/10">
            <span className="text-xs font-bold uppercase text-slate-400">Sales Timeframe:</span>
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-slate-200/10">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'daily' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'weekly' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'monthly' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Sales summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-l-4 border-l-brand-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                ₹{rawBookings.reduce((sum, b) => sum + parseFloat(b.package_amount || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawBookings.length}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads Received</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawLeads.length}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-purple-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Conversion Rate</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawLeads.length > 0 ? ((rawBookings.length / rawLeads.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Scorecard Table */}
            {(user.role === 'admin' || user.role === 'finance') && (
              <div className="glass-panel p-6 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold dark:text-white text-sm">Representative Conversions</h4>
                  <button
                    onClick={exportSalesCSV}
                    className="btn-secondary py-1.5 flex items-center gap-1.5 text-[10px] font-bold"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Export Scorecard
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Representative</th>
                        <th className="py-3 px-4 text-center">Leads Assigned</th>
                        <th className="py-3 px-4 text-center">Trips Booked</th>
                        <th className="py-3 px-4 text-center">Conversion %</th>
                        <th className="py-3 px-4 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20">
                      {salesData.length > 0 ? (
                        salesData.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 transition-colors">
                            <td className="py-3 px-4 font-bold dark:text-white">{s.name}</td>
                            <td className="py-3 px-4 text-center dark:text-slate-300">{s.total_leads}</td>
                            <td className="py-3 px-4 text-center text-emerald-500 font-bold">{s.booked_leads}</td>
                            <td className="py-3 px-4 text-center font-extrabold text-brand-600 dark:text-brand-400">{s.conversion_rate}%</td>
                            <td className="py-3 px-4 text-right font-extrabold dark:text-white">₹{parseFloat(s.revenue_generated || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">No sales performance data logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Revenue Over Time Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold dark:text-white text-sm mb-4">Bookings Revenue Trend ({timeframe})</h4>
                <div className="h-48">
                  {salesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">No bookings registered in this range.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OPERATIONS ANALYTICS */}
      {activeSection === 'operations' && (
        <div className="space-y-6">
          {/* Section Header with Timeframe switcher */}
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-slate-200/10">
            <span className="text-xs font-bold uppercase text-slate-400">Operations Timeframe:</span>
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-slate-200/10">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'daily' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'weekly' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'monthly' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Operations summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-l-4 border-l-brand-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trips Dispatched</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {totalOps}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Trips</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawOperations.filter(op => op.trip_status === 'completed').length}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ongoing Trips</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawOperations.filter(op => op.trip_status === 'ongoing').length}
              </span>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Trips</span>
              <span className="text-2xl font-display font-extrabold dark:text-white mt-2 block">
                {rawOperations.filter(op => op.trip_status === 'upcoming').length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operations Trend Chart */}
            <div className="glass-panel p-6 lg:col-span-2 space-y-4">
              <h4 className="font-bold dark:text-white text-sm">Trip Dispatches ({timeframe})</h4>
              <div className="h-64">
                {operationsTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Bar dataKey="upcoming" name="Upcoming Trips" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="ongoing" name="Ongoing Trips" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="completed" name="Completed Trips" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">No trip activities dispatching over this range.</div>
                )}
              </div>
            </div>

            {/* Coordination checklist KPIs */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold dark:text-white text-sm mb-4">Operations Document Metrics</h4>
                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Vouchers Released</span>
                      <span className="dark:text-white">{vouchersSent} / {totalOps} ({totalOps > 0 ? Math.round((vouchersSent/totalOps)*100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${totalOps > 0 ? (vouchersSent/totalOps)*100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Itineraries Sent to Drivers</span>
                      <span className="dark:text-white">{itinerariesSent} / {totalOps} ({totalOps > 0 ? Math.round((itinerariesSent/totalOps)*100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalOps > 0 ? (itinerariesSent/totalOps)*100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Customer Confirmations</span>
                      <span className="dark:text-white">{confirmationsRec} / {totalOps} ({totalOps > 0 ? Math.round((confirmationsRec/totalOps)*100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalOps > 0 ? (confirmationsRec/totalOps)*100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl flex items-center gap-2 mt-4">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <p className="text-[10px] text-slate-400">Dispatch statistics indicate customer satisfaction and driver preparation levels.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MARKETING ANALYTICS */}
      {activeSection === 'marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Campaign conversion */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold mb-4 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> Campaign Lead Conversions
            </h3>
            <div className="h-64">
              {marketingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="campaign" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="leads_count" name="Total Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="booked_count" name="Booked Trips" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No campaign statistics recorded.</p>
              )}
            </div>
          </div>

          {/* Lost reason ratios */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold mb-4 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" /> Lost Leads Reason Analysis
            </h3>
            <div className="space-y-4">
              {Object.keys(lostReasons || {}).length > 0 ? (
                Object.keys(lostReasons).map((reason, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold dark:text-slate-300">
                      <span className="capitalize">{reason.replace('_', ' ')}</span>
                      <span className="font-extrabold">{lostReasons[reason]} leads</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (lostReasons[reason] / Object.values(lostReasons).reduce((a,b)=>a+b, 0)) * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No lost leads recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
export { Reports };
