import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  User,
  LayoutGrid,
  List,
  GripVertical,
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

// Standard 6-Stage CRM Sales Pipeline
const PIPELINE_STAGES = [
  {
    id: 'NEW',
    label: 'New',
    color: 'blue',
    headerBg: 'bg-blue-50/80 border-blue-200 text-blue-900',
    countBadge: 'bg-blue-100 text-blue-700',
    accentBorder: 'border-l-blue-500',
    hoverBorder: 'border-blue-400 bg-blue-50/30',
  },
  {
    id: 'QUALIFIED',
    label: 'Qualified',
    color: 'indigo',
    headerBg: 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
    countBadge: 'bg-indigo-100 text-indigo-700',
    accentBorder: 'border-l-indigo-500',
    hoverBorder: 'border-indigo-400 bg-indigo-50/30',
  },
  {
    id: 'PROPOSAL',
    label: 'Proposal',
    color: 'amber',
    headerBg: 'bg-amber-50/80 border-amber-200 text-amber-900',
    countBadge: 'bg-amber-100 text-amber-700',
    accentBorder: 'border-l-amber-500',
    hoverBorder: 'border-amber-400 bg-amber-50/30',
  },
  {
    id: 'NEGOTIATION',
    label: 'Negotiation',
    color: 'purple',
    headerBg: 'bg-purple-50/80 border-purple-200 text-purple-900',
    countBadge: 'bg-purple-100 text-purple-700',
    accentBorder: 'border-l-purple-500',
    hoverBorder: 'border-purple-400 bg-purple-50/30',
  },
  {
    id: 'WON',
    label: 'Won',
    color: 'emerald',
    headerBg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    countBadge: 'bg-emerald-100 text-emerald-700',
    accentBorder: 'border-l-emerald-500',
    hoverBorder: 'border-emerald-400 bg-emerald-50/30',
  },
  {
    id: 'LOST',
    label: 'Lost',
    color: 'rose',
    headerBg: 'bg-rose-50/80 border-rose-200 text-rose-900',
    countBadge: 'bg-rose-100 text-rose-700',
    accentBorder: 'border-l-rose-500',
    hoverBorder: 'border-rose-400 bg-rose-50/30',
  },
];

