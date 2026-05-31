import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { 
  Plus, Search, Filter, Calendar, Compass, UserPlus, FileDown, 
  AlertTriangle, Phone, Globe, CheckCircle, Clock, ChevronRight 
} from 'lucide-react';

const Leads = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]); // List of sales execs for assigning

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    primary_mobile: '',
    alternate_mobile: '',
    city: '',
    notes: '',
    source: 'meta_ads',
    campaign_name: '',
    destination: '',
    pax_count: 1,
    travel_date: '',
    assigned_to: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await apiClient.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leads list');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const res = await apiClient.get('/users');
      if (res.data.success) {
        // Filter only active sales execs
        setUsers(res.data.data.filter(u => u.role === 'sales_exec' && u.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching sales reps:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    if (hasPermission('assign_lead')) {
      fetchSalespersons();
    }
  }, [statusFilter, sourceFilter, startDate, endDate]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/leads', formData);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        fetchLeads();
        // Reset form
        setFormData({
          name: '',
          primary_mobile: '',
          alternate_mobile: '',
          city: '',
          notes: '',
          source: 'meta_ads',
          campaign_name: '',
          destination: '',
          pax_count: 1,
          travel_date: '',
          assigned_to: ''
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;

    try {
      const res = await apiClient.post(`/leads/${selectedLeadId}/assign`, {
        assigned_to: assigneeId,
        notes: 'Lead manual assignation via dashboard'
      });
      if (res.data.success) {
        setIsAssignModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning lead');
    }
  };

  const exportCSV = () => {
    const headers = 'Lead ID,Customer Name,Mobile,Destination,Status,Source,Assigned To,Lead Date\n';
    const rows = leads.map(l => 
      `"${l.id}","${l.customer.name}","${l.customer.primary_mobile}","${l.destination}","${l.status}","${l.source}","${l.assignedUser ? l.assignedUser.name : 'Unassigned'}","${l.lead_date}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const term = search.toLowerCase();
    return (
      l.customer.name.toLowerCase().includes(term) ||
      l.customer.primary_mobile.includes(term) ||
      l.destination.toLowerCase().includes(term)
    );
  });

  const getStatusBadgeClass = (status) => {
    const classes = {
      new: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50',
      contacted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50',
      interested: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50',
      hot: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 animate-pulse',
      warm: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50',
      cold: 'bg-slate-100 text-slate-700 dark:bg-surface-800 dark:text-slate-400 border-slate-200/50',
      quote_sent: 'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400 border-pink-200/50',
      follow_up: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-200/50',
      booking_request: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50',
      booked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      lost: 'bg-gray-100 text-gray-700 dark:bg-surface-800 dark:text-gray-400 border-gray-200/50',
      fake: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50'
    };
    return `text-xs font-bold px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Leads Pipeline</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Filter, update, and manage agency client enquiries</p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('create_lead') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Lead
            </button>
          )}

          {hasPermission('view_lead_source_reports') && (
            <button
              onClick={exportCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, mobile, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-10"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input py-2 text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="hot">Hot</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="follow_up">Follow Up</option>
              <option value="booking_request">Booking Request</option>
              <option value="booked">Booked</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="glass-input py-2 text-xs font-semibold"
          >
            <option value="">All Sources</option>
            <option value="meta_ads">Meta Ads</option>
            <option value="referral">Referral</option>
          </select>

          {/* Date Picker */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50/50 dark:bg-surface-900/40 p-1 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent focus:outline-none dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent focus:outline-none dark:text-white pr-2"
            />
          </div>
        </div>
      </div>

      {/* Leads table */}
      <div className="glass-panel overflow-hidden border border-slate-200/45 dark:border-slate-800/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-900/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Client Name</th>
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Assigned To</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Next Follow-Up</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20 text-sm">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50/30 dark:hover:bg-surface-800/10 cursor-pointer transition-colors"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold">
                          {lead.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold block dark:text-white">{lead.customer.name}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" /> {lead.customer.primary_mobile}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold dark:text-slate-200">{lead.destination}</span>
                        <span className="text-xs text-slate-400">({lead.pax_count} Pax)</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold capitalize bg-slate-100/60 dark:bg-surface-900/60 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/20 dark:border-slate-800/20">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      {lead.assignedUser ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold dark:text-slate-300">{lead.assignedUser.name}</span>
                          {hasPermission('assign_lead') && (
                            <button
                              onClick={() => {
                                setSelectedLeadId(lead.id);
                                setAssigneeId(lead.assigned_to || '');
                                setIsAssignModalOpen(true);
                              }}
                              className="text-brand-500 hover:text-brand-700 p-1 rounded-lg"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unassigned
                          {hasPermission('assign_lead') && (
                            <button
                              onClick={() => {
                                setSelectedLeadId(lead.id);
                                setAssigneeId('');
                                setIsAssignModalOpen(true);
                              }}
                              className="text-brand-500 hover:text-brand-700 p-1 ml-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadgeClass(lead.status)}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {lead.next_followup_date ? (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {lead.next_followup_date}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-brand-600 p-1.5 rounded-lg">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No leads found matching query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Create Lead */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Tour Lead">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Primary Mobile</label>
              <input
                type="text"
                required
                value={formData.primary_mobile}
                onChange={(e) => setFormData({ ...formData, primary_mobile: e.target.value })}
                className="w-full glass-input"
                placeholder="10 digit number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Alternate Mobile</label>
              <input
                type="text"
                value={formData.alternate_mobile}
                onChange={(e) => setFormData({ ...formData, alternate_mobile: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full glass-input"
              >
                <option value="meta_ads">Meta Ads</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Campaign/Referrer Name</label>
              <input
                type="text"
                value={formData.campaign_name}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. Summer Campaign"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Destination</label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. Bali, Thailand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pax Count</label>
              <input
                type="number"
                min="1"
                value={formData.pax_count}
                onChange={(e) => setFormData({ ...formData, pax_count: parseInt(e.target.value) || 1 })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Travel Date</label>
              <input
                type="date"
                value={formData.travel_date}
                onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Assign to Agent</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full glass-input"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Lead Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input h-20 resize-none"
              placeholder="Enter context, special instructions, package type..."
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Create Lead Pipeline
          </button>
        </form>
      </Modal>

      {/* Modal - Assign Lead */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Lead to Agent">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Sales Representative</label>
            <select
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full glass-input"
            >
              <option value="">-- Choose Agent --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Reassign Lead
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
