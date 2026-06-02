import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { 
  ArrowLeft, Edit3, Calendar, Compass, Phone, Globe, DollarSign, 
  MessageSquare, Clock, Plus, ShieldAlert, AlertTriangle, FileText, CheckCircle 
} from 'lucide-react';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  // Core Lead State
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Lists state
  const [followups, setFollowups] = useState([]);
  const [quotes, setQuotes] = useState([]);

  // Modals state
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Deletion state
  const [deleteReason, setDeleteReason] = useState('');

  // Status Change Helper state
  const [pendingStatus, setPendingStatus] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

  // Lead Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    primary_mobile: '',
    alternate_mobile: '',
    city: '',
    notes: '',
    destination: '',
    travel_date: '',
    pax_count: 1,
    group_type: '',
    budget_per_person: '',
    pickup_city: '',
    hotel_category: '',
    meal_plan: '',
    special_requirements: '',
    best_time_to_call: ''
  });

  // Follow-up Form State
  const [followupForm, setFollowupForm] = useState({
    contact_method: 'call',
    followup_date: new Date().toISOString().split('T')[0],
    next_followup_date: '',
    notes: ''
  });

  // Quotation Form State
  const [quoteForm, setQuoteForm] = useState({
    destination: '',
    duration: '',
    pickup_city: '',
    hotel_category: '',
    meal_plan: '',
    transport_type: '',
    selling_price: '',
    advance_amount: '',
    inclusions: '',
    exclusions: '',
    cancellation_terms: '',
    status: 'draft'
  });

  // Booking Request Form State
  const [bookingForm, setBookingForm] = useState({
    travel_date: '',
    pax_count: '',
    package_amount: '',
    advance_amount: '',
    pickup_location: '',
    emergency_contact: '',
    notes: ''
  });

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/leads/${id}`);
      if (res.data.success) {
        const leadData = res.data.data;
        setLead(leadData);
        setEditForm({
          name: leadData.customer.name,
          primary_mobile: leadData.customer.primary_mobile,
          alternate_mobile: leadData.customer.alternate_mobile || '',
          city: leadData.customer.city || '',
          notes: leadData.customer.notes || '',
          destination: leadData.destination,
          travel_date: leadData.travel_date || '',
          pax_count: leadData.pax_count,
          group_type: leadData.group_type || '',
          budget_per_person: leadData.budget_per_person || '',
          pickup_city: leadData.pickup_city || '',
          hotel_category: leadData.hotel_category || '',
          meal_plan: leadData.meal_plan || '',
          special_requirements: leadData.special_requirements || '',
          best_time_to_call: leadData.best_time_to_call || ''
        });
      }
    } catch (err) {
      console.error(err);
      setError('Lead not found or access restricted');
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      // Fetch followups
      const fRes = await apiClient.get(`/followups/lead/${id}`);
      if (fRes.data.success) setFollowups(fRes.data.data);

      // Fetch quotations
      const qRes = await apiClient.get(`/quotes/lead/${id}`);
      if (qRes.data.success) setQuotes(qRes.data.data);
    } catch (err) {
      console.error('Error fetching timeline lists:', err);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
    fetchLists();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.put(`/leads/${id}`, editForm);
      if (res.data.success) {
        setIsEditing(false);
        fetchLeadDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating details');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'lost') {
      setPendingStatus(newStatus);
      setIsLostModalOpen(true);
      return;
    }

    try {
      const res = await apiClient.patch(`/leads/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchLeadDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleLostSubmit = async (e) => {
    e.preventDefault();
    if (!lostReason) return;

    try {
      const res = await apiClient.patch(`/leads/${id}/status`, {
        status: pendingStatus,
        lost_reason: lostReason,
        lost_note: lostNote
      });
      if (res.data.success) {
        setIsLostModalOpen(false);
        setLostReason('');
        setLostNote('');
        fetchLeadDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving status');
    }
  };

  const handleFollowupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/followups', {
        ...followupForm,
        lead_id: id
      });
      if (res.data.success) {
        setIsFollowupModalOpen(false);
        setFollowupForm({
          contact_method: 'call',
          followup_date: new Date().toISOString().split('T')[0],
          next_followup_date: '',
          notes: ''
        });
        fetchLeadDetails();
        fetchLists();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging callback');
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/quotes', {
        ...quoteForm,
        lead_id: id
      });
      if (res.data.success) {
        setIsQuoteModalOpen(false);
        setQuoteForm({
          destination: '',
          duration: '',
          pickup_city: '',
          hotel_category: '',
          meal_plan: '',
          transport_type: '',
          selling_price: '',
          advance_amount: '',
          inclusions: '',
          exclusions: '',
          cancellation_terms: '',
          status: 'draft'
        });
        fetchLeadDetails();
        fetchLists();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving quote');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/bookings', {
        ...bookingForm,
        lead_id: id,
        destination: lead.destination
      });
      if (res.data.success) {
        setIsBookingModalOpen(false);
        setBookingForm({
          travel_date: '',
          pax_count: '',
          package_amount: '',
          advance_amount: '',
          pickup_location: '',
          emergency_contact: '',
          notes: ''
        });
        fetchLeadDetails();
        alert('Booking request raised. Awaiting payment upload.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error raising booking');
    }
  };

  const handleDeleteRequest = async (e) => {
    e.preventDefault();
    if (!deleteReason) return;

    try {
      const res = await apiClient.post(`/leads/${id}/delete-request`, {
        reason: deleteReason
      });
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setDeleteReason('');
        alert('Delete request raised for Admin approval.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting deletion request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="glass-panel p-6 border border-rose-500/20 text-rose-500 max-w-xl mx-auto mt-10">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Access Restricted
        </h3>
        <p className="text-sm font-medium">{error || 'Unable to load profile data'}</p>
        <button onClick={() => navigate('/leads')} className="btn-secondary mt-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/leads')} className="btn-secondary py-2 flex items-center gap-2 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <div className="flex items-center gap-3">
          {/* Booking request triggers */}
          {hasPermission('raise_booking') && !['booked', 'lost', 'fake'].includes(lead.status) && (
            <button
              onClick={() => {
                setBookingForm({
                  ...bookingForm,
                  pax_count: lead.pax_count,
                  travel_date: lead.travel_date || ''
                });
                setIsBookingModalOpen(true);
              }}
              className="btn-primary py-2 flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 border-none shadow-emerald-500/10"
            >
              <CheckCircle className="w-4 h-4" /> Raise Booking
            </button>
          )}

          {/* Delete triggers */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="btn-secondary py-2 flex items-center gap-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-500/20"
          >
            <ShieldAlert className="w-4 h-4" /> Request Delete
          </button>
        </div>
      </div>

      {/* Main Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile overview & edits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-bold text-lg">
                  {lead.customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold dark:text-white">{lead.customer.name}</h2>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    Lead Status: <span className="text-brand-600 dark:text-brand-400 font-extrabold capitalize">{lead.status}</span>
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary py-2 flex items-center gap-1 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Mobile (Lock)</label>
                    <input
                      type="text"
                      required
                      value={editForm.primary_mobile}
                      onChange={(e) => setEditForm({ ...editForm, primary_mobile: e.target.value })}
                      className="w-full glass-input bg-slate-100/50 dark:bg-surface-900/10 text-slate-500"
                      disabled={!hasPermission('edit_customer_number')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Alternate Mobile</label>
                    <input
                      type="text"
                      value={editForm.alternate_mobile}
                      onChange={(e) => setEditForm({ ...editForm, alternate_mobile: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Destination</label>
                    <input
                      type="text"
                      required
                      value={editForm.destination}
                      onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pax Count</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.pax_count}
                      onChange={(e) => setEditForm({ ...editForm, pax_count: parseInt(e.target.value) || 1 })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Travel Date</label>
                    <input
                      type="date"
                      value={editForm.travel_date}
                      onChange={(e) => setEditForm({ ...editForm, travel_date: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Group Type</label>
                    <select
                      value={editForm.group_type}
                      onChange={(e) => setEditForm({ ...editForm, group_type: e.target.value })}
                      className="w-full glass-input text-xs"
                    >
                      <option value="">Choose...</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                      <option value="friends">Friends</option>
                      <option value="solo">Solo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Budget Per Person</label>
                    <input
                      type="number"
                      value={editForm.budget_per_person}
                      onChange={(e) => setEditForm({ ...editForm, budget_per_person: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Hotel Category</label>
                    <input
                      type="text"
                      value={editForm.hotel_category}
                      onChange={(e) => setEditForm({ ...editForm, hotel_category: e.target.value })}
                      className="w-full glass-input"
                      placeholder="e.g. 3 Star"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Meal Plan</label>
                    <input
                      type="text"
                      value={editForm.meal_plan}
                      onChange={(e) => setEditForm({ ...editForm, meal_plan: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Best Call Time</label>
                    <input
                      type="text"
                      value={editForm.best_time_to_call}
                      onChange={(e) => setEditForm({ ...editForm, best_time_to_call: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes / Special Requirements</label>
                  <textarea
                    value={editForm.special_requirements}
                    onChange={(e) => setEditForm({ ...editForm, special_requirements: e.target.value })}
                    className="w-full glass-input h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 text-xs font-medium">
                <div>
                  <span className="text-slate-400 block mb-0.5">Primary Mobile</span>
                  <span className="dark:text-white font-semibold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.customer.primary_mobile}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Alternate Mobile</span>
                  <span className="dark:text-white">{lead.customer.alternate_mobile || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">City</span>
                  <span className="dark:text-white capitalize">{lead.customer.city || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Destination</span>
                  <span className="dark:text-white font-semibold flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> {lead.destination}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Pax count</span>
                  <span className="dark:text-white">{lead.pax_count} Travel travelers</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Group type</span>
                  <span className="dark:text-white capitalize">{lead.group_type || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Travel Date</span>
                  <span className="dark:text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {lead.travel_date || 'Tentative'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Hotel Category</span>
                  <span className="dark:text-white">{lead.hotel_category || 'Any'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Meal Plan</span>
                  <span className="dark:text-white">{lead.meal_plan || 'Any'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                  <span className="text-slate-400 block mb-1">Notes / Requirements</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold bg-slate-50 dark:bg-surface-900/30 p-3 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
                    {lead.special_requirements || 'No special requirements listed.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up Timeline */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-4">
              <h3 className="text-base font-bold dark:text-white">Follow-up timeline logs</h3>
              <button
                onClick={() => setIsFollowupModalOpen(true)}
                className="btn-secondary py-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-violet-400"
              >
                <Plus className="w-3.5 h-3.5" /> Log Call
              </button>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {followups.length > 0 ? (
                followups.map((f, idx) => (
                  <div key={f.id} className="flex gap-4 relative pl-8">
                    {/* Circle bullet */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs absolute left-0 top-0.5 dark:text-white">
                      {f.followup_count}
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-surface-900/30 border border-slate-200/30 dark:border-slate-800/30">
                      <div className="flex items-center justify-between text-xs font-medium mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 capitalize">
                          Via {f.contact_method} • by {f.creator?.name || 'Agent'}
                        </span>
                        <span className="text-slate-500 font-semibold">{f.followup_date}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{f.notes}</p>
                      <span className="text-[10px] text-slate-400 block mt-2 font-bold">
                        Next callback: {f.next_followup_date}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center font-medium">
                  No contact callback logged for this lead.
                </p>
              )}
            </div>
          </div>

          {/* Quotations list */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-4">
              <h3 className="text-base font-bold dark:text-white">Quotations list</h3>
              <button
                onClick={() => {
                  setQuoteForm({
                    ...quoteForm,
                    destination: lead.destination
                  });
                  setIsQuoteModalOpen(true);
                }}
                className="btn-secondary py-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-violet-400"
              >
                <Plus className="w-3.5 h-3.5" /> Draft Quotation
              </button>
            </div>

            <div className="space-y-3">
              {quotes.length > 0 ? (
                quotes.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-surface-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold dark:text-slate-300">Quote to {q.destination}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-bold capitalize">{q.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Duration: {q.duration || 'Flexible'} • Hotel: {q.hotel_category || 'Any'}</p>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Selling Price</span>
                        <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">₹{parseFloat(q.selling_price).toLocaleString()}</span>
                      </div>

                      {q.status === 'draft' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiClient.patch(`/quotes/${q.id}/status`, { status: 'sent' });
                              if (res.data.success) fetchLists();
                            } catch (e) {
                              alert('Error updating status');
                            }
                          }}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          Mark Sent
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center font-medium">
                  No quotations created yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Status updates & info metadata */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold mb-4 dark:text-white">Pipeline stage</h3>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Stage Dropdown</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full glass-input text-xs font-semibold py-3"
              >
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

            {lead.status === 'lost' && (
              <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <span className="text-[10px] uppercase font-bold block mb-1">Reason for loss</span>
                <p className="text-xs font-semibold leading-relaxed">
                  Reason: {lead.lost_reason} <br />
                  Note: {lead.lost_note || 'No notes added'}
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold dark:text-white">Record Metadata</h3>
            
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Owner assigned</span>
                <span className="dark:text-slate-200">{lead.assignedUser ? lead.assignedUser.name : 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Enquiries</span>
                <span className="dark:text-slate-200">{lead.customer.total_enquiries} calls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer ID</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{lead.customer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lead Created</span>
                <span className="dark:text-slate-200">{new Date(lead.lead_date).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal - Log Call */}
      <Modal isOpen={isFollowupModalOpen} onClose={() => setIsFollowupModalOpen(false)} title="Log Follow-up Contact">
        <form onSubmit={handleFollowupSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contact Channel</label>
            <select
              value={followupForm.contact_method}
              onChange={(e) => setFollowupForm({ ...followupForm, contact_method: e.target.value })}
              className="w-full glass-input"
            >
              <option value="call">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Call Date</label>
              <input
                type="date"
                required
                value={followupForm.followup_date}
                onChange={(e) => setFollowupForm({ ...followupForm, followup_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Next Callback</label>
              <input
                type="date"
                required
                value={followupForm.next_followup_date}
                onChange={(e) => setFollowupForm({ ...followupForm, next_followup_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Call Notes / Summary</label>
            <textarea
              required
              value={followupForm.notes}
              onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
              className="w-full glass-input h-24 resize-none"
              placeholder="What did the client say? Budget, details, dates discussed..."
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Log Callback Entry
          </button>
        </form>
      </Modal>

      {/* Modal - Draft Quotation */}
      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Draft Tour Quotation">
        <form onSubmit={handleQuoteSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Destination</label>
              <input
                type="text"
                required
                value={quoteForm.destination}
                onChange={(e) => setQuoteForm({ ...quoteForm, destination: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
              <input
                type="text"
                value={quoteForm.duration}
                onChange={(e) => setQuoteForm({ ...quoteForm, duration: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. 5 Nights / 6 Days"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pickup City</label>
              <input
                type="text"
                value={quoteForm.pickup_city}
                onChange={(e) => setQuoteForm({ ...quoteForm, pickup_city: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Hotel Category</label>
              <input
                type="text"
                value={quoteForm.hotel_category}
                onChange={(e) => setQuoteForm({ ...quoteForm, hotel_category: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Meal Plan</label>
              <input
                type="text"
                value={quoteForm.meal_plan}
                onChange={(e) => setQuoteForm({ ...quoteForm, meal_plan: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Selling Price (To Client)</label>
              <input
                type="number"
                required
                value={quoteForm.selling_price}
                onChange={(e) => setQuoteForm({ ...quoteForm, selling_price: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Min Advance Required</label>
              <input
                type="number"
                required
                value={quoteForm.advance_amount}
                onChange={(e) => setQuoteForm({ ...quoteForm, advance_amount: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Inclusions</label>
              <textarea
                value={quoteForm.inclusions}
                onChange={(e) => setQuoteForm({ ...quoteForm, inclusions: e.target.value })}
                className="w-full glass-input h-16 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Exclusions</label>
              <textarea
                value={quoteForm.exclusions}
                onChange={(e) => setQuoteForm({ ...quoteForm, exclusions: e.target.value })}
                className="w-full glass-input h-16 resize-none"
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Save Draft Quote
          </button>
        </form>
      </Modal>

      {/* Modal - Raise Booking Request */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Raise Tour Booking Request">
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Travel Date</label>
              <input
                type="date"
                required
                value={bookingForm.travel_date}
                onChange={(e) => setBookingForm({ ...bookingForm, travel_date: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pax Count</label>
              <input
                type="number"
                required
                value={bookingForm.pax_count}
                onChange={(e) => setBookingForm({ ...bookingForm, pax_count: parseInt(e.target.value) || 1 })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Package Price (₹)</label>
              <input
                type="number"
                required
                value={bookingForm.package_amount}
                onChange={(e) => setBookingForm({ ...bookingForm, package_amount: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Advance Deposited (₹)</label>
              <input
                type="number"
                required
                value={bookingForm.advance_amount}
                onChange={(e) => setBookingForm({ ...bookingForm, advance_amount: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pickup Details / Start location</label>
              <input
                type="text"
                value={bookingForm.pickup_location}
                onChange={(e) => setBookingForm({ ...bookingForm, pickup_location: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. Airport T3"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</label>
              <input
                type="text"
                value={bookingForm.emergency_contact}
                onChange={(e) => setBookingForm({ ...bookingForm, emergency_contact: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Special instructions</label>
            <textarea
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="w-full glass-input h-20 resize-none"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Submit Booking Request
          </button>
        </form>
      </Modal>

      {/* Modal - Lost reason */}
      <Modal isOpen={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Mark Lead as Lost">
        <form onSubmit={handleLostSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Reason for loss</label>
            <select
              required
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full glass-input text-xs font-semibold py-3"
            >
              <option value="">-- Select Reason --</option>
              <option value="budget_issues">Price too high / Budget issues</option>
              <option value="competitor_chosen">Went with another operator</option>
              <option value="trip_cancelled">Trip plans cancelled by client</option>
              <option value="poor_follow_up">Delayed communication</option>
              <option value="unresponsive">Unresponsive / Not reachable</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Loss notes / context</label>
            <textarea
              value={lostNote}
              onChange={(e) => setLostNote(e.target.value)}
              className="w-full glass-input h-24 resize-none"
              placeholder="Provide detail on why the client cancelled or declined the offer..."
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2 bg-rose-600 hover:bg-rose-500 shadow-rose-500/10">
            Confirm Lead Lost
          </button>
        </form>
      </Modal>

      {/* Modal - Request Delete */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Request Lead Deletion">
        <form onSubmit={handleDeleteRequest} className="space-y-4">
          <div className="flex gap-3 bg-rose-500/10 border border-rose-500/10 p-3.5 rounded-xl text-rose-600 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>This action submits a soft-delete request to the Administrator. The record will not be removed until approved.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Reason for deletion request</label>
            <textarea
              required
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full glass-input h-24 resize-none"
              placeholder="e.g. Duplicate customer record, incorrect details entry..."
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2 bg-rose-600 hover:bg-rose-500 shadow-rose-500/10 border-none">
            Submit Deletion Request
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default LeadDetails;