export const Opportunities = () => {
  const { currentUser } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // View Switcher (Kanban Board vs Table View)
  const [viewMode, setViewMode] = useState('kanban');

  // Drag and Drop States
  const [draggedOpp, setDraggedOpp] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

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
    amount: '',
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

  // Calculate Pipeline Metrics
  const totalPipelineValue = opportunities.reduce(
    (sum, o) => sum + (parseFloat(o.amount) || 0),
    0
  );
  const wonPipelineValue = opportunities
    .filter((o) => o.stage === 'WON')
    .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

  // Drag and drop handlers
  const handleDragStart = (e, opp) => {
    setDraggedOpp(opp);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(opp.id));
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedOpp || draggedOpp.stage === targetStage) {
      setDraggedOpp(null);
      return;
    }

    const oppToMove = draggedOpp;
    const oldStage = oppToMove.stage;
    const stageInfo = PIPELINE_STAGES.find((s) => s.id === targetStage);
    setDraggedOpp(null);

    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppToMove.id ? { ...o, stage: targetStage } : o))
    );

    try {
      await opportunityService.patch(oppToMove.id, { stage: targetStage });
      setToast({
        type: 'success',
        message: `Moved "${oppToMove.title}" to ${stageInfo?.label || targetStage} stage.`,
      });
    } catch (err) {
      // Rollback on failure
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppToMove.id ? { ...o, stage: oldStage } : o))
      );
      setToast({
        type: 'error',
        message: getErrorMessage(err, `Failed to move opportunity to ${targetStage}.`),
      });
    }
  };

  const handleOpenAdd = (preselectedStage = 'NEW') => {
    setCurrentOpp(null);
    setFormData({
      ...initialFormState,
      stage: preselectedStage,
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
      amount: opp.amount !== undefined ? String(opp.amount) : '',
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
        amount: formData.amount ? parseFloat(formData.amount) : 0,
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

  const getContactItem = (contactId) => {
    return contacts.find((c) => c.id === contactId);
  };

  return (
    <MainLayout title="Sales Opportunities Pipeline">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center">
            Opportunities Pipeline
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage deals and drag-and-drop progression across pipeline stages
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              Table View
            </button>
          </div>

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
            onClick={() => handleOpenAdd('NEW')}
            className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Opportunity
          </button>
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Total Pipeline Value
          </span>
          <span className="text-lg font-bold text-gray-900 mt-0.5 block">
            ${totalPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Won Deals Value
          </span>
          <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
            ${wonPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Active Deals
          </span>
          <span className="text-lg font-bold text-gray-900 mt-0.5 block">
            {opportunities.length}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">
            Conversion Rate
          </span>
          <span className="text-lg font-bold text-purple-700 mt-0.5 block">
            {opportunities.length > 0
              ? `${Math.round(
                  (opportunities.filter((o) => o.stage === 'WON').length /
                    opportunities.length) *
                    100
                )}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by title or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Stage Filter:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Stages (Full Pipeline)</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16">
          <LoadingSpinner size="medium" text="Loading pipeline opportunities..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
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
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px] items-start">
            {PIPELINE_STAGES.filter(
              (stage) => stageFilter === 'ALL' || stage.id === stageFilter
            ).map((stage) => {
              const stageOpps = filteredOpportunities.filter((o) => o.stage === stage.id);
              const stageValue = stageOpps.reduce(
                (sum, o) => sum + (parseFloat(o.amount) || 0),
                0
              );
              const isOver = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragEnter={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`flex-1 min-w-[240px] max-w-[320px] rounded-xl border transition-all duration-150 flex flex-col bg-slate-50/70 ${
                    isOver
                      ? 'border-2 border-dashed border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-300'
                      : 'border-gray-200/90 shadow-2xs'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-3 rounded-t-xl border-b flex items-center justify-between ${stage.headerBg}`}>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs tracking-tight">{stage.label}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.countBadge}`}
                      >
                        {stageOpps.length}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAdd(stage.id)}
                        className="p-1 rounded-md text-gray-500 hover:text-blue-700 hover:bg-white/80 transition"
                        title={`Add deal to ${stage.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Value Metric */}
                  <div className="px-3 py-1.5 bg-white/60 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>Stage Value:</span>
                    <span className="font-bold text-gray-800">
                      ${stageValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Column Drop Area & Cards */}
                  <div className="p-2.5 space-y-2.5 flex-1 min-h-[350px]">
                    {stageOpps.length === 0 ? (
                      <div className="h-32 border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center p-3 text-gray-400">
                        <p className="text-xs">No deals</p>
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(stage.id)}
                          className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-0.5" /> Add deal
                        </button>
                      </div>
                    ) : (
                      stageOpps.map((opp) => {
                        const contactItem = getContactItem(opp.contact);
                        const isBeingDragged = draggedOpp?.id === opp.id;

                        return (
                          <div
                            key={opp.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, opp)}
                            className={`group relative bg-white border border-gray-200/90 rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing border-l-4 ${
                              stage.accentBorder
                            } ${isBeingDragged ? 'opacity-40 ring-2 ring-blue-400' : ''}`}
                          >
                            {/* Card Header & Title */}
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                                {opp.title}
                              </h4>
                              <div className="flex items-center space-x-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(opp);
                                  }}
                                  className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDelete(opp);
                                  }}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Contact Information */}
                            <div className="text-[11px] text-gray-600 mb-2 flex items-center truncate">
                              <User className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                              <span className="truncate font-medium">
                                {contactItem?.name || `Contact #${opp.contact}`}
                              </span>
                              {contactItem?.company && (
                                <span className="text-gray-400 ml-1 truncate">
                                  ({contactItem.company})
                                </span>
                              )}
                            </div>

                            {/* Opportunity Amount */}
                            <div className="mb-2">
                              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                ${parseFloat(opp.amount || 0).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            {/* Card Footer: Close date & notes */}
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-gray-300" />
                                {opp.expected_close || 'No close date'}
                              </span>

                              <div className="flex items-center text-gray-300 group-hover:text-blue-500 transition">
                                <GripVertical className="w-3.5 h-3.5" title="Drag to advance stage" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {filteredOpportunities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No opportunities recorded</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                Track sales deals and negotiations with your contacts.
              </p>
              <button
                onClick={() => handleOpenAdd('NEW')}
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
                    <th className="px-5 py-3.5">Amount</th>
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
                      <td className="px-5 py-4 font-bold text-emerald-700 text-xs">
                        ${parseFloat(opp.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
      )}

      {/* Modal - Add / Edit Opportunity */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Deal Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Pipeline Stage
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
                Expected Close
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
              Assigned Representative
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name || u.username} ({u.role})
                </option>
              ))}
            </select>
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
