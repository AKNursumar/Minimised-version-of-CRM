import React from 'react';
import { Menu, Search, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ title = 'Dashboard', onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        </div>
      </div>

      {/* Middle: Global Search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search leads, contacts, opportunities..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {currentUser?.first_name
                ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                : currentUser?.username || 'User'}
            </p>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              {currentUser?.role || 'Guest'}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center uppercase shrink-0 shadow-xs">
            {currentUser?.username ? currentUser.username.charAt(0) : 'U'}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition sm:hidden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
