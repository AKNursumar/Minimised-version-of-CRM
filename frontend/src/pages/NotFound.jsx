import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Building2 } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-md shadow-blue-500/30">
        <Building2 className="w-7 h-7" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-xs text-gray-500 mb-6">
          The CRM route you are attempting to visit does not exist or has been moved.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
