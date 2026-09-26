import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  User,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import leadService from '../services/leadService';
import userService from '../services/userService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Leads = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    status: 'NEW',
    assigned_to: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch leads and users
  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await leadService.getAll();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch leads.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const userData = await userService.getAll();
      setUsers(Array.isArray(userData) ? userData : []);
    } catch {
      // Non-admins might not have permission to view /api/users/
      if (currentUser) {
        setUsers([currentUser]);
      }
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lead.name?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query);

      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  // Open Add modal
  const handleOpenAdd = () => {
    setCurrentLead(null);
    setFormData({
      ...initialFormState,
      assigned_to: currentUser?.id || '',
    });
    setIsAddEditOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (lead) => {
    setCurrentLead(lead);
    setFormData({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'OTHER',
      status: lead.status || 'NEW',
      assigned_to: lead.assigned_to || '',
    });
    setIsAddEditOpen(true);
  };

  // Open View modal
  const handleOpenView = (lead) => {
    setCurrentLead(lead);
    setIsViewOpen(true);
  };

  // Open Delete modal
  const handleOpenDelete = (lead) => {
    setCurrentLead(lead);
    setIsDeleteOpen(true);
  };

  // Save Lead (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ type: 'error', message: 'Lead name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      };

      if (currentLead) {
        // Update
        const updated = await leadService.update(currentLead.id, payload);
        setLeads((prev) => prev.map((l) => (l.id === currentLead.id ? updated : l)));
        setToast({ type: 'success', message: `Lead "${formData.name}" updated successfully.` });
      } else {
        // Create
        const created = await leadService.create(payload);
        setLeads((prev) => [created, ...prev]);
        setToast({ type: 'success', message: `Lead "${formData.name}" created successfully.` });
      }

      setIsAddEditOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to save lead.') });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Lead
  const handleConfirmDelete = async () => {
    if (!currentLead) return;
    setSubmitting(true);
    try {
      await leadService.delete(currentLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== currentLead.id));
      setToast({ type: 'success', message: `Lead "${currentLead.name}" deleted successfully.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to delete lead.') });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      CONTACTED: 'bg-amber-50 text-amber-700 border-amber-200',
      QUALIFIED: 'bg-purple-50 text-purple-700 border-purple-200',
      CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      LOST: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return badges[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const found = users.find((u) => u.id === userId);
    return found ? (found.first_name ? `${found.first_name} ${found.last_name || ''}` : found.username) : `User #${userId}`;
  };

  // Export Leads to CSV
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await leadService.exportCsv();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({
        type: 'success',
        message: 'Leads exported to leads_export.csv successfully!',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to export leads. Only Admins and Managers can export data.'),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout title="Leads Management">
      {/* Toast Alert */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Leads</h2>
          <p className="text-xs text-gray-500 mt-1">
            Capture, track, and convert prospective customers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {currentUser?.role !== 'SALES_EXECUTIVE' && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs"
              title="Export Leads to CSV"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            type="button"
            onClick={fetchLeads}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-2xs"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, email..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="medium" text="Loading leads from backend..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load leads</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchLeads}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No leads found</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL'
                ? 'No leads matched your search or filter criteria. Try clearing filters.'
                : 'Get started by creating your first lead in the CRM.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned To</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-5 py-4">
                      {lead.company ? (
                        <span className="flex items-center text-gray-700">
                          <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {lead.company}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs space-y-1">
                      {lead.email ? (
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {lead.email}
                        </div>
                      ) : null}
                      {lead.phone ? (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {lead.phone}
                        </div>
                      ) : null}
                      {!lead.email && !lead.phone && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {lead.source?.toLowerCase().replace('_', ' ') || 'Other'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-700">
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {getUserName(lead.assigned_to)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(lead)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Lead Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(lead)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Lead"
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

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={currentLead ? 'Edit Lead' : 'Add New Lead'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Assigned User
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name ? `${u.first_name} ${u.last_name || ''} (${u.username})` : u.username} - {u.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition"
            >
              {submitting ? 'Saving...' : currentLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Lead Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Lead Details"
      >
        {currentLead && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{currentLead.name}</h4>
                  <p className="text-xs text-gray-500">{currentLead.company || 'Individual Prospect'}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                    currentLead.status
                  )}`}
                >
                  {currentLead.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                <p className="text-gray-900 font-medium mt-0.5">{currentLead.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                <p className="text-gray-900 font-medium mt-0.5">{currentLead.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Source</p>
                <p className="text-gray-900 font-medium mt-0.5 capitalize">
                  {currentLead.source?.toLowerCase().replace('_', ' ') || 'Other'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Assigned To</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {getUserName(currentLead.assigned_to)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Created At</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {new Date(currentLead.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Last Updated</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {new Date(currentLead.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        <div className="text-center sm:text-left">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Delete Lead</h4>
              <p className="text-xs text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete lead{' '}
            <span className="font-semibold text-gray-900">"{currentLead?.name}"</span>?
          </p>
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition"
            >
              {submitting ? 'Deleting...' : 'Delete Lead'}
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Leads;
