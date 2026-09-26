import React from 'react';
import {
  Shield,
  User,
  Key,
  Database,
  Server,
  Layers,
  CheckCircle,
  XCircle,
  Building,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { currentUser } = useAuth();

  const permissionsMatrix = [
    { module: 'User Management (/api/users/)', admin: true, manager: false, sales: false },
    { module: 'View All Leads & Deals', admin: true, manager: true, sales: false },
    { module: 'Assigned Leads & Deals', admin: true, manager: true, sales: true },
    { module: 'Contacts Management', admin: true, manager: true, sales: true },
    { module: 'Follow-ups & Scheduling', admin: true, manager: true, sales: true },
    { module: 'Performance Reports & Analytics', admin: true, manager: true, sales: false },
  ];

  return (
    <MainLayout title="Settings & User Role Permissions">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">System & Account Settings</h2>
          <p className="text-xs text-gray-500 mt-1">
            Authenticated session details and Role-Based Access Control (RBAC) permissions
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center uppercase shadow-xs">
              {currentUser?.username ? currentUser.username.slice(0, 2) : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {currentUser?.first_name
                  ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                  : currentUser?.username}
              </h3>
              <p className="text-xs text-gray-500">{currentUser?.email || 'No email provided'}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Role: {currentUser?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-gray-500 uppercase">Username</span>
              <p className="text-gray-900 font-medium text-sm mt-0.5">{currentUser?.username}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase">System ID</span>
              <p className="text-gray-900 font-medium text-sm mt-0.5">#{currentUser?.id}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase">Authentication Mode</span>
              <p className="text-gray-900 font-medium text-sm mt-0.5">
                JWT (JSON Web Token with Access & Refresh tokens)
              </p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase">Access Status</span>
              <p className="text-emerald-600 font-semibold text-sm mt-0.5">Active Session</p>
            </div>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Permissions enforced by Django REST Framework backend and mirrored in the React frontend
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">CRM Module</th>
                  <th className="px-5 py-3 text-center">ADMIN</th>
                  <th className="px-5 py-3 text-center">MANAGER</th>
                  <th className="px-5 py-3 text-center">SALES_EXECUTIVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissionsMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 text-xs">
                      {row.module}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.admin ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.manager ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.sales ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Architecture Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Architecture & Stack</h3>
          <p className="text-xs text-gray-500 mb-4">
            Minimised CRM Week 5 Full-Stack Implementation
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200/80">
              <div className="flex items-center space-x-2 text-gray-900 font-semibold mb-1">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Backend API</span>
              </div>
              <p className="text-gray-500">
                Django 6.0, Django REST Framework, SimpleJWT authentication, SQLite / PostgreSQL
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200/80">
              <div className="flex items-center space-x-2 text-gray-900 font-semibold mb-1">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Frontend Client</span>
              </div>
              <p className="text-gray-500">
                React 19, Vite 8, React Router DOM, Axios interceptors, Tailwind CSS v4
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
