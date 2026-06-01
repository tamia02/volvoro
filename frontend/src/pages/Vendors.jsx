import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Truck, Edit3, Trash2, Globe, DollarSign, Phone, MapPin, Mail } from 'lucide-react';

const Vendors = () => {
  const { user, hasPermission } = useAuth();

  // State
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form State for Vendor Profile
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email: '',
    address: '',
    service_type: 'hotel',
    cost_per_person: '',
    total_cost: '',
    payment_terms: '',
    notes: '',
    destinations: '[]'
  });

  // Form State for Destination Rate Card
  const [rateDestName, setRateDestName] = useState('');
  const [rateDoubleTriple, setRateDoubleTriple] = useState('');
  const [rateQuad, setRateQuad] = useState('');

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/vendors');
      if (res.data.success) {
        setVendors(res.data.data);
        // Refresh selected vendor detail if open
        if (selectedVendor) {
          const updated = res.data.data.find(v => v.id === selectedVendor.id);
          if (updated) setSelectedVendor(updated);
        }
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
      const payload = {
        ...formData,
        cost_per_person: formData.cost_per_person ? parseFloat(formData.cost_per_person) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null
      };

      if (editingVendor) {
        res = await apiClient.put(`/vendors/${editingVendor.id}`, payload);
      } else {
        res = await apiClient.post('/vendors', payload);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setEditingVendor(null);
        resetForm();
        fetchVendors();
        alert('Vendor profile saved successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving vendor profile');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      mobile_number: '',
      whatsapp_number: '',
      email: '',
      address: '',
      service_type: 'hotel',
      cost_per_person: '',
      total_cost: '',
      payment_terms: '',
      notes: '',
      destinations: '[]'
    });
  };

  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete ${vendor.company_name || vendor.name}?`)) return;

    try {
      const res = await apiClient.delete(`/vendors/${vendor.id}`);
      if (res.data.success) {
        setIsDetailModalOpen(false);
        setSelectedVendor(null);
        fetchVendors();
        alert('Vendor profile deactivated successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting vendor profile');
    }
  };

  const startEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      company_name: vendor.company_name || '',
      mobile_number: vendor.mobile_number || '',
      whatsapp_number: vendor.whatsapp_number || '',
      email: vendor.email || '',
      address: vendor.address || '',
      service_type: vendor.service_type,
      cost_per_person: vendor.cost_per_person || '',
      total_cost: vendor.total_cost || '',
      payment_terms: vendor.payment_terms || '',
      notes: vendor.notes || '',
      destinations: vendor.destinations || '[]'
    });
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  // Add rate card for destination
  const handleAddRateCard = async (e) => {
    e.preventDefault();
    if (!rateDestName || !selectedVendor) return;

    try {
      const res = await apiClient.post(`/vendors/${selectedVendor.id}/destinations`, {
        destination_name: rateDestName,
        double_triple_sharing_rate: parseFloat(rateDoubleTriple || 0),
        quad_sharing_rate: parseFloat(rateQuad || 0)
      });

      if (res.data.success) {
        setRateDestName('');
        setRateDoubleTriple('');
        setRateQuad('');
        fetchVendors();
        alert('Destination rate saved');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add destination rate');
    }
  };

  // Delete rate card for destination
  const handleDeleteRateCard = async (rateId) => {
    if (!window.confirm('Delete this destination rate sharing row?')) return;

    try {
      const res = await apiClient.delete(`/vendors/${selectedVendor.id}/destinations/${rateId}`);
      if (res.data.success) {
        fetchVendors();
        alert('Destination rate deleted');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete destination rate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Vendor Directory</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage partner operators, contact profiles, and destination rate sharing matrices</p>
        </div>

        {hasPermission('manage_vendors') && (
          <button
            onClick={() => {
              setEditingVendor(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        )}
      </div>

      {/* Directory grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length > 0 ? (
          vendors.map((v) => (
            <div
              key={v.id}
              onClick={() => {
                setSelectedVendor(v);
                setIsDetailModalOpen(true);
              }}
              className="glass-card p-6 flex flex-col justify-between gap-4 cursor-pointer hover:border-brand-500/50 transition-all relative overflow-hidden"
            >
              {/* Status Indicator */}
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${v.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'} shadow-lg`} />
                <span className="text-[10px] font-extrabold uppercase text-slate-400">{v.status}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-500/10 p-2.5 rounded-xl text-brand-600 dark:text-violet-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white leading-tight">{v.company_name || v.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {v.service_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                  <p>Partner Representative: <span className="dark:text-slate-200">{v.name}</span></p>
                  <p>Mobile/Contact: <span className="dark:text-slate-200">{v.mobile_number || v.contact || 'No contact'}</span></p>
                  {v.whatsapp_number && <p>WhatsApp: <span className="text-emerald-500">{v.whatsapp_number}</span></p>}
                </div>
              </div>

              <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                View Profile & B2B Rate Card &rarr;
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">
            No active vendors registered.
          </div>
        )}
      </div>

      {/* Modal - Vendor Detail & Rate Matrix */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Vendor Profile & Rate Card">
        {selectedVendor && (
          <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
            {/* Contact Details summary */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-surface-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-violet-400 font-extrabold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold dark:text-white leading-tight">{selectedVendor.company_name || selectedVendor.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedVendor.service_type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-2 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400 shrink-0" /> Rep: <span className="dark:text-slate-200">{selectedVendor.name}</span></div>
                <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400 shrink-0" /> Mobile: <span className="dark:text-slate-200">{selectedVendor.mobile_number || selectedVendor.contact || 'N/A'}</span></div>
                {selectedVendor.whatsapp_number && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp: <span className="dark:text-slate-200">{selectedVendor.whatsapp_number}</span></div>}
                {selectedVendor.email && <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> Email: <span className="dark:text-slate-200">{selectedVendor.email}</span></div>}
                {selectedVendor.address && <div className="col-span-2 flex items-start gap-1.5"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> Address: <span className="dark:text-slate-200">{selectedVendor.address}</span></div>}
              </div>
            </div>

            {/* Destinations rates log */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-500" /> B2B Sharing Rate Matrix
              </h4>

              <div className="glass-panel overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-surface-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">
                      <th className="py-2.5 px-4">Destination</th>
                      <th className="py-2.5 px-4">Double/Triple sharing rate</th>
                      <th className="py-2.5 px-4">Quad sharing rate</th>
                      {hasPermission('manage_vendors') && <th className="py-2.5 px-4 text-right">Delete</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/20">
                    {selectedVendor.destinationsList && selectedVendor.destinationsList.length > 0 ? (
                      selectedVendor.destinationsList.map((rate) => (
                        <tr key={rate.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-800/10">
                          <td className="py-2.5 px-4 dark:text-white font-bold">{rate.destination_name}</td>
                          <td className="py-2.5 px-4 dark:text-slate-200">₹{parseFloat(rate.double_triple_sharing_rate).toLocaleString()}</td>
                          <td className="py-2.5 px-4 dark:text-slate-200">₹{parseFloat(rate.quad_sharing_rate).toLocaleString()}</td>
                          {hasPermission('manage_vendors') && (
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRateCard(rate.id)}
                                className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4 ml-auto" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 dark:text-slate-500 font-medium">No custom destination B2B rates listed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add custom destination rate card */}
            {hasPermission('manage_vendors') && (
              <form onSubmit={handleAddRateCard} className="space-y-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add / Update Destination B2B Rate Card</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Destination (e.g. Kashmir)"
                      value={rateDestName}
                      onChange={(e) => setRateDestName(e.target.value)}
                      className="w-full glass-input py-2 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Double/Triple (₹)"
                      value={rateDoubleTriple}
                      onChange={(e) => setRateDoubleTriple(e.target.value)}
                      className="w-full glass-input py-2 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Quad Sharing (₹)"
                      value={rateQuad}
                      onChange={(e) => setRateQuad(e.target.value)}
                      className="w-full glass-input py-2 text-xs"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 btn-primary font-bold text-xs flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Save Destination Rate
                </button>
              </form>
            )}

            {/* Admin moderations actions */}
            {hasPermission('manage_vendors') && (
              <div className="flex gap-3 justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                {selectedVendor.status === 'active' && (
                  <button
                    onClick={() => handleDeleteVendor(selectedVendor)}
                    className="px-4 py-2.5 rounded-xl border border-rose-200/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Deactivate Vendor
                  </button>
                )}
                <button
                  onClick={() => startEdit(selectedVendor)}
                  className="btn-primary font-bold text-xs px-6"
                >
                  Edit Profile Details
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - Create/Edit Vendor Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVendor ? 'Edit Vendor Details' : 'Register Partner Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Company / Trade Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full glass-input"
                placeholder="e.g. Royal Srinagar Hotels"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Service category</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="hotel">Hotel Accommodation</option>
                <option value="transport">Cab / Transport</option>
                <option value="full_package">Full Package Tour</option>
                <option value="activity">Day Tour / Activity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Representative Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input"
                placeholder="Individual contact name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Mobile Contact</label>
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value, contact: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Contact</label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full glass-input"
              placeholder="e.g. 45 Main Street, Srinagar"
            />
          </div>

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
