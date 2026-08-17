import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/student/Dashboard';
import { UploadCertificate } from './pages/student/UploadCertificate';
import { MyCertificates } from './pages/student/MyCertificates';
import { StudentProfile } from './pages/student/Profile';

import { HodDashboard } from './pages/hod/Dashboard';
import { PendingVerification } from './pages/hod/PendingVerification';
import { HodStudents } from './pages/hod/Students';
import { HodCertificates } from './pages/hod/Certificates';
import { HodReports } from './pages/hod/Reports';

import { AdminPanel } from './pages/admin/AdminPanel';
import { Support } from './pages/Support';
import { NotificationsPage } from './pages/NotificationsPage';

const ProtectedLayout: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
        Loading KSRCT Portal...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            {/* Dashboard Redirect based on Role */}
            <Route
              path="/dashboard"
              element={
                user.role === 'STUDENT' ? (
                  <StudentDashboard />
                ) : user.role === 'HOD' ? (
                  <HodDashboard />
                ) : (
                  <AdminPanel />
                )
              }
            />

            {/* Student Routes */}
            <Route path="/upload" element={<UploadCertificate />} />
            <Route path="/my-certificates" element={<MyCertificates />} />
            <Route path="/profile" element={<StudentProfile />} />

            {/* HOD / Verifier Routes */}
            <Route path="/hod/pending" element={<PendingVerification />} />
            <Route path="/hod/students" element={<HodStudents />} />
            <Route path="/hod/certificates" element={<HodCertificates />} />
            <Route path="/hod/reports" element={<HodReports />} />

            {/* Admin Routes */}
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
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
