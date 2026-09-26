import React from 'react';

export const PipelineStageChart = ({ data = {}, total = 0 }) => {
  const stages = [
    { key: 'NEW', label: 'New', color: 'bg-blue-500' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-500' },
    { key: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-500' },
    { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-purple-500' },
    { key: 'WON', label: 'Won', color: 'bg-emerald-500' },
    { key: 'LOST', label: 'Lost', color: 'bg-rose-400' },
  ];

  const totalOpps = total || Object.values(data).reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-4">
      {/* Visual Funnel Bar */}
      <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 shadow-2xs">
        {stages.map((stage) => {
          const count = data[stage.key] || 0;
          const pct = totalOpps > 0 ? (count / totalOpps) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={stage.key}
              title={`${stage.label}: ${count} (${Math.round(pct)}%)`}
              className={`${stage.color} h-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Grid of Stage metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {stages.map((stage) => {
          const count = data[stage.key] || 0;
          const pct = totalOpps > 0 ? Math.round((count / totalOpps) * 100) : 0;

          return (
            <div
              key={stage.key}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center hover:bg-white hover:border-gray-200 transition"
            >
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                <span className="text-[11px] font-semibold text-gray-600 truncate">{stage.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{count}</p>
              <span className="text-[10px] text-gray-400 font-medium">{pct}% of pipeline</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineStageChart;
