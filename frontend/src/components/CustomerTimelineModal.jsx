import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Mail,
  FileText,
  Phone,
  Video,
  UserCheck,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Building,
  User,
} from 'lucide-react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import contactService from '../services/contactService';
import { getErrorMessage } from '../services/api';

export const CustomerTimelineModal = ({ isOpen, onClose, contact, onUpdateContact }) => {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');

  // Quick note state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    note_type: 'CALL',
    title: '',
    content: '',
  });

  const fetchTimeline = async () => {
    if (!contact?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await contactService.getTimeline(contact.id, { order: sortOrder });
      setTimelineData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load customer timeline history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contact?.id) {
      fetchTimeline();
    }
  }, [isOpen, contact?.id, sortOrder]);

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;

    setSubmittingNote(true);
    try {
      await contactService.addNote(contact.id, noteForm);
      setNoteForm({ note_type: 'CALL', title: '', content: '' });
      setIsAddingNote(false);
      await fetchTimeline();
      if (onUpdateContact) onUpdateContact();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save interaction note.'));
    } finally {
      setSubmittingNote(false);
    }
  };

  const getEventIcon = (event) => {
    switch (event.type) {
      case 'LEAD':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'CONTACT':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'DEAL':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'FOLLOWUP':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-sky-600" />;
      case 'NOTE':
        if (event.details?.note_type === 'CALL') return <Phone className="w-4 h-4 text-blue-600" />;
        if (event.details?.note_type === 'MEETING') return <Video className="w-4 h-4 text-purple-600" />;
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventBubbleColor = (event) => {
    switch (event.type) {
      case 'LEAD':
        return 'bg-blue-100 border-blue-200';
      case 'CONTACT':
        return 'bg-emerald-100 border-emerald-200';
      case 'DEAL':
        return 'bg-purple-100 border-purple-200';
      case 'FOLLOWUP':
        return 'bg-amber-100 border-amber-200';
      case 'EMAIL':
        return 'bg-sky-100 border-sky-200';
      case 'NOTE':
        return 'bg-slate-100 border-slate-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getBadgeStyle = (badgeColor) => {
    const styles = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      sky: 'bg-sky-50 text-sky-700 border-sky-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return styles[badgeColor] || styles.gray;
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const allEvents = timelineData?.events || [];
  const filteredEvents = allEvents.filter((event) => {
    if (filterType === 'ALL') return true;
    return event.type === filterType;
  });

  const summary = timelineData?.summary || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Interaction Timeline"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Customer Header Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {contact?.name ? contact.name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-900">{contact?.name}</h3>
                {contact?.company && (
                  <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    <Building className="w-3 h-3 mr-1 text-gray-400" />
                    {contact.company}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                {contact?.email && (
                  <span className="flex items-center">
                    <Mail className="w-3 h-3 mr-1 text-gray-400" />
                    {contact.email}
                  </span>
                )}
                {contact?.phone && (
                  <span className="flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-gray-400" />
                    {contact.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {isAddingNote ? 'Cancel Note' : 'Log Interaction'}
            </button>
            <button
              type="button"
              onClick={fetchTimeline}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg shadow-2xs hover:bg-gray-100 transition"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Events</span>
            <span className="text-base font-bold text-gray-900">{summary.total_events || 0}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-[11px] font-medium text-purple-600 uppercase tracking-wider block">Deals</span>
            <span className="text-base font-bold text-purple-700">{summary.deals_count || 0}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block">Follow-ups</span>
            <span className="text-base font-bold text-amber-700">{summary.followups_count || 0}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-[11px] font-medium text-sky-600 uppercase tracking-wider block">Emails</span>
            <span className="text-base font-bold text-sky-700">{summary.emails_count || 0}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Notes</span>
            <span className="text-base font-bold text-emerald-700">{summary.notes_count || 0}</span>
          </div>
        </div>

        {/* Add Interaction Note Form Panel */}
        {isAddingNote && (
          <form
            onSubmit={handleAddNoteSubmit}
            className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 transition-all"
          >
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Log Customer Touchpoint / Note
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Touchpoint Type
                </label>
                <select
                  value={noteForm.note_type}
                  onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="MEETING">Meeting / Demo</option>
                  <option value="NOTE">General Note</option>
                  <option value="EMAIL">Email Discussion</option>
                  <option value="FOLLOWUP">Follow-up Note</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Subject / Summary Title
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Discovery call regarding enterprise pricing"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                Interaction Details / Discussion Notes *
              </label>
              <textarea
                required
                rows={3}
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Log discussion points, key decision makers, agreed next steps..."
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-xs font-medium text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingNote}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-60 transition"
              >
                {submittingNote ? 'Saving...' : 'Save to Timeline'}
              </button>
            </div>
          </form>
        )}

        {/* Filters and Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All History' },
              { id: 'DEAL', label: 'Deals' },
              { id: 'FOLLOWUP', label: 'Follow-ups' },
              { id: 'EMAIL', label: 'Emails' },
              { id: 'NOTE', label: 'Notes' },
              { id: 'LEAD', label: 'Lead' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-gray-500 font-medium">Order:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="medium" text="Compiling customer history..." />
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600 mx-auto mb-2" />
              <p className="text-xs text-rose-700 mb-2">{error}</p>
              <button
                onClick={fetchTimeline}
                className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-gray-600">No interaction events found</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {filterType === 'ALL'
                  ? 'Log the first interaction note above to start the customer timeline.'
                  : `No events matching filter "${filterType}".`}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Event Node Bubble */}
                  <div
                    className={`absolute -left-6 top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-xs bg-white ${getEventBubbleColor(
                      event
                    )}`}
                  >
                    {getEventIcon(event)}
                  </div>

                  {/* Event Card */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs hover:border-gray-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyle(
                            event.badge_color
                          )}`}
                        >
                          {event.category || event.badge}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center shrink-0">
                        <Clock className="w-3 h-3 mr-1 text-gray-300" />
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    {/* Description / Content */}
                    {event.description && (
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mb-2 font-normal">
                        {event.description}
                      </p>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                      <span className="flex items-center font-medium text-gray-500">
                        <User className="w-3 h-3 mr-1 text-gray-400" />
                        {event.author || 'System'}
                      </span>

                      {/* Specific Event Tags */}
                      {event.amount !== undefined && (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          Value: ${Number(event.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}

                      {event.details?.receiver && (
                        <span className="text-gray-500">
                          To: <span className="font-medium text-gray-700">{event.details.receiver}</span>
                        </span>
                      )}

                      {event.details?.date && (
                        <span className="text-gray-500">
                          Due Date: <span className="font-medium text-gray-700">{event.details.date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span>Unified CRM Customer Timeline Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerTimelineModal;
