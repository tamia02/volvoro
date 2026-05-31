import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Truck, Edit3, CheckCircle, AlertTriangle } from 'lucide-react';

const Vendors = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    destination: '',
    service_type: 'hotel',
    cost_per_person: '',
    total_cost: '',
    payment_terms: '',
    notes: ''
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/vendors');
      if (res.data.success) {
        setVendors(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch vendors directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingVendor) {
        res = await apiClient.put(`/vendors/${editingVendor.id}`, formData);
      } else {
        res = await apiClient.post('/vendors', formData);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setEditingVendor(null);
        setFormData({
          name: '',
          contact: '',
          destination: '',
          service_type: 'hotel',
          cost_per_person: '',
          total_cost: '',
          payment_terms: '',
          notes: ''
        });
        fetchVendors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving vendor profile');
    }
  };

  const startEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact: vendor.contact || '',
      destination: vendor.destination || '',
      service_type: vendor.service_type,
      cost_per_person: vendor.cost_per_person || '',
      total_cost: vendor.total_cost || '',
      payment_terms: vendor.payment_terms || '',
      notes: vendor.notes || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Vendor Directory</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage tour operators, hotels, transport providers, and service costs</p>
        </div>

        {hasPermission('manage_vendors') && (
          <button
            onClick={() => {
              setEditingVendor(null);
              setFormData({
                name: '',
                contact: '',
                destination: '',
                service_type: 'hotel',
                cost_per_person: '',
                total_cost: '',
                payment_terms: '',
                notes: ''
              });
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        )}
      </div>

      {/* Directory grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length > 0 ? (
          vendors.map((v) => (
            <div key={v.id} className="glass-card p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-500/10 p-2.5 rounded-xl text-brand-600 dark:text-violet-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{v.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{v.service_type.replace('_', ' ')} • {v.destination || 'Multi-dest'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <p>Contact: {v.contact || 'No contact'}</p>
                  {user.role === 'admin' && (
                    <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2 mt-2 space-y-1">
                      <p className="dark:text-slate-300">Rate per head: <span className="font-extrabold dark:text-white">₹{parseFloat(v.cost_per_person || 0).toLocaleString()}</span></p>
                      <p className="dark:text-slate-300">Total Booking package cost: <span className="font-extrabold dark:text-white">₹{parseFloat(v.total_cost || 0).toLocaleString()}</span></p>
                    </div>
                  )}
                </div>
              </div>

              {hasPermission('manage_vendors') && (
                <button
                  onClick={() => startEdit(v)}
                  className="btn-secondary w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">
            No active vendors registered.
          </div>
        )}
      </div>

      {/* Modal - Create/Edit Vendor */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVendor ? 'Edit Vendor Profile' : 'Add Partner Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Vendor Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Service category</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="hotel">Hotel Accomodation</option>
                <option value="transport">Cab / Transport</option>
                <option value="full_package">Full Package Tour</option>
                <option value="activity">Day Tour / Activity</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Destination region</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. Bali"
              />
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Cost Per Person (₹)</label>
                <input
                  type="number"
                  value={formData.cost_per_person}
                  onChange={(e) => setFormData({ ...formData, cost_per_person: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Package Cost (₹)</label>
                <input
                  type="number"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment terms</label>
            <input
              type="text"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className="w-full glass-input"
              placeholder="e.g. 50% advance, balance on checkout"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Internal notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input h-20 resize-none"
            />
          </div>

          <button type="submit" className="w-full btn-primary font-bold py-3 mt-2">
            Save Vendor Profile
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Vendors;
