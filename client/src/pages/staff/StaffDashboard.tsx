import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import { Certificate, OdRequest, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';
import {
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Building,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const responsibilities = user?.responsibilities || [];
  const isHod = responsibilities.includes('HOD') || user?.role === 'HOD';
  const isAdvisor = responsibilities.includes('ADVISOR') || user?.role === 'ADVISOR';
  const isMentor = responsibilities.includes('MENTOR') || user?.role === 'MENTOR';

  // Active module tab: 'OVERVIEW' | 'MENTOR' | 'ADVISOR' | 'HOD' | 'APPROVALS' | 'STUDENTS'
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isHod) return 'HOD';
    if (isAdvisor) return 'ADVISOR';
    if (isMentor) return 'MENTOR';
    return 'APPROVALS';
  });

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  // Data lists
  const [pendingCertificates, setPendingCertificates] = useState<Certificate[]>([]);
  const [pendingOdRequests, setPendingOdRequests] = useState<OdRequest[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Filters for Students Monitoring Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<{ type: 'CERTIFICATE' | 'OD'; item: any } | null>(null);
  const [approvalModalItem, setApprovalModalItem] = useState<{ type: 'CERTIFICATE' | 'OD'; item: any; isReject?: boolean } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [viewStudentModal, setViewStudentModal] = useState<User | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, certsRes, odRes, studentsRes] = await Promise.all([
        api.get('/dashboard/staff'),
        api.get('/certificates?limit=50'),
        api.get('/od?limit=50'),
        api.get('/users?limit=100'),
      ]);

      if (dashRes.data?.success) {
        setStatsData(dashRes.data);
      }
      if (certsRes.data?.success) {
        setPendingCertificates(certsRes.data.certificates || []);
      }
      if (odRes.data?.success) {
        setPendingOdRequests(odRes.data.odRequests || []);
      }
      if (studentsRes.data?.success) {
        setStudentsList(studentsRes.data.users || []);
      }
    } catch (err: any) {
      console.error('Failed to load staff dashboard', err);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async () => {
    if (!approvalModalItem) return;
    try {
      setActionSubmitting(true);
      const endpoint = approvalModalItem.type === 'CERTIFICATE'
        ? `/certificates/${approvalModalItem.item.id}/approve`
        : `/od/${approvalModalItem.item.id}/approve`;

      const res = await api.post(endpoint, { remarks: actionRemarks || 'Approved' });
      if (res.data?.success) {
        showToast(res.data.message || 'Approved successfully!', 'success');
        setApprovalModalItem(null);
        setActionRemarks('');
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!approvalModalItem) return;
    if (!actionRemarks || actionRemarks.trim() === '') {
      showToast('Rejection reason is mandatory.', 'error');
      return;
    }
    try {
      setActionSubmitting(true);
      const endpoint = approvalModalItem.type === 'CERTIFICATE'
        ? `/certificates/${approvalModalItem.item.id}/reject`
        : `/od/${approvalModalItem.item.id}/reject`;

      const res = await api.post(endpoint, { remarks: actionRemarks.trim(), reason: actionRemarks.trim() });
      if (res.data?.success) {
        showToast(res.data.message || 'Request rejected.', 'success');
        setApprovalModalItem(null);
        setActionRemarks('');
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Rejection failed.', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = studentsList.filter((s) => {
    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
    if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchReg = s.registerNumber?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Staff Portal</h1>
            <span className="text-xs px-3 py-0.5 rounded-full bg-slate-100 text-[#0a4c95] font-bold border border-slate-200">
              {user?.name}
            </span>
            {isMentor && (
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-blue-50 text-[#0a4c95] font-bold border border-blue-200">
                Mentor
              </span>
            )}
            {isAdvisor && (
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-orange-50 text-[#f37021] font-bold border border-orange-200">
                Class Advisor {user?.advisorAssignments?.map(a => `(Year ${a.year})`).join(', ') || ''}
              </span>
            )}
            {isHod && (
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Head of Department (HOD)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Department of Electrical & Electronics Engineering — Active Responsibilities & Approval Queues
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all cursor-pointer hover:scale-105 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Dynamic Module Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {isMentor && (
          <button
            onClick={() => setActiveTab('MENTOR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
              activeTab === 'MENTOR'
                ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
                : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Mentees Scope</span>
            {statsData?.mentorStats?.pendingApprovals > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#f37021] text-white font-black shadow-xs">
                {statsData.mentorStats.pendingApprovals}
              </span>
            )}
          </button>
        )}

        {isAdvisor && (
          <button
            onClick={() => setActiveTab('ADVISOR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
              activeTab === 'ADVISOR'
                ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
                : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>My Class Scope</span>
            {statsData?.advisorStats?.pendingApprovals > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#f37021] text-white font-black shadow-xs">
                {statsData.advisorStats.pendingApprovals}
              </span>
            )}
          </button>
        )}

        {isHod && (
          <button
            onClick={() => setActiveTab('HOD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
              activeTab === 'HOD'
                ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
                : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>EEE Department Scope</span>
            {statsData?.hodStats?.pendingApprovals > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#f37021] text-white font-black shadow-xs">
                {statsData.hodStats.pendingApprovals}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'APPROVALS'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'STUDENTS'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Monitoring</span>
        </button>
      </div>

      {/* MENTOR SCOPE VIEW */}
      {activeTab === 'MENTOR' && isMentor && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Mentees</p>
                <p className="text-2xl font-black text-white mt-1">
                  {statsData?.mentorStats?.totalMentees || 0} / {user?.mentorCapacity || 6}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Capacity: {user?.mentorCapacity || 6} slots</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Mentor Review Pending</p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {statsData?.mentorStats?.pendingApprovals || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {statsData?.mentorStats?.pendingCertificates || 0} Certs • {statsData?.mentorStats?.pendingOd || 0} OD
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Approved Requests</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {statsData?.mentorStats?.approvedCertificates || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Mentee credentials verified</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Returned Requests</p>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {statsData?.mentorStats?.rejectedCertificates || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Returned for revision</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Assigned Mentees Table */}
          <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">My Assigned Mentees Cohort</h3>
                <p className="text-xs text-slate-400">Mentorship cohort assigned to you</p>
              </div>
              <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                {statsData?.mentorStats?.mentees?.length || 0} Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Register No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Year / Sec</th>
                    <th className="py-3 px-4">Certificates</th>
                    <th className="py-3 px-4">OD Requests</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                  {statsData?.mentorStats?.mentees?.length > 0 ? (
                    statsData.mentorStats.mentees.map((mentee: any) => (
                      <tr key={mentee.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">{mentee.registerNumber || 'N/A'}</td>
                        <td className="py-3 px-4 font-bold text-white">{mentee.name}</td>
                        <td className="py-3 px-4">{mentee.year ? `Year ${mentee.year}` : '-'} ({mentee.section || 'A'})</td>
                        <td className="py-3 px-4">{mentee._count?.certificates || 0} submitted</td>
                        <td className="py-3 px-4">{mentee._count?.odRequests || 0} applied</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              const fullStudent = studentsList.find((s) => s.id === mentee.id) || mentee;
                              setViewStudentModal(fullStudent);
                            }}
                            className="px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                        No mentees currently assigned to your account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADVISOR SCOPE VIEW */}
      {activeTab === 'ADVISOR' && isAdvisor && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Class Students</p>
                <p className="text-2xl font-black text-white mt-1">
                  {statsData?.advisorStats?.totalClassStudents || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Years: {statsData?.advisorStats?.advisoryYears?.join(', ') || 'Assigned Class'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Advisor Review Pending</p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {statsData?.advisorStats?.pendingApprovals || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {statsData?.advisorStats?.pendingCertificates || 0} Certs • {statsData?.advisorStats?.pendingOd || 0} OD
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Class Approved</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {statsData?.advisorStats?.approvedCertificates || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total class verified</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Class Returned</p>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {statsData?.advisorStats?.rejectedCertificates || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Rejected requests</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOD SCOPE VIEW */}
      {activeTab === 'HOD' && isHod && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total EEE Students</p>
                <p className="text-2xl font-black text-white mt-1">
                  {statsData?.hodStats?.totalStudents || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Entire department cohort</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Final HOD Review</p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {statsData?.hodStats?.pendingApprovals || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {statsData?.hodStats?.pendingCertificates || 0} Certs • {statsData?.hodStats?.pendingOd || 0} OD
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Department Approved</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {statsData?.hodStats?.approvedCertificates || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Final verified credentials</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Total Rejected</p>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {statsData?.hodStats?.rejectedRequests || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Returned across all stages</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Year-wise Distribution Grid */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white">EEE Department Year-wise Cohort</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl glass-card text-center border border-white/10">
                <p className="text-xs font-bold text-slate-400">1st Year (I EEE)</p>
                <p className="text-2xl font-black text-white mt-1">{statsData?.hodStats?.yearDistribution?.year1 || 0}</p>
              </div>
              <div className="p-4 rounded-2xl glass-card text-center border border-white/10">
                <p className="text-xs font-bold text-slate-400">2nd Year (II EEE)</p>
                <p className="text-2xl font-black text-white mt-1">{statsData?.hodStats?.yearDistribution?.year2 || 0}</p>
              </div>
              <div className="p-4 rounded-2xl glass-card text-center border border-white/10">
                <p className="text-xs font-bold text-slate-400">3rd Year (III EEE)</p>
                <p className="text-2xl font-black text-white mt-1">{statsData?.hodStats?.yearDistribution?.year3 || 0}</p>
              </div>
              <div className="p-4 rounded-2xl glass-card text-center border border-white/10">
                <p className="text-xs font-bold text-slate-400">4th Year (IV EEE)</p>
                <p className="text-2xl font-black text-white mt-1">{statsData?.hodStats?.yearDistribution?.year4 || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS QUEUE (CERTIFICATES & OD) */}
      {(activeTab === 'APPROVALS' || activeTab === 'MENTOR' || activeTab === 'ADVISOR' || activeTab === 'HOD') && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Pending Approvals Queue</h3>
                <p className="text-xs text-slate-400">Requests requiring your review based on active responsibilities</p>
              </div>
              <span className="text-xs font-extrabold bg-amber-500/15 text-amber-300 px-3.5 py-1 rounded-full border border-amber-500/30">
                {pendingCertificates.filter(c => c.status !== 'APPROVED' && c.status !== 'REJECTED').length +
                 pendingOdRequests.filter(o => o.status !== 'APPROVED' && o.status !== 'REJECTED').length} Pending
              </span>
            </div>

            {/* Certificates Sub-Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Certificate Requests</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-bold border border-white/10 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Cert ID</th>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Category & Title</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {pendingCertificates.filter(c => c.status !== 'APPROVED' && c.status !== 'REJECTED').length > 0 ? (
                      pendingCertificates
                        .filter(c => c.status !== 'APPROVED' && c.status !== 'REJECTED')
                        .map((cert) => (
                          <tr key={cert.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-amber-300">{cert.certificateId}</td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{cert.student?.name}</p>
                              <p className="text-[11px] text-slate-400">{cert.student?.registerNumber || 'Student'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{cert.title}</p>
                              <p className="text-[11px] text-slate-400">{cert.category} • {cert.organization || 'N/A'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                                {cert.currentStage?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={cert.status} />
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              <button
                                onClick={() => setSelectedRequest({ type: 'CERTIFICATE', item: cert })}
                                className="px-3 py-1 text-xs font-bold text-slate-200 glass-card rounded-xl hover:bg-white/15"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setApprovalModalItem({ type: 'CERTIFICATE', item: cert, isReject: false })}
                                className="px-3 py-1 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-glow-emerald cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setApprovalModalItem({ type: 'CERTIFICATE', item: cert, isReject: true })}
                                className="px-3 py-1 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No pending certificate requests in your current queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OD Requests Sub-Section */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">On-Duty (OD) Requests</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-bold border border-white/10 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">OD ID</th>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Event & Purpose</th>
                      <th className="py-2.5 px-3">Date & Days</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {pendingOdRequests.filter(o => o.status !== 'APPROVED' && o.status !== 'REJECTED').length > 0 ? (
                      pendingOdRequests
                        .filter(o => o.status !== 'APPROVED' && o.status !== 'REJECTED')
                        .map((od) => (
                          <tr key={od.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-amber-300">{od.odId}</td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{od.studentName}</p>
                              <p className="text-[11px] text-slate-400">{od.registerNumber || 'Student'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{od.eventName}</p>
                              <p className="text-[11px] text-slate-400">{od.purpose || od.eventType}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-white font-bold">{od.odDate}</p>
                              <p className="text-[11px] text-slate-400">{od.numberOfDays} day(s)</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                                {od.currentStage?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={od.status} />
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              <button
                                onClick={() => setSelectedRequest({ type: 'OD', item: od })}
                                className="px-3 py-1 text-xs font-bold text-slate-200 glass-card rounded-xl hover:bg-white/15"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setApprovalModalItem({ type: 'OD', item: od, isReject: false })}
                                className="px-3 py-1 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-glow-emerald cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setApprovalModalItem({ type: 'OD', item: od, isReject: true })}
                                className="px-3 py-1 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500">
                          No pending OD requests in your current queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MONITORING TABLE VIEW */}
      {activeTab === 'STUDENTS' && (
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white">Student Monitoring Interface</h3>
              <p className="text-xs text-slate-400">Filter and view students within your monitoring scope</p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student / reg no..."
                  className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl glass-input"
                />
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl glass-input cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Years</option>
                <option value="I" className="bg-slate-900 text-white">1st Year (I)</option>
                <option value="II" className="bg-slate-900 text-white">2nd Year (II)</option>
                <option value="III" className="bg-slate-900 text-white">3rd Year (III)</option>
                <option value="IV" className="bg-slate-900 text-white">4th Year (IV)</option>
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl glass-input cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Sections</option>
                <option value="A" className="bg-slate-900 text-white">Section A</option>
                <option value="B" className="bg-slate-900 text-white">Section B</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold border-y border-white/10 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Year & Sec</th>
                  <th className="py-3 px-4">Mentor</th>
                  <th className="py-3 px-4">Advisor</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">{st.registerNumber || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-white">{st.name}</td>
                      <td className="py-3 px-4">Year {st.year || '-'} ({st.section || 'A'})</td>
                      <td className="py-3 px-4 text-slate-300">{st.mentor?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-slate-300">{st.advisor?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {st._count?.certificates || 0} Certs • {st._count?.odRequests || 0} OD
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewStudentModal(st)}
                          className="px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No students found matching current filters or within your scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVAL / REJECTION MODAL */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                {approvalModalItem.isReject ? (
                  <XCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-black text-white">
                  {approvalModalItem.isReject ? 'Reject Request with Reason' : 'Confirm Request Approval'}
                </h3>
              </div>
              <button
                onClick={() => setApprovalModalItem(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 glass-card rounded-2xl text-xs space-y-1">
              <p className="font-bold text-white">
                {approvalModalItem.type === 'CERTIFICATE'
                  ? approvalModalItem.item.title
                  : approvalModalItem.item.eventName}
              </p>
              <p className="text-slate-400">
                ID: {approvalModalItem.item.certificateId || approvalModalItem.item.odId} • Student: {approvalModalItem.item.student?.name || approvalModalItem.item.studentName}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {approvalModalItem.isReject ? 'Mandatory Rejection Remarks / Reason *' : 'Approval Remarks (Optional)'}
              </label>
              <textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={
                  approvalModalItem.isReject
                    ? 'State specific correction needed (e.g., certificate issue date is missing)...'
                    : 'Add any remarks or notes...'
                }
                rows={3}
                className="w-full p-3 text-xs font-medium rounded-2xl glass-input"
                required={approvalModalItem.isReject}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting || (approvalModalItem.isReject && !actionRemarks.trim())}
                onClick={approvalModalItem.isReject ? handleReject : handleApprove}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                  approvalModalItem.isReject
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-glow-emerald'
                }`}
              >
                {actionSubmitting ? 'Processing...' : approvalModalItem.isReject ? 'Confirm Rejection' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE VIEW MODAL */}
      {viewStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Student Academic Profile</h3>
              </div>
              <button
                onClick={() => setViewStudentModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-glow-gold">
                  {viewStudentModal.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{viewStudentModal.name}</h4>
                  <p className="font-mono text-amber-300 font-bold">{viewStudentModal.registerNumber || 'N/A'}</p>
                  <p className="text-slate-400">Year {viewStudentModal.year || '-'} • Section {viewStudentModal.section || 'A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 glass-card rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Faculty Mentor</p>
                  <p className="text-xs font-black text-white mt-1">{viewStudentModal.mentor?.name || 'Not assigned'}</p>
                </div>
                <div className="p-3.5 glass-card rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Class Advisor</p>
                  <p className="text-xs font-black text-white mt-1">{viewStudentModal.advisor?.name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{viewStudentModal.email}</span>
                </div>
                {viewStudentModal.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{viewStudentModal.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewStudentModal(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST DETAILS MODAL (CERTIFICATE / OD) */}
      {selectedRequest && (
        <RequestDetailsModal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          requestType={selectedRequest.type}
          request={selectedRequest.item}
          currentUser={{
            id: user?.id || '',
            role: (user?.role || 'STAFF') as any,
            name: user?.name || '',
          }}
          onRefresh={() => {
            setSelectedRequest(null);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
