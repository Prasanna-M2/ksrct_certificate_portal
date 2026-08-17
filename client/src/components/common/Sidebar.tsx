import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Award,
  Upload,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Users,
  CheckSquare,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStudentLinks = () => [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-certificates', label: 'My Certificates', icon: Award },
    { to: '/upload', label: 'Upload Certificate', icon: Upload },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/support', label: 'Help & Support', icon: HelpCircle },
  ];

  const getHodLinks = () => [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hod/pending', label: 'Pending Verification', icon: CheckSquare },
    { to: '/hod/students', label: 'Students', icon: Users },
    { to: '/hod/certificates', label: 'Certificates', icon: Award },
    { to: '/hod/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/support', label: 'Help & Support', icon: HelpCircle },
  ];

  const getAdminLinks = () => [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/hod/certificates', label: 'All Certificates', icon: Award },
    { to: '/hod/reports', label: 'System Reports', icon: FileSpreadsheet },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/support', label: 'Support Tickets', icon: HelpCircle },
  ];

  const navItems =
    user?.role === 'STUDENT'
      ? getStudentLinks()
      : user?.role === 'HOD'
      ? getHodLinks()
      : getAdminLinks();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-ksrct-navy text-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-ksrct-navyLight flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              KSRCT PORTAL
            </h2>
            <p className="text-[11px] text-ksrct-orange font-semibold tracking-wide uppercase">
              {user?.role} PANEL
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-ksrct-navyLight rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Student/HOD Info Banner */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-ksrct-navyLight/60 border border-ksrct-navyLight flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ksrct-orange text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
          {user?.name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <p className="text-[11px] text-slate-300 truncate">
            {user?.role === 'STUDENT' ? `Reg: ${user?.registerNumber || 'N/A'}` : user?.department}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-ksrct-orange text-white shadow-md shadow-ksrct-orange/20 font-bold'
                    : 'text-slate-300 hover:bg-ksrct-navyLight hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-white text-ksrct-navy rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-ksrct-navyLight">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-screen sticky top-0 h-screen z-20 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative flex-1 max-w-xs w-full bg-ksrct-navy z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
