import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Contact2,
  TrendingUp,
  CalendarClock,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import leadService from '../services/leadService';
import contactService from '../services/contactService';
import opportunityService from '../services/opportunityService';
import followupService from '../services/followupService';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    leadsCount: 0,
    contactsCount: 0,
    opportunitiesCount: 0,
    followupsCount: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError('');

    try {
      // Fetch data in parallel from real Django APIs
      const [leadsRes, contactsRes, oppsRes, followupsRes] = await Promise.allSettled([
        leadService.getAll(),
        contactService.getAll(),
        opportunityService.getAll(),
        followupService.getAll(),
      ]);

      const leads = leadsRes.status === 'fulfilled' ? leadsRes.value : [];
      const contacts = contactsRes.status === 'fulfilled' ? contactsRes.value : [];
      const opps = oppsRes.status === 'fulfilled' ? oppsRes.value : [];
      const followups = followupsRes.status === 'fulfilled' ? followupsRes.value : [];

      setStats({
        leadsCount: Array.isArray(leads) ? leads.length : 0,
        contactsCount: Array.isArray(contacts) ? contacts.length : 0,
        opportunitiesCount: Array.isArray(opps) ? opps.length : 0,
        followupsCount: Array.isArray(followups)
          ? followups.filter((f) => f.status === 'PENDING').length
          : 0,
      });

      // Recent leads: sort newest first, take 5
      const sortedLeads = Array.isArray(leads)
        ? [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
        : [];
      setRecentLeads(sortedLeads);

      setOpportunities(Array.isArray(opps) ? opps : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load some dashboard metrics from the backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      NEW: 'bg-blue-100 text-blue-800 border-blue-200',
      CONTACTED: 'bg-amber-100 text-amber-800 border-amber-200',
      QUALIFIED: 'bg-purple-100 text-purple-800 border-purple-200',
      CONVERTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      LOST: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Stage pipeline counts from real opportunities
  const pipelineStages = [
    { key: 'NEW', label: 'New', color: 'bg-blue-500' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-500' },
    { key: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-500' },
    { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-purple-500' },
    { key: 'WON', label: 'Won', color: 'bg-emerald-500' },
    { key: 'LOST', label: 'Lost', color: 'bg-rose-400' },
  ];

  return (
    <MainLayout title="Dashboard Overview">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Welcome back, {currentUser?.first_name || currentUser?.username || 'User'}! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Here is your live CRM business pipeline and customer interaction summary.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            to="/leads"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lead
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Leads"
          value={stats.leadsCount}
          icon={Users}
          color="blue"
          loading={loading}
          change="+12%"
          trend="up"
        />
        <StatCard
          title="Total Contacts"
          value={stats.contactsCount}
          icon={Contact2}
          color="green"
          loading={loading}
          change="+8%"
          trend="up"
        />
        <StatCard
          title="Open Opportunities"
          value={stats.opportunitiesCount}
          icon={TrendingUp}
          color="purple"
          loading={loading}
          change="Active pipeline"
          trend="neutral"
        />
        <StatCard
          title="Pending Follow-ups"
          value={stats.followupsCount}
          icon={CalendarClock}
          color="amber"
          loading={loading}
          change="Action required"
          trend={stats.followupsCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Main Grid: Pipeline Summary & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Pipeline Summary & Recent Leads */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Pipeline Funnel Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Sales Pipeline Overview</h3>
              <span className="text-xs font-medium text-gray-500">Live Stages</span>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Distribution of sales opportunities across active pipeline stages.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {pipelineStages.map((stage) => {
                const count = opportunities.filter((o) => o.stage === stage.key).length;
                return (
                  <div
                    key={stage.key}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center"
                  >
                    <div className="flex items-center justify-center space-x-1.5 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-xs font-semibold text-gray-600">{stage.label}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Leads Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Leads</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Latest leads registered in the CRM database
                </p>
              </div>
              <Link
                to="/leads"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all leads
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Lead Name</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                        No leads recorded yet. Click "Add Lead" to create one.
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {lead.name}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {lead.company || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-600 font-medium capitalize">
                            {lead.source?.toLowerCase().replace('_', ' ') || 'Other'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                              lead.status
                            )}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Activities & Quick Navigation */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <Link
                to="/leads"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-blue-600">
                      Manage Leads
                    </span>
                    <span className="text-[11px] text-gray-500">Create, assign and qualify</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </Link>

              <Link
                to="/contacts"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Contact2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-emerald-600">
                      Manage Contacts
                    </span>
                    <span className="text-[11px] text-gray-500">Maintain customer records</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition" />
              </Link>

              <Link
                to="/opportunities"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-purple-600">
                      Opportunities Pipeline
                    </span>
                    <span className="text-[11px] text-gray-500">Track deal progression</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
              </Link>
            </div>
          </div>

          {/* Activity Log (Clearly marked placeholder for Week 5 as instructed) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Recent Activities
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                Week 5 Preview
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              System activity log (interactive activity feed planned for Week 6)
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start space-x-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Lead registered: Bhoraniya Technologies
                  </p>
                  <p className="text-gray-400 text-[11px]">Assigned to Sales Executive</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Lead created: Rahul
                  </p>
                  <p className="text-gray-400 text-[11px]">Source: Website inquiry</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    CRM Session authenticated via JWT
                  </p>
                  <p className="text-gray-400 text-[11px]">Logged in as {currentUser?.username || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
