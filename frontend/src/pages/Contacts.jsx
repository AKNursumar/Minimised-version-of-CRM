import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  MapPin,
  Contact2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download,
  History,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerTimelineModal from '../components/CustomerTimelineModal';
import contactService from '../services/contactService';
import leadService from '../services/leadService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Contacts = () => {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [timelineContact, setTimelineContact] = useState(null);

  const handleOpenTimeline = (contact) => {
    setTimelineContact(contact);
    setIsTimelineOpen(true);
  };

  // Form state
  const initialFormState = {
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    lead: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contactService.getAll();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch contacts.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await leadService.getAll();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical if leads fail to load
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchLeads();
  }, []);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const query = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.address?.toLowerCase().includes(query)
      );
    });
  }, [contacts, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setCurrentContact(null);
    setFormData(initialFormState);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name || '',
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      notes: contact.notes || '',
      lead: contact.lead || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenView = (contact) => {
    setCurrentContact(contact);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (contact) => {
    setCurrentContact(contact);
    setIsDeleteOpen(true);
  };

  // Submit form (create or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ type: 'error', message: 'Contact name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        lead: formData.lead ? Number(formData.lead) : null,
      };

      if (currentContact) {
        const updated = await contactService.update(currentContact.id, payload);
        setContacts((prev) => prev.map((c) => (c.id === currentContact.id ? updated : c)));
        setToast({ type: 'success', message: `Contact "${formData.name}" updated successfully.` });
      } else {
        const created = await contactService.create(payload);
        setContacts((prev) => [created, ...prev]);
        setToast({ type: 'success', message: `Contact "${formData.name}" added successfully.` });
      }

      setIsAddEditOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to save contact.') });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!currentContact) return;
    setSubmitting(true);
    try {
      await contactService.delete(currentContact.id);
      setContacts((prev) => prev.filter((c) => c.id !== currentContact.id));
      setToast({ type: 'success', message: `Contact "${currentContact.name}" deleted successfully.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Failed to delete contact.') });
    } finally {
      setSubmitting(false);
    }
  };

  const getLeadName = (leadId) => {
    if (!leadId) return null;
    const found = leads.find((l) => l.id === leadId);
    return found ? found.name : `Lead #${leadId}`;
  };

  // Export Contacts to CSV
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await contactService.exportCsv();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({
        type: 'success',
        message: 'Contacts exported to contacts_export.csv successfully!',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to export contacts. Only Admins and Managers can export data.'),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout title="Contacts Directory">
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Contacts</h2>
          <p className="text-xs text-gray-500 mt-1">
            Directory of key client contacts and customer accounts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {currentUser?.role !== 'SALES_EXECUTIVE' && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs"
              title="Export Contacts to CSV"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            type="button"
            onClick={fetchContacts}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition shadow-2xs"
            title="Refresh Contacts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, email, phone, company..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
        <span className="text-xs font-medium text-gray-500 hidden sm:block">
          Showing <span className="font-bold text-gray-800">{filteredContacts.length}</span> contacts
        </span>
      </div>

      {/* Contacts Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="medium" text="Loading contacts from backend..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load contacts</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchContacts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Contact2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No contacts found</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              {searchQuery
                ? 'No contacts matched your search query.'
                : 'There are no contacts recorded yet. Add your first customer contact!'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Address</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div>
                        {contact.name}
                        {contact.lead && (
                          <span className="block text-[11px] font-normal text-blue-600">
                            Linked to: {getLeadName(contact.lead)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {contact.company ? (
                        <span className="flex items-center">
                          <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {contact.company}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {contact.email ? (
                        <span className="flex items-center">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {contact.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {contact.phone ? (
                        <span className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {contact.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-xs truncate">
                      {contact.address ? (
                        <span className="flex items-center truncate" title={contact.address}>
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
                          <span className="truncate">{contact.address}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenTimeline(contact)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="Customer Interaction Timeline"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenView(contact)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Contact Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(contact)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(contact)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Contact"
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

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={currentContact ? 'Edit Contact' : 'Add New Contact'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Contact Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
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
              placeholder="e.g. Nexus Corp"
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
                placeholder="sarah@nexus.com"
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
                placeholder="+1 555-0248"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Physical Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Suite 400, 100 Main St, New York, NY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Associate with Lead
            </label>
            <select
              value={formData.lead}
              onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None (Independent Contact)</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `(${l.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Important notes regarding this contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
              {submitting ? 'Saving...' : currentContact ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Contact Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Contact Details"
      >
        {currentContact && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900">{currentContact.name}</h4>
              <p className="text-xs text-gray-500">{currentContact.company || 'Direct Contact'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                <p className="text-gray-900 font-medium mt-0.5">{currentContact.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                <p className="text-gray-900 font-medium mt-0.5">{currentContact.phone || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                <p className="text-gray-900 font-medium mt-0.5">{currentContact.address || '—'}</p>
              </div>
              {currentContact.lead && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Linked Lead</p>
                  <p className="text-blue-600 font-medium mt-0.5">
                    {getLeadName(currentContact.lead)}
                  </p>
                </div>
              )}
              {currentContact.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                  <p className="text-gray-700 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200 mt-1 whitespace-pre-wrap">
                    {currentContact.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenTimeline(currentContact);
                }}
                className="inline-flex items-center px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                View Customer Timeline & History
              </button>
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

      {/* Customer Interaction Timeline Modal */}
      <CustomerTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        contact={timelineContact}
        onUpdateContact={fetchContacts}
      />

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
              <h4 className="text-base font-semibold text-gray-900">Delete Contact</h4>
              <p className="text-xs text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete contact{' '}
            <span className="font-semibold text-gray-900">"{currentContact?.name}"</span>?
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
              {submitting ? 'Deleting...' : 'Delete Contact'}
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Contacts;
