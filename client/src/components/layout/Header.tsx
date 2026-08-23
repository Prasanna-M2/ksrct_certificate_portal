import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getRoleDisplayName } from '../../utils/permissions';
import { Bell, Menu, User, LogOut, CheckCheck, HelpCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const responsibilities = user?.responsibilities || [];
  const staffRoleDisplay =
    user?.role === 'STAFF' && responsibilities.length > 0
      ? `Staff (${responsibilities.join(' • ')})`
      : getRoleDisplayName(user?.role);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="flex items-center justify-between px-4 lg:px-8 py-2.5">
        {/* Left: macOS dots, Mobile Toggle & Brand */}
        <div className="flex items-center gap-4">
          {/* Window dots */}
          <div className="hidden sm:flex items-center gap-1.5 pr-2 border-r border-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/15 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/15 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/15 shadow-xs" />
          </div>

          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 transition-transform group-hover:scale-105">
              <img
                src="/assets/ksrct-logo.png"
                alt="KSRCT Logo"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-black tracking-tight text-[#0a4c95] leading-none uppercase flex items-center gap-1.5">
                <span>K.S. Rangasamy</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#f37021]/15 text-[#f37021] border border-[#f37021]/30">AUTONOMOUS</span>
              </h1>
              <p className="text-[10px] text-[#f37021] font-extrabold uppercase mt-0.5 tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                <span>Department of EEE &bull; Tiruchengode</span>
              </p>
            </div>
          </Link>

          {title && (
            <div className="hidden md:flex items-center gap-2 pl-4 ml-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-700">{title}</span>
            </div>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Official Portal Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-[#f37021] bg-orange-50 border border-orange-200 rounded-full shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f37021]" />
            <span>KSRCT Glass Portal</span>
          </div>

          {/* Notification Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f37021] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-3 animate-scale-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#f37021]" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#f37021] text-white rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#f37021] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markAsRead(n.id)}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition-colors cursor-pointer ${
                          n.isRead
                            ? 'bg-slate-50 border-slate-100 text-slate-500'
                            : 'bg-orange-50/80 border-orange-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-xs">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs text-slate-400 font-medium">No recent notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/90 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white font-black text-xs flex items-center justify-center shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-[#f37021] font-semibold truncate max-w-[150px]">
                  {staffRoleDisplay}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 animate-scale-in">
                <div className="p-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
                  <div className="text-[10px] font-extrabold text-[#f37021] uppercase mt-1">
                    {staffRoleDisplay}
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-[#f37021]" />
                  <span>My Profile & Assignments</span>
                </Link>

                <Link
                  to="/support"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Support</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
