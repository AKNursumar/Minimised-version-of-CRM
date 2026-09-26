import React from 'react';

export const StatCard = ({ title, value, icon: Icon, change, trend = 'neutral', color = 'blue', loading = false }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded my-1" />
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-xs font-medium text-gray-500">
          <span
            className={`mr-1.5 font-semibold ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-rose-600'
                : 'text-gray-500'
            }`}
          >
            {change}
          </span>
          <span>from previous period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
