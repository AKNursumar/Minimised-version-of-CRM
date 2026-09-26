import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertCircle,
  Users,
  Target,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Briefcase,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import analyticsService from '../services/analyticsService';
import LeadStatusChart from '../components/charts/LeadStatusChart';
import PipelineStageChart from '../components/charts/PipelineStageChart';
import RevenueChart from '../components/charts/RevenueChart';
import FollowupStatusChart from '../components/charts/FollowupStatusChart';
import { getErrorMessage } from '../services/api';

export const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError('');
    try {
      const data = await analyticsService.getSummary();
      setAnalytics(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch analytics from backend.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <MainLayout title="CRM Reports & Visual Analytics">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Performance & Analytics</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time pipeline metrics, lead conversion rates, and revenue valuation charts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24">
          <LoadingSpinner size="large" text="Calculating analytics metrics..." />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load analytics</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* 8 Required KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Total Leads */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Leads</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{analytics.leads?.total || 0}</p>
              <span className="text-[10px] text-blue-600 font-medium">Acquired</span>
            </div>

            {/* 2. Converted Leads */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Converted Leads</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{analytics.leads?.converted || 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">
                {analytics.leads?.total > 0
                  ? `${Math.round(((analytics.leads.converted || 0) / analytics.leads.total) * 100)}%`
                  : '0%'}
              </span>
            </div>

            {/* 3. Total Contacts */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Contacts</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{analytics.contacts?.total || 0}</p>
              <span className="text-[10px] text-gray-400 font-medium">Directory</span>
            </div>

            {/* 4. Total Opportunities */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Deals</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{analytics.opportunities?.total || 0}</p>
              <span className="text-[10px] text-purple-600 font-medium">In Pipeline</span>
            </div>

            {/* 5. Won Opportunities */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Won Deals</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{analytics.opportunities?.won || 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Closed</span>
            </div>

            {/* 6. Lost Opportunities */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Lost Deals</span>
              <p className="text-xl font-bold text-rose-600 mt-1">{analytics.opportunities?.lost || 0}</p>
              <span className="text-[10px] text-rose-600 font-medium">Dropped</span>
            </div>

            {/* 7. Total Opportunity Value */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Value</span>
              <p className="text-lg font-bold text-blue-700 mt-1 truncate">
                {formatCurrency(analytics.opportunities?.total_value)}
              </p>
              <span className="text-[10px] text-blue-600 font-medium">Valuation</span>
            </div>

            {/* 8. Pending Follow-ups */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-gray-500 block truncate">Pending Tasks</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{analytics.followups?.pending || 0}</p>
              <span className="text-[10px] text-amber-600 font-medium">Follow-ups</span>
            </div>
          </div>

          {/* Interactive Chart Grid 1: Lead Status & Opportunity Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Lead Status Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Lead Status Distribution</h3>
                  <p className="text-xs text-gray-500">Live breakdown across acquisition statuses</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  {analytics.leads?.total || 0} Total
                </span>
              </div>
              <LeadStatusChart
                data={analytics.leads?.by_status}
                total={analytics.leads?.total}
              />
            </div>

            {/* Chart 2: Follow-up Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Follow-up Task Completion</h3>
                  <p className="text-xs text-gray-500">Status of client meetings and reminders</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg">
                  {analytics.followups?.total || 0} Scheduled
                </span>
              </div>
              <FollowupStatusChart
                data={analytics.followups?.by_status}
                total={analytics.followups?.total}
              />
            </div>
          </div>

          {/* Interactive Chart Grid 2: Pipeline Stages & Revenue by Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Opportunity Pipeline Stage Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Opportunity Pipeline Stages</h3>
                  <p className="text-xs text-gray-500">Distribution of active deals by stage</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                  {analytics.opportunities?.total || 0} Active
                </span>
              </div>
              <PipelineStageChart
                data={analytics.opportunities?.by_stage}
                total={analytics.opportunities?.total}
              />
            </div>

            {/* Chart 4: Revenue & Deal Value by Stage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Revenue Value by Stage</h3>
                  <p className="text-xs text-gray-500">Monetary pipeline distribution</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  Won: {formatCurrency(analytics.opportunities?.won_value)}
                </span>
              </div>
              <RevenueChart
                valueByStage={analytics.opportunities?.value_by_stage}
                totalValue={analytics.opportunities?.total_value}
              />
            </div>
          </div>

          {/* Lead Source Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Lead Acquisition by Source</h3>
            <p className="text-xs text-gray-500 mb-4">Effectiveness of inbound and outbound channels</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL', 'PHONE', 'OTHER'].map((src) => {
                const count = analytics.leads?.by_source?.[src] || 0;
                const total = analytics.leads?.total || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={src} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                    <span className="text-xs font-semibold text-gray-600 capitalize block truncate">
                      {src.toLowerCase().replace('_', ' ')}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
                    <span className="text-[10px] text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
};

export default Reports;
