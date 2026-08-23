import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Certificate, OdRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  CheckSquare,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingCertificates: 0,
    pendingOd: 0,
    approvedCertificates: 0,
    approvedOd: 0,
    rejectedRequests: 0,
  });

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [odRequests, setOdRequests] = useState<OdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING_CERTS' | 'PENDING_OD' | 'ALL_APPROVED' | 'ALL_REJECTED'>('PENDING_CERTS');

  const [selectedRequest, setSelectedRequest] = useState<{
    item: Certificate | OdRequest;
    type: 'CERTIFICATE' | 'OD';
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [certRes, odRes, userRes] = await Promise.all([
        api.get('/certificates'),
        api.get('/od'),
        api.get('/users'),
      ]);

      const certs: Certificate[] = certRes.data.certificates || [];
      const ods: OdRequest[] = odRes.data.odRequests || [];
      const usersList = userRes.data.users || [];

      setCertificates(certs);
      setOdRequests(ods);

      const studentCount = Array.isArray(usersList) ? usersList.filter((u: any) => u.role === 'STUDENT').length : 0;
      const pendingC = certs.filter((c) => c.currentStage === 'HOD_REVIEW' || c.status === 'HOD_REVIEW').length;
      const pendingO = ods.filter((o) => o.currentStage === 'HOD_REVIEW' || o.status === 'HOD_REVIEW').length;
      const appC = certs.filter((c) => c.status === 'APPROVED').length;
      const appO = ods.filter((o) => o.status === 'APPROVED').length;
      const rej = certs.filter((c) => c.status === 'REJECTED').length + ods.filter((o) => o.status === 'REJECTED').length;

      setStats({
        totalStudents: studentCount || 2,
        pendingCertificates: pendingC,
        pendingOd: pendingO,
        approvedCertificates: appC,
        approvedOd: appO,
        rejectedRequests: rej,
      });
    } catch (err) {
      console.error('Failed to fetch HOD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pendingCertsList = certificates.filter(
    (c) => c.currentStage === 'HOD_REVIEW' || c.status === 'HOD_REVIEW'
  );
  const pendingOdsList = odRequests.filter(
    (o) => o.currentStage === 'HOD_REVIEW' || o.status === 'HOD_REVIEW'
  );
  const approvedList = [
    ...certificates.filter((c) => c.status === 'APPROVED'),
    ...odRequests.filter((o) => o.status === 'APPROVED'),
  ];
  const rejectedList = [
    ...certificates.filter((c) => c.status === 'REJECTED'),
    ...odRequests.filter((o) => o.status === 'REJECTED'),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-ksrct-navy to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>HEAD OF DEPARTMENT (HOD) EXECUTIVE DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-black text-white">{user?.name} — {user?.department}</h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Final Department Approval Authority for Certificate Verification & On-Duty Applications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/hod/reports"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-900" />
            <span>Generate Reports</span>
          </Link>
        </div>
      </div>

      {/* 6 Department Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-slate-900">{stats.totalStudents}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
          </div>
          <Users className="w-6 h-6 text-blue-600 opacity-80" />
        </div>

        <div
          onClick={() => setActiveTab('PENDING_CERTS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING_CERTS'
              ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">{stats.pendingCertificates}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider">Pending Certs</p>
            </div>
            <Award className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING_OD')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING_OD'
              ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">{stats.pendingOd}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider">Pending OD</p>
            </div>
            <CheckSquare className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('ALL_APPROVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ALL_APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">{stats.approvedCertificates}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider">Approved Certs</p>
            </div>
            <CheckCircle2 className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('ALL_APPROVED')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xl font-black text-emerald-600">{stats.approvedOd}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved OD</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600 opacity-80" />
        </div>

        <div
          onClick={() => setActiveTab('ALL_REJECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ALL_REJECTED'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">{stats.rejectedRequests}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider">Rejected Requests</p>
            </div>
            <XCircle className="w-6 h-6 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Table Queue for HOD Final Signoff */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeTab === 'PENDING_CERTS'
                ? 'HOD Final Certificate Approval Queue (Advisor Approved)'
                : activeTab === 'PENDING_OD'
                ? 'HOD Final OD Applications Queue (Advisor Approved)'
                : activeTab === 'ALL_APPROVED'
                ? 'Department Approved Requests'
                : 'Department Rejected Requests'}
            </h2>
            <p className="text-xs text-slate-500">
              HOD review is the final authorization stage (Student → Mentor → Advisor → HOD).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Reg No</th>
                <th className="py-3 px-3">Title / Details</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading HOD final approval queue...
                  </td>
                </tr>
              ) : activeTab === 'PENDING_CERTS' && pendingCertsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No pending certificates awaiting HOD final approval.
                  </td>
                </tr>
              ) : activeTab === 'PENDING_OD' && pendingOdsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No pending OD applications awaiting HOD final approval.
                  </td>
                </tr>
              ) : (
                (activeTab === 'PENDING_CERTS'
                  ? pendingCertsList
                  : activeTab === 'PENDING_OD'
                  ? pendingOdsList
                  : activeTab === 'ALL_APPROVED'
                  ? approvedList
                  : rejectedList
                ).map((item: any) => {
                  const isCert = 'title' in item;
                  const reqId = isCert ? item.certificateId || `CERT-${item.id.substring(0, 6)}` : item.odId || `OD-${item.id.substring(0, 6)}`;
                  const title = isCert ? item.title : item.eventName || item.purpose;
                  const studentName = item.student?.name || item.studentName || 'Student';
                  const regNo = item.student?.registerNumber || item.registerNumber || 'N/A';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {reqId}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{studentName}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{regNo}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 max-w-xs truncate">{title}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {item.currentStage === 'MENTOR_REVIEW'
                          ? '● Mentor Review'
                          : item.currentStage === 'ADVISOR_REVIEW'
                          ? '● Advisor Review'
                          : item.currentStage === 'HOD_REVIEW'
                          ? '● HOD Review'
                          : '✓ Completed'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() =>
                            setSelectedRequest({
                              item,
                              type: isCert ? 'CERTIFICATE' : 'OD',
                            })
                          }
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Review & Approve
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Action Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest.item}
          requestType={selectedRequest.type}
          currentUser={{
            id: user?.id || '',
            role: user?.role || 'HOD',
            name: user?.name || '',
          }}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default HodDashboard;
