import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export const FollowupStatusChart = ({ data = {}, total = 0 }) => {
  const pending = data.PENDING || 0;
  const completed = data.COMPLETED || 0;
  const cancelled = data.CANCELLED || 0;
  const totalFollowups = total || pending + completed + cancelled;

  const completedPct = totalFollowups > 0 ? Math.round((completed / totalFollowups) * 100) : 0;
  const pendingPct = totalFollowups > 0 ? Math.round((pending / totalFollowups) * 100) : 0;
  const cancelledPct = totalFollowups > 0 ? Math.round((cancelled / totalFollowups) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
        <div
          title={`Completed: ${completed} (${completedPct}%)`}
          className="bg-emerald-500 h-full transition-all duration-500"
          style={{ width: `${completedPct}%` }}
        />
        <div
          title={`Pending: ${pending} (${pendingPct}%)`}
          className="bg-amber-500 h-full transition-all duration-500"
          style={{ width: `${pendingPct}%` }}
        />
        <div
          title={`Cancelled: ${cancelled} (${cancelledPct}%)`}
          className="bg-rose-400 h-full transition-all duration-500"
          style={{ width: `${cancelledPct}%` }}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            <span className="text-xs font-semibold">Done</span>
          </div>
          <p className="text-lg font-bold text-emerald-900">{completed}</p>
          <span className="text-[10px] text-emerald-600 font-medium">{completedPct}%</span>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
          <div className="flex items-center justify-center text-amber-600 mb-1">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs font-semibold">Pending</span>
          </div>
          <p className="text-lg font-bold text-amber-900">{pending}</p>
          <span className="text-[10px] text-amber-600 font-medium">{pendingPct}%</span>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-center">
          <div className="flex items-center justify-center text-rose-600 mb-1">
            <XCircle className="w-4 h-4 mr-1" />
            <span className="text-xs font-semibold">Cancelled</span>
          </div>
          <p className="text-lg font-bold text-rose-900">{cancelled}</p>
          <span className="text-[10px] text-rose-600 font-medium">{cancelledPct}%</span>
        </div>
      </div>
    </div>
  );
};

export default FollowupStatusChart;
