import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mr-2.5" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mr-2.5" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mr-2.5" />,
    },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center justify-between p-4 max-w-md rounded-xl border shadow-lg ${currentStyle.bg} animate-in slide-in-from-bottom-5 duration-200`}
    >
      <div className="flex items-center">
        {currentStyle.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 p-1 rounded-md hover:bg-black/5 transition opacity-70 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
