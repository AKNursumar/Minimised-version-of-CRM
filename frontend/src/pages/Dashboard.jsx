import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Contact2,
  TrendingUp,
  CalendarClock,
  Plus,
  ArrowRight,
  Clock,
  RefreshCw,
  Activity,
  UserCheck,
  CheckCircle,
  FileText,
  Mail,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import leadService from '../services/leadService';
import contactService from '../services/contactService';
import opportunityService from '../services/opportunityService';
import followupService from '../services/followupService';
import activityService from '../services/activityService';
import analyticsService from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import LeadStatusChart from '../components/charts/LeadStatusChart';
import PipelineStageChart from '../components/charts/PipelineStageChart';

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
  const [activities, setActivities] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError('');

    try {
      // Fetch core datasets in parallel from real Django APIs
      const [leadsRes, contactsRes, oppsRes, followupsRes, activitiesRes, analyticsRes] =
        await Promise.allSettled([
          leadService.getAll(),
          contactService.getAll(),
          opportunityService.getAll(),
          followupService.getAll(),
          activityService.getAll(),
          analyticsService.getSummary(),
        ]);

      const leads = leadsRes.status === 'fulfilled' ? leadsRes.value : [];
      const contacts = contactsRes.status === 'fulfilled' ? contactsRes.value : [];
      const opps = oppsRes.status === 'fulfilled' ? oppsRes.value : [];
      const followups = followupsRes.status === 'fulfilled' ? followupsRes.value : [];
      const actLogs = activitiesRes.status === 'fulfilled' ? activitiesRes.value : [];
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;

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
      setActivities(Array.isArray(actLogs) ? actLogs.slice(0, 10) : []);
      setAnalyticsData(analytics);
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

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getActivityVisual = (text = '') => {
    const lower = text.toLowerCase();
    if (lower.includes('lead')) {
      return { dot: 'bg-blue-500', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' };
    }
    if (lower.includes('contact')) {
      return { dot: 'bg-emerald-500', icon: Contact2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    }
    if (lower.includes('opportunity') || lower.includes('deal')) {
      return { dot: 'bg-purple-500', icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-100' };
    }
    if (lower.includes('follow-up') || lower.includes('followup')) {
      return { dot: 'bg-amber-500', icon: CalendarClock, color: 'text-amber-600 bg-amber-50 border-amber-100' };
    }
    if (lower.includes('email')) {
      return { dot: 'bg-indigo-500', icon: Mail, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    }
    if (lower.includes('login') || lower.includes('logged in')) {
      return { dot: 'bg-teal-500', icon: UserCheck, color: 'text-teal-600 bg-teal-50 border-teal-100' };
    }
    return { dot: 'bg-gray-400', icon: FileText, color: 'text-gray-600 bg-gray-50 border-gray-100' };
  };

  return (
    <MainLayout title="Dashboard Overview">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Welcome back, {currentUser?.first_name || currentUser?.username || 'User'}! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time customer relationship metrics, sales pipeline, and live audit feed.
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
          change="+12% from last month"
          trend="up"
        />
        <StatCard
          title="Total Contacts"
          value={stats.contactsCount}
          icon={Contact2}
          color="green"
          loading={loading}
          change="+8% from last month"
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

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LeadStatusChart
          data={
            analyticsData?.lead_status_distribution || {
              NEW: recentLeads.filter((l) => l.status === 'NEW').length,
              CONTACTED: recentLeads.filter((l) => l.status === 'CONTACTED').length,
              QUALIFIED: recentLeads.filter((l) => l.status === 'QUALIFIED').length,
              CONVERTED: recentLeads.filter((l) => l.status === 'CONVERTED').length,
              LOST: recentLeads.filter((l) => l.status === 'LOST').length,
            }
          }
        />
        <PipelineStageChart
          data={
            analyticsData?.opportunity_stage_distribution || {
              NEW: opportunities.filter((o) => o.stage === 'NEW').length,
              QUALIFIED: opportunities.filter((o) => o.stage === 'QUALIFIED').length,
              PROPOSAL: opportunities.filter((o) => o.stage === 'PROPOSAL').length,
              NEGOTIATION: opportunities.filter((o) => o.stage === 'NEGOTIATION').length,
              WON: opportunities.filter((o) => o.stage === 'WON').length,
              LOST: opportunities.filter((o) => o.stage === 'LOST').length,
            }
          }
        />
      </div>

      {/* Main Grid: Recent Leads Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Recent Leads */}
        <div className="lg:col-span-2 space-y-6">
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
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                        Loading leads...
                      </td>
                    </tr>
                  ) : recentLeads.length === 0 ? (
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

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              CRM Modules Quick Access
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/leads"
                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-blue-600">
                      Manage Leads
                    </span>
                    <span className="text-[11px] text-gray-500">Track & qualify</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </Link>

              <Link
                to="/contacts"
                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Contact2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-emerald-600">
                      Manage Contacts
                    </span>
                    <span className="text-[11px] text-gray-500">Customer directory</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition" />
              </Link>

              <Link
                to="/opportunities"
                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block group-hover:text-purple-600">
                      Pipeline
                    </span>
                    <span className="text-[11px] text-gray-500">Deals & revenue</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Col: Live Activity Feed */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                Live API
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Real-time audit log of actions performed across the CRM.
            </p>

            {loading ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <LoadingSpinner />
                <p className="mt-2">Loading activity feed...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No recent activity.
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {activities.map((item, idx) => {
                    const visual = getActivityVisual(item.activity);
                    const VisualIcon = visual.icon;
                    return (
                      <li key={item.id || idx} className="relative flex items-start space-x-3 text-xs">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${visual.color}`}
                        >
                          <VisualIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 leading-tight">
                            {item.activity}
                          </p>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-400 mt-1">
                            <span className="font-medium text-gray-600">
                              {item.user_details?.first_name
                                ? `${item.user_details.first_name} ${item.user_details.last_name || ''}`.trim()
                                : item.username || 'System User'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-0.5 inline text-gray-400" />
                              {formatTimeAgo(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
