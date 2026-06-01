import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Compass, CheckCircle, Clock, Edit3, ShieldAlert, Phone } from 'lucide-react';

const Operations = () => {
  const { user } = useAuth();

  // State
  const [opsFiles, setOpsFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOps, setSelectedOps] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'ongoing', 'completed'

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    hotel_name: '',
    hotel_contact: '',
    pickup_location: '',
    pickup_time: '',
    coordinator_name: '',
    coordinator_contact: '',
    vendor_confirmation_url: '',
    voucher_sent: false,
    itinerary_sent: false,
    customer_confirmation_sent: false,
    operations_notes: '',
    trip_status: 'upcoming'
  });

  const fetchOpsFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/operations/bookings');
      if (res.data.success) {
        setOpsFiles(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch operations dispatcher files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsFiles();
  }, []);

  const openDetails = async (opsId) => {
    try {
      const res = await apiClient.get(`/operations/bookings/${opsId}`);
      if (res.data.success) {
        const file = res.data.data;
        setSelectedOps(file);
        setEditForm({
          hotel_name: file.hotel_name || '',
          hotel_contact: file.hotel_contact || '',
          pickup_location: file.pickup_location || '',
          pickup_time: file.pickup_time || '',
          coordinator_name: file.coordinator_name || '',
          coordinator_contact: file.coordinator_contact || '',
          vendor_confirmation_url: file.vendor_confirmation_url || '',
          voucher_sent: file.voucher_sent || false,
          itinerary_sent: file.itinerary_sent || false,
          customer_confirmation_sent: file.customer_confirmation_sent || false,
          operations_notes: file.operations_notes || '',
          trip_status: file.trip_status
        });
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching details');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Update text attributes
      const updateRes = await apiClient.put(`/operations/bookings/${selectedOps.id}`, editForm);
      
      // 2. Update trip status
      const statusRes = await apiClient.patch(`/operations/bookings/${selectedOps.id}/trip-status`, {
        trip_status: editForm.trip_status
      });

      if (updateRes.data.success && statusRes.data.success) {
        setIsEditModalOpen(false);
        setIsDetailModalOpen(false);
        fetchOpsFiles();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating operations dispatch file');
    }
  };

  const getTripStatusClass = (status) => {
    const classes = {
      upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50',
      ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50',
      cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50'
    };
    return `text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${classes[status] || 'bg-slate-100 text-slate-700'}`;
  };

  const filteredOps = opsFiles.filter(f => {
    return f.trip_status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Logistics Dispatcher</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Coordinate hotel checkins, cab timings, coordinator numbers, and itinerary toggles</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'upcoming' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Upcoming Trips
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'ongoing' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Ongoing Trips
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === 'completed' ? 'border-brand-500 text-brand-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Completed Trips
        </button>
      </div>

      {/* Grid of operational trips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOps.length > 0 ? (
          filteredOps.map((f) => (
            <div 
              key={f.id} 
              className="glass-card p-6 flex flex-col justify-between gap-4 cursor-pointer"
              onClick={() => openDetails(f.id)}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold dark:text-white">{f.booking.destination}</h3>
                    <span className="text-[10px] text-slate-400">{f.booking.pax_count} travelers • {f.booking.travel_date}</span>
                  </div>
                  <span className={getTripStatusClass(f.trip_status)}>{f.trip_status}</span>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                  <p>Client: <span className="dark:text-white">{f.booking.customer.name}</span></p>
                  <p>Hotel: {f.hotel_name || 'Not finalized'}</p>
                  <p>Cab Driver / Coordinator: {f.coordinator_name || 'TBD'}</p>
                </div>
              </div>

              <div className="flex gap-2 items-center justify-between text-[10px] font-bold text-slate-400 uppercase pt-2">
                <span className={f.voucher_sent ? 'text-emerald-500' : 'text-slate-400'}>• Voucher</span>
                <span className={f.itinerary_sent ? 'text-emerald-500' : 'text-slate-400'}>• Itinerary</span>
                <span className={f.customer_confirmation_sent ? 'text-emerald-500' : 'text-slate-400'}>• Confirmed</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">
            No active approved bookings under the "{activeTab}" coordination status.
          </div>
        )}
      </div>

      {/* Modal - Details */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Logistics Operations File">
        {selectedOps && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <div>
                <h3 className="text-sm font-bold dark:text-white">{selectedOps.booking.destination} trip</h3>
                <span className="text-[10px] text-slate-400">Date: {selectedOps.booking.travel_date} • Client: {selectedOps.booking.customer.name}</span>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(true);
                }}
                className="btn-secondary py-1 px-3 text-xs font-bold text-brand-600 dark:text-violet-400 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Logistics
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Hotel Name</span>
                <span className="dark:text-white">{selectedOps.hotel_name || 'TBD'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Hotel Contact</span>
                <span className="dark:text-white">{selectedOps.hotel_contact || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pickup Details</span>
                <span className="dark:text-white">{selectedOps.pickup_location || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pickup Time</span>
                <span className="dark:text-white">{selectedOps.pickup_time || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Coordinator Name</span>
                <span className="dark:text-white">{selectedOps.coordinator_name || 'TBD'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Coordinator Contact</span>
                <span className="dark:text-white">{selectedOps.coordinator_contact || 'None'}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-900/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2.5 text-xs font-semibold">
              <h4 className="font-bold border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 dark:text-white">Document checklist Status</h4>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Voucher Sent to Client</span>
                <span className={selectedOps.voucher_sent ? 'text-emerald-500 font-extrabold' : 'text-slate-400 font-semibold'}>{selectedOps.voucher_sent ? 'Yes' : 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Itinerary Sent to Driver</span>
                <span className={selectedOps.itinerary_sent ? 'text-emerald-500 font-extrabold' : 'text-slate-400 font-semibold'}>{selectedOps.itinerary_sent ? 'Yes' : 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer Confirmation received</span>
                <span className={selectedOps.customer_confirmation_sent ? 'text-emerald-500 font-extrabold' : 'text-slate-400 font-semibold'}>{selectedOps.customer_confirmation_sent ? 'Yes' : 'Pending'}</span>
              </div>
            </div>

            {selectedOps.operations_notes && (
              <div className="p-3.5 bg-slate-100 dark:bg-surface-900/30 border border-slate-200/30 dark:border-slate-800/30 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coordinator notes</span>
                <p>{selectedOps.operations_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - Edit Operations */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Logistics details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Hotel Accomodation</label>
              <input
                type="text"
                value={editForm.hotel_name}
                onChange={(e) => setEditForm({ ...editForm, hotel_name: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Hotel Contact</label>
              <input
                type="text"
                value={editForm.hotel_contact}
                onChange={(e) => setEditForm({ ...editForm, hotel_contact: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pickup Location</label>
              <input
                type="text"
                value={editForm.pickup_location}
                onChange={(e) => setEditForm({ ...editForm, pickup_location: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pickup Time</label>
              <input
                type="text"
                value={editForm.pickup_time}
                onChange={(e) => setEditForm({ ...editForm, pickup_time: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. 09:00 AM"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Coordinator Name</label>
              <input
                type="text"
                value={editForm.coordinator_name}
                onChange={(e) => setEditForm({ ...editForm, coordinator_name: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Coordinator Contact</label>
              <input
                type="text"
                value={editForm.coordinator_contact}
                onChange={(e) => setEditForm({ ...editForm, coordinator_contact: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.voucher_sent}
                onChange={(e) => setEditForm({ ...editForm, voucher_sent: e.target.checked })}
                className="rounded"
              />
              <span>Voucher Sent</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.itinerary_sent}
                onChange={(e) => setEditForm({ ...editForm, itinerary_sent: e.target.checked })}
                className="rounded"
              />
              <span>Itinerary Sent</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.customer_confirmation_sent}
                onChange={(e) => setEditForm({ ...editForm, customer_confirmation_sent: e.target.checked })}
                className="rounded"
              />
              <span>Confirmed</span>
            </label>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Trip Status</label>
            <select
              value={editForm.trip_status}
              onChange={(e) => setEditForm({ ...editForm, trip_status: e.target.value })}
              className="w-full glass-input text-xs font-semibold py-3"
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed (Triggers Commission)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Coordinator log notes</label>
            <textarea
              value={editForm.operations_notes}
              onChange={(e) => setEditForm({ ...editForm, operations_notes: e.target.value })}
              className="w-full glass-input h-20 resize-none"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Save Logistics details
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Operations;
