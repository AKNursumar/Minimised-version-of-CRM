import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Contact2,
  TrendingUp,
  CalendarClock,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Shield,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', to: '/leads', icon: Users },
    { label: 'Contacts', to: '/contacts', icon: Contact2 },
    { label: 'Opportunities', to: '/opportunities', icon: TrendingUp },
    { label: 'Follow-ups', to: '/followups', icon: CalendarClock },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Admin',
          icon: Shield,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'MANAGER':
        return {
          label: 'Manager',
          icon: Briefcase,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'SALES_EXECUTIVE':
      default:
        return {
          label: 'Sales Executive',
          icon: UserCheck,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-base leading-tight block">
                Minimised CRM
              </span>
              <span className="text-[11px] text-gray-400 font-medium block">
                Small Business Suite
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="p-4 mx-3 my-3 bg-gray-50 border border-gray-200/80 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center uppercase shrink-0">
                {currentUser.username ? currentUser.username.slice(0, 2) : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentUser.first_name || currentUser.username}
                </p>
                <div className="flex items-center mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${roleInfo.color}`}
                  >
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
