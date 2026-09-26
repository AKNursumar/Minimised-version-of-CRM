import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  Users,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import leadService from '../services/leadService';
import opportunityService from '../services/opportunityService';

export const Reports = () => {
  const [leadStats, setLeadStats] = useState({ total: 0, byStatus: {}, bySource: {} });
  const [oppStats, setOppStats] = useState({ total: 0, byStage: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [leads, opps] = await Promise.all([
          leadService.getAll().catch(() => []),
          opportunityService.getAll().catch(() => []),
        ]);

        const statusMap = {};
        const sourceMap = {};
        leads.forEach((l) => {
          statusMap[l.status] = (statusMap[l.status] || 0) + 1;
          sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
        });

        const stageMap = {};
        opps.forEach((o) => {
          stageMap[o.stage] = (stageMap[o.stage] || 0) + 1;
        });

        setLeadStats({ total: leads.length, byStatus: statusMap, bySource: sourceMap });
        setOppStats({ total: opps.length, byStage: stageMap });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <MainLayout title="CRM Reports & Analytics">
      {/* Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start space-x-3 text-sm text-blue-900">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Week 5 Demonstration Notice:</span> Real CRM counts are
          aggregated from live Leads & Opportunities APIs. Advanced longitudinal trend charts are
          visual previews scheduled for the Week 6 analytics engine milestone.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Performance Reports</h2>
          <p className="text-xs text-gray-500 mt-1">
            Sales pipeline analytics, conversion metrics, and lead acquisition breakdown
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Summary
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Leads Registered
          </p>
          <p className="text-2xl font-bold text-gray-900">{leadStats.total}</p>
          <div className="mt-3 flex items-center text-xs text-emerald-600 font-semibold">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Active database entries</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Active Deals Tracked
          </p>
          <p className="text-2xl font-bold text-gray-900">{oppStats.total}</p>
          <div className="mt-3 flex items-center text-xs text-blue-600 font-semibold">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Opportunities pipeline</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Conversion Target
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {leadStats.total > 0
              ? `${Math.round(((leadStats.byStatus['CONVERTED'] || 0) / leadStats.total) * 100)}%`
              : '0%'}
          </p>
          <div className="mt-3 flex items-center text-xs text-purple-600 font-semibold">
            <span>Lead-to-deal conversion rate</span>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Leads by Status (Live Data)</h3>
          <p className="text-xs text-gray-500 mb-5">Current status distribution in CRM</p>

          <div className="space-y-4">
            {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((status) => {
              const count = leadStats.byStatus[status] || 0;
              const pct = leadStats.total > 0 ? (count / leadStats.total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{status}</span>
                    <span>
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'CONVERTED'
                          ? 'bg-emerald-500'
                          : status === 'QUALIFIED'
                          ? 'bg-purple-500'
                          : status === 'CONTACTED'
                          ? 'bg-amber-500'
                          : status === 'NEW'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opportunities by Stage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Pipeline by Stage (Live Data)
          </h3>
          <p className="text-xs text-gray-500 mb-5">Deal distribution across sales phases</p>

          <div className="space-y-4">
            {['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((stage) => {
              const count = oppStats.byStage[stage] || 0;
              const pct = oppStats.total > 0 ? (count / oppStats.total) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{stage}</span>
                    <span>
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stage === 'WON'
                          ? 'bg-emerald-500'
                          : stage === 'LOST'
                          ? 'bg-rose-400'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
