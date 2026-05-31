import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle, XCircle, Clock, Trash } from 'lucide-react';

const DeleteRequests = () => {
  const { user } = useAuth();

  // State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/delete-requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch delete requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this deletion? The target lead/record will be soft-deleted.')) return;
    
    try {
      const res = await apiClient.patch(`/delete-requests/${id}/approve`);
      if (res.data.success) {
        fetchRequests();
        alert('Request approved. Target record soft-deleted.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await apiClient.patch(`/delete-requests/${id}/reject`);
      if (res.data.success) {
        fetchRequests();
        alert('Deletion request rejected.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold dark:text-white">Delete Approvals</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Moderate deletion tickets raised by staff members (Audited soft-deletes only)</p>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {requests.length > 0 ? (
          requests.map((r) => (
            <div key={r.id} className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-rose-500">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Request ID: {r.id.slice(0, 8)}</span>
                  <span className="text-xs font-bold bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/20 dark:border-slate-800/20 capitalize">
                    Target: {r.entity_type} ({r.entity_id.slice(0, 8)})
                  </span>
                </div>

                <p className="text-sm font-semibold dark:text-white leading-relaxed">
                  Reason: <span className="font-medium text-slate-600 dark:text-slate-300">"{r.reason}"</span>
                </p>

                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2">
                  <span>Requested by: {r.requester?.name || 'Agent'} ({r.requester?.role})</span>
                  <span>•</span>
                  <span>Date: {new Date(r.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleReject(r.id)}
                  className="btn-secondary text-slate-700 dark:text-slate-200 font-bold text-xs py-2 px-4"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(r.id)}
                  className="btn-primary font-bold text-xs py-2 px-4 bg-rose-600 hover:bg-rose-500 shadow-rose-500/10 border-none flex items-center gap-1.5"
                >
                  <Trash className="w-3.5 h-3.5" /> Approve Soft Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel py-16 text-center text-slate-400 font-medium">
            No pending deletion tickets found.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteRequests;
export { DeleteRequests };
