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
  LogOut,
  Users,
  CheckSquare,
  FileSpreadsheet,
  ShieldAlert,
  X,
  Building,
  GraduationCap,
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

  const responsibilities = user?.responsibilities || [];
  const isHod = responsibilities.includes('HOD') || user?.role === 'HOD';
  const isAdvisor = responsibilities.includes('ADVISOR') || user?.role === 'ADVISOR';
  const isMentor = responsibilities.includes('MENTOR') || user?.role === 'MENTOR';

  const getStudentLinks = () => [
    { to: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { to: '/my-certificates', label: 'My Certificates', icon: Award },
    { to: '/student/od', label: 'On-Duty Applications', icon: CheckSquare },
    { to: '/upload', label: 'Submit Certificate', icon: Upload },
    { to: '/profile', label: 'Profile & Academics', icon: User },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const getStaffLinks = () => {
    const links: any[] = [
      { to: '/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
    ];

    if (isMentor) {
      links.push({ to: '/mentor/students', label: 'My Mentees Scope', icon: Users });
    }

    if (isAdvisor) {
      links.push({ to: '/advisor/students', label: 'My Class Scope', icon: GraduationCap });
    }

    if (isHod) {
      links.push({ to: '/hod/students', label: 'EEE Department Scope', icon: Building });
      links.push({ to: '/hod/reports', label: 'Department Reports', icon: FileSpreadsheet });
    }

    links.push({ to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount });
    return links;
  };

  const getCreatorLinks = () => [
    { to: '/dashboard', label: 'Creator Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'EEE Structure & Staff', icon: Building },
    { to: '/creator/workspace', label: 'Certificate Formats', icon: Award },
    { to: '/hod/reports', label: 'System Analytics', icon: FileSpreadsheet },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldAlert },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  let navItems = getStudentLinks();

  if (user?.role === 'STAFF' || user?.role === 'MENTOR' || user?.role === 'ADVISOR' || user?.role === 'HOD') {
    navItems = getStaffLinks();
  } else if (user?.role === 'ADMIN' || user?.role === 'CREATOR') {
    navItems = getCreatorLinks();
  }

  const roleLabel =
    user?.role === 'STUDENT'
      ? 'STUDENT'
      : user?.role === 'CREATOR' || user?.role === 'ADMIN'
      ? 'ADMIN / CREATOR'
      : responsibilities.length > 0
      ? `STAFF (${responsibilities.join(' • ')})`
      : 'STAFF';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl text-slate-800 select-none border-r border-slate-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-tight text-[#0a4c95] leading-tight uppercase flex items-center gap-1">
              <span>KSRCT EEE</span>
            </h2>
            <p className="text-[10px] text-[#f37021] font-black tracking-wider uppercase truncate max-w-[130px]">
              {roleLabel}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Account Info Banner */}
      <div className="mx-3.5 my-3.5 p-3 rounded-2xl bg-slate-50/90 backdrop-blur-md border border-slate-200/90 flex items-center gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
          <p className="text-[10px] text-[#0a4c95] font-semibold truncate mt-0.5">
            {user?.role === 'STUDENT'
              ? `Reg: ${user?.registerNumber || 'N/A'}`
              : 'Electrical & Electronics Engg'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#f37021] to-[#e05e0e] text-white shadow-md font-extrabold translate-x-1 border border-white/30'
                    : 'text-slate-800 font-extrabold hover:bg-slate-100 hover:text-[#0a4c95] hover:translate-x-0.5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-black bg-[#f37021] text-white rounded-full shadow-xs">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
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
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-screen sticky top-0 h-screen z-20 shadow-xs bg-white/80 backdrop-blur-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={onClose} />
          <div className="relative flex-1 max-w-xs w-full bg-white z-10 shadow-2xl animate-fade-in-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
