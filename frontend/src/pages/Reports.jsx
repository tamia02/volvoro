import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, FileDown } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  // State
  const [salesData, setSalesData] = useState([]);
  const [marketingData, setMarketingData] = useState([]);
  const [lostReasons, setLostReasons] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Marketing reports (Accessible to both Marketing & Admin)
      const mRes = await apiClient.get('/reports/marketing');
      const lRes = await apiClient.get('/reports/lost-reasons');
      if (mRes.data.success) setMarketingData(mRes.data.data);
      if (lRes.data.success) setLostReasons(res => lRes.data.data);

      // Financial performance reports (Admin only)
      if (user.role === 'admin') {
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

  const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Business Analytics</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Track marketing campaigns, agent conversion metrics, and lost leads ratios</p>
      </div>

      {/* Admin financial sections */}
      {user.role === 'admin' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" /> Sales Representatives Performance
              </h3>
              <button
                onClick={exportSalesCSV}
                className="btn-secondary py-1.5 flex items-center gap-1.5 text-xs font-bold"
              >
                <FileDown className="w-4 h-4" /> Export Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Total Leads Assigned</th>
                    <th className="py-3 px-4">Booked Trips</th>
                    <th className="py-3 px-4">Conversion Rate</th>
                    <th className="py-3 px-4">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
                  {salesData.length > 0 ? (
                    salesData.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 transition-colors">
                        <td className="py-3.5 px-4 font-bold dark:text-white">{s.name}</td>
                        <td className="py-3.5 px-4 dark:text-slate-300">{s.total_leads}</td>
                        <td className="py-3.5 px-4 text-emerald-500">{s.booked_leads}</td>
                        <td className="py-3.5 px-4 font-extrabold text-brand-600 dark:text-brand-400">{s.conversion_rate}%</td>
                        <td className="py-3.5 px-4 font-extrabold dark:text-white">₹{parseFloat(s.revenue_generated || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">No sales performance logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Marketing & campaigns section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <Users className="w-5 h-5 text-rose-500" /> Lost Leads Reason analysis
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
    </div>
  );
};

export default Reports;
export { Reports };
