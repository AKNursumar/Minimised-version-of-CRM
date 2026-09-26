import React from 'react';

export const RevenueChart = ({ valueByStage = {}, totalValue = 0 }) => {
  const stageLabels = {
    NEW: 'New Deals',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal Sent',
    NEGOTIATION: 'In Negotiation',
    WON: 'Closed Won',
    LOST: 'Closed Lost',
  };

  const stageColors = {
    NEW: 'bg-blue-500',
    QUALIFIED: 'bg-indigo-500',
    PROPOSAL: 'bg-amber-500',
    NEGOTIATION: 'bg-purple-500',
    WON: 'bg-emerald-500',
    LOST: 'bg-rose-400',
  };

  const stages = Object.keys(stageLabels);
  const maxVal = Math.max(...Object.values(valueByStage), 1);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase">Total Pipeline Valuation</span>
        <span className="text-base font-bold text-gray-900">{formatCurrency(totalValue)}</span>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const val = valueByStage[stage] || 0;
          const widthPct = Math.round((val / maxVal) * 100);

          return (
            <div key={stage} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700">{stageLabels[stage]}</span>
                <span className="text-gray-900">{formatCurrency(val)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${stageColors[stage] || 'bg-blue-600'} transition-all duration-500`}
                  style={{ width: `${Math.max(widthPct, val > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueChart;
