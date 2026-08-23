import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header, Sidebar, ToastContainer } from './components';

// Pages
import { Login } from './pages/Login';
import { PublicVerifyCertificate } from './pages/PublicVerifyCertificate';

// Role Dashboards
import { StudentDashboard } from './pages/student/Dashboard';
import { UploadCertificate } from './pages/student/UploadCertificate';
import { MyCertificates } from './pages/student/MyCertificates';
import { StudentProfile } from './pages/student/Profile';
import { StudentOdForm } from './pages/student/StudentOdForm';

// Unified Dynamic Staff Dashboard
import { StaffDashboard } from './pages/staff/StaffDashboard';

// HOD & Reports & Students Views
import { HodStudents } from './pages/hod/Students';
import { HodCertificates } from './pages/hod/Certificates';
import { HodReports } from './pages/hod/Reports';

import { CreatorWorkspace } from './pages/creator/CreatorWorkspace';
import { AdminPanel } from './pages/admin/AdminPanel';
import { Support } from './pages/Support';
import { NotificationsPage } from './pages/NotificationsPage';

const ProtectedLayout: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-300 font-semibold text-xs space-y-3">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p>Loading KSRCT EEE Department Student Management Portal...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'STUDENT':
        return <StudentDashboard />;
      case 'STAFF':
      case 'MENTOR':
      case 'ADVISOR':
      case 'HOD':
        return <StaffDashboard />;
      case 'ADMIN':
      case 'CREATOR':
        return <AdminPanel />;
      default:
        return <StaffDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9] font-sans text-slate-800 relative overflow-hidden">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Routes>
            {/* Main Dynamic Dashboard */}
            <Route path="/dashboard" element={renderRoleDashboard()} />

            {/* Student Specific Routes */}
            <Route path="/student/od" element={<StudentOdForm />} />
            <Route path="/upload" element={<UploadCertificate />} />
            <Route path="/my-certificates" element={<MyCertificates />} />
            <Route path="/profile" element={<StudentProfile />} />

            {/* Staff & Responsibilities Unified Routes */}
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/mentor/approvals" element={<StaffDashboard />} />
            <Route path="/mentor/certificates" element={<StaffDashboard />} />
            <Route path="/mentor/od" element={<StaffDashboard />} />
            <Route path="/mentor/students" element={<HodStudents />} />

            <Route path="/advisor/approvals" element={<StaffDashboard />} />
            <Route path="/advisor/certificates" element={<StaffDashboard />} />
            <Route path="/advisor/od" element={<StaffDashboard />} />
            <Route path="/advisor/students" element={<HodStudents />} />

            <Route path="/hod/pending" element={<StaffDashboard />} />
            <Route path="/hod/students" element={<HodStudents />} />
            <Route path="/hod/certificates" element={<HodCertificates />} />
            <Route path="/hod/reports" element={<HodReports />} />

            {/* Creator / Admin Routes */}
            <Route path="/creator/workspace" element={<CreatorWorkspace />} />
            <Route path="/admin/users" element={<AdminPanel />} />
            <Route path="/admin/audit-logs" element={<AdminPanel />} />

            {/* Common Routes */}
            <Route path="/support" element={<Support />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:code" element={<PublicVerifyCertificate />} />
            <Route path="/verify-certificate/:code" element={<PublicVerifyCertificate />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
