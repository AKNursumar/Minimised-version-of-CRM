import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import followupService from '../services/followupService';
import opportunityService from '../services/opportunityService';
import { getErrorMessage } from '../services/api';

export const FollowUps = () => {
  const [followups, setFollowups] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentFollowup, setCurrentFollowup] = useState(null);

  // Form State
  const initialFormState = {
    opportunity: '',
    followup_date: '',
    reminder_time: '10:00:00',
    status: 'PENDING',
    remarks: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchFollowups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await followupService.getAll();
      setFollowups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch follow-ups.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const data = await opportunityService.getAll();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchFollowups();
    fetchOpportunities();
  }, []);

  const filteredFollowups = followups.filter((f) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = f.remarks?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setCurrentFollowup(null);
    setFormData({
      ...initialFormState,
      opportunity: opportunities[0]?.id || '',
      followup_date: new Date().toISOString().split('T')[0],
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (f) => {
    setCurrentFollowup(f);
    setFormData({
      opportunity: f.opportunity || '',
      followup_date: f.followup_date || '',
      reminder_time: f.reminder_time || '10:00:00',
      status: f.status || 'PENDING',
      remarks: f.remarks || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (f) => {
    setCurrentFollowup(f);
    setIsDeleteOpen(true);
  };

  const handleQuickStatus = async (f, newStatus) => {
    try {
      const updated = await followupService.patch(f.id, { status: newStatus });
      setFollowups((prev) => prev.map((item) => (item.id === f.id ? updated : item)));
      setToast({ type: 'success', message: `Marked as ${newStatus.toLowerCase()}.` });
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to update status.') });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.opportunity) {
      setToast({ type: 'error', message: 'Please select an opportunity.' });
      return;
    }
    if (!formData.followup_date) {
      setToast({ type: 'error', message: 'Follow-up date is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        opportunity: Number(formData.opportunity),
        followup_date: formData.followup_date,
        reminder_time: formData.reminder_time || null,
        status: formData.status,
        remarks: formData.remarks,
      };

      if (currentFollowup) {
        const updated = await followupService.update(currentFollowup.id, payload);
        setFollowups((prev) => prev.map((item) => (item.id === currentFollowup.id ? updated : item)));
        setToast({ type: 'success', message: 'Follow-up updated successfully.' });
      } else {
        const created = await followupService.create(payload);
        setFollowups((prev) => [created, ...prev]);
        setToast({ type: 'success', message: 'Follow-up scheduled successfully.' });
      }
      setIsAddEditOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to save follow-up.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentFollowup) return;
    setSubmitting(true);
    try {
      await followupService.delete(currentFollowup.id);
      setFollowups((prev) => prev.filter((item) => item.id !== currentFollowup.id));
      setToast({ type: 'success', message: 'Follow-up deleted.' });
      setIsDeleteOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to delete follow-up.') });
    } finally {
      setSubmitting(false);
    }
  };

  const getOppTitle = (oppId) => {
    const found = opportunities.find((o) => o.id === oppId);
    return found ? found.title : `Deal #${oppId}`;
  };

  return (
    <MainLayout title="Client Follow-ups">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Follow-ups</h2>
          <p className="text-xs text-gray-500 mt-1">
            Schedule and manage reminder calls, meetings, and client follow-ups
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchFollowups}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule Follow-up
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remarks..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Follow-ups</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="medium" text="Loading follow-ups..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchFollowups}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredFollowups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No follow-ups found</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              Schedule your next meeting or phone call to keep deals moving forward.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule Follow-up
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Associated Opportunity</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Remarks / Agenda</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFollowups.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div className="flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                        {getOppTitle(f.opportunity)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-700">
                      <div className="font-medium text-gray-900">{f.followup_date}</div>
                      {f.reminder_time && (
                        <div className="text-gray-400 mt-0.5">{f.reminder_time}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          f.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : f.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 max-w-sm">
                      {f.remarks || <span className="text-gray-400">No remarks</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {f.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(f, 'COMPLETED')}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                            title="Mark as Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(f)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(f)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={currentFollowup ? 'Edit Follow-up' : 'Schedule Follow-up'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Opportunity *
            </label>
            <select
              required
              value={formData.opportunity}
              onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Opportunity Deal...</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.stage})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Follow-up Date *
              </label>
              <input
                type="date"
                required
                value={formData.followup_date}
                onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                step="1"
                value={formData.reminder_time}
                onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Remarks & Agenda
            </label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Call notes, agenda, discussion points..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? 'Saving...' : currentFollowup ? 'Update Follow-up' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Follow-up"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this scheduled follow-up reminder?
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => setIsDeleteOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default FollowUps;
