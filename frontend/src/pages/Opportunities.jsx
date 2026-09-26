import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  User,
  Building,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import opportunityService from '../services/opportunityService';
import contactService from '../services/contactService';
import userService from '../services/userService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Opportunities = () => {
  const { currentUser } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentOpp, setCurrentOpp] = useState(null);

  // Form State
  const initialFormState = {
    title: '',
    contact: '',
    stage: 'NEW',
    expected_close: '',
    notes: '',
    assigned_to: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await opportunityService.getAll();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch opportunities.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [contactsData, usersData] = await Promise.allSettled([
        contactService.getAll(),
        userService.getAll(),
      ]);
      if (contactsData.status === 'fulfilled') {
        setContacts(Array.isArray(contactsData.value) ? contactsData.value : []);
      }
      if (usersData.status === 'fulfilled') {
        setUsers(Array.isArray(usersData.value) ? usersData.value : []);
      } else if (currentUser) {
        setUsers([currentUser]);
      }
    } catch {
      // Dependencies failure non-fatal
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchDependencies();
  }, []);

  const filteredOpportunities = opportunities.filter((opp) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      opp.title?.toLowerCase().includes(query) ||
      opp.notes?.toLowerCase().includes(query);
    const matchesStage = stageFilter === 'ALL' || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleOpenAdd = () => {
    setCurrentOpp(null);
    setFormData({
      ...initialFormState,
      contact: contacts[0]?.id || '',
      assigned_to: currentUser?.id || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (opp) => {
    setCurrentOpp(opp);
    setFormData({
      title: opp.title || '',
      contact: opp.contact || '',
      stage: opp.stage || 'NEW',
      expected_close: opp.expected_close || '',
      notes: opp.notes || '',
      assigned_to: opp.assigned_to || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (opp) => {
    setCurrentOpp(opp);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setToast({ type: 'error', message: 'Opportunity title is required.' });
      return;
    }
    if (!formData.contact) {
      setToast({ type: 'error', message: 'Please select an associated contact.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        contact: Number(formData.contact),
        stage: formData.stage,
        expected_close: formData.expected_close || null,
        notes: formData.notes,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      };

      if (currentOpp) {
        const updated = await opportunityService.update(currentOpp.id, payload);
        setOpportunities((prev) => prev.map((o) => (o.id === currentOpp.id ? updated : o)));
        setToast({ type: 'success', message: `Opportunity "${formData.title}" updated successfully.` });
      } else {
        const created = await opportunityService.create(payload);
        setOpportunities((prev) => [created, ...prev]);
        setToast({ type: 'success', message: `Opportunity "${formData.title}" created successfully.` });
      }
      setIsAddEditOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to save opportunity.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentOpp) return;
    setSubmitting(true);
    try {
      await opportunityService.delete(currentOpp.id);
      setOpportunities((prev) => prev.filter((o) => o.id !== currentOpp.id));
      setToast({ type: 'success', message: `Opportunity "${currentOpp.title}" deleted.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to delete opportunity.') });
    } finally {
      setSubmitting(false);
    }
  };

  const getStageBadge = (stage) => {
    const badges = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      QUALIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      PROPOSAL: 'bg-amber-50 text-amber-700 border-amber-200',
      NEGOTIATION: 'bg-purple-50 text-purple-700 border-purple-200',
      WON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      LOST: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return badges[stage] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getContactName = (contactId) => {
    const found = contacts.find((c) => c.id === contactId);
    return found ? `${found.name} (${found.company || 'Contact'})` : `Contact #${contactId}`;
  };

  return (
    <MainLayout title="Sales Opportunities">
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Opportunities</h2>
          <p className="text-xs text-gray-500 mt-1">
            Track deals in progress, proposals, and pipeline stages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchOpportunities}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-2xs"
            title="Refresh Opportunities"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Opportunity
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="medium" text="Loading opportunities..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No opportunities recorded</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              Track sales deals and negotiations with your contacts.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Opportunity
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Opportunity Title</th>
                  <th className="px-5 py-3.5">Client Contact</th>
                  <th className="px-5 py-3.5">Pipeline Stage</th>
                  <th className="px-5 py-3.5">Expected Close</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {opp.title}
                      {opp.notes && (
                        <p className="text-xs text-gray-400 font-normal truncate max-w-xs">
                          {opp.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-medium">
                      {getContactName(opp.contact)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStageBadge(
                          opp.stage
                        )}`}
                      >
                        {opp.stage}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {opp.expected_close ? (
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {opp.expected_close}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(opp)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(opp)}
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
        title={currentOpp ? 'Edit Opportunity' : 'Add Opportunity'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Enterprise License Contract"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Contact *
            </label>
            <select
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expected_close}
                onChange={(e) => setFormData({ ...formData, expected_close: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes & Next Steps
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Deal details, terms discussed, next call agenda..."
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
              {submitting ? 'Saving...' : currentOpp ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Opportunity"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete opportunity{' '}
          <span className="font-semibold text-gray-900">"{currentOpp?.title}"</span>?
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
            {submitting ? 'Deleting...' : 'Delete Deal'}
          </button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Opportunities;
