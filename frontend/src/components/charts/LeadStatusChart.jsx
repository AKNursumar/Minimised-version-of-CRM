import React from 'react';

export const LeadStatusChart = ({ data = {}, total = 0 }) => {
  const statusConfig = [
    { key: 'NEW', label: 'New', color: 'bg-blue-500', barBg: 'bg-blue-100', text: 'text-blue-700' },
    { key: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500', barBg: 'bg-amber-100', text: 'text-amber-700' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500', barBg: 'bg-purple-100', text: 'text-purple-700' },
    { key: 'CONVERTED', label: 'Converted', color: 'bg-emerald-500', barBg: 'bg-emerald-100', text: 'text-emerald-700' },
    { key: 'LOST', label: 'Lost', color: 'bg-rose-500', barBg: 'bg-rose-100', text: 'text-rose-700' },
  ];

  const totalLeads = total || Object.values(data).reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-3.5">
      {statusConfig.map((item) => {
        const count = data[item.key] || 0;
        const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center text-gray-700">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color} mr-2`} />
                {item.label}
              </span>
              <span className="text-gray-500">
                <span className="font-bold text-gray-900">{count}</span> ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeadStatusChart;
