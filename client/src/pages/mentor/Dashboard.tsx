import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Certificate, OdRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  CheckSquare,
  Eye,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [odRequests, setOdRequests] = useState<OdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING_CERTS' | 'PENDING_OD' | 'RECENT_APPROVED' | 'RECENT_REJECTED'>('PENDING_CERTS');
  const [search, setSearch] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<{
    item: Certificate | OdRequest;
    type: 'CERTIFICATE' | 'OD';
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certRes, odRes] = await Promise.all([
        api.get('/certificates'),
        api.get('/od'),
      ]);

      if (certRes.data.success) {
        setCertificates(certRes.data.certificates || []);
      }
      if (odRes.data.success) {
        setOdRequests(odRes.data.odRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch Mentor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests for Mentor stage
  const pendingCerts = certificates.filter(
    (c) => c.currentStage === 'MENTOR_REVIEW' || c.status === 'SUBMITTED' || c.status === 'RESUBMITTED'
  );
  const pendingOds = odRequests.filter(
    (o) => o.currentStage === 'MENTOR_REVIEW' || o.status === 'SUBMITTED' || o.status === 'RESUBMITTED'
  );
  const recentApproved = [
    ...certificates.filter((c) => c.currentStage === 'ADVISOR_REVIEW' || c.currentStage === 'HOD_REVIEW' || c.status === 'APPROVED'),
    ...odRequests.filter((o) => o.currentStage === 'ADVISOR_REVIEW' || o.currentStage === 'HOD_REVIEW' || o.status === 'APPROVED'),
  ];
  const recentRejected = [
    ...certificates.filter((c) => c.status === 'REJECTED'),
    ...odRequests.filter((o) => o.status === 'REJECTED'),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-ksrct-navy to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FACULTY MENTOR DASHBOARD — LEVEL 1 APPROVAL AUTHORITY</span>
          </div>
          <h1 className="text-2xl font-black text-white">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Reviewing certificates & OD applications submitted by assigned students in {user?.department}.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('PENDING_CERTS')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING_CERTS'
              ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{pendingCerts.length}</p>
              <p className="text-xs uppercase font-bold tracking-wider mt-0.5">Pending Certificates</p>
            </div>
            <Award className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING_OD')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING_OD'
              ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{pendingOds.length}</p>
              <p className="text-xs uppercase font-bold tracking-wider mt-0.5">Pending OD Requests</p>
            </div>
            <CheckSquare className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('RECENT_APPROVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'RECENT_APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{recentApproved.length}</p>
              <p className="text-xs uppercase font-bold tracking-wider mt-0.5">Approved & Forwarded</p>
            </div>
            <CheckCircle2 className="w-6 h-6 opacity-80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('RECENT_REJECTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'RECENT_REJECTED'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md font-bold'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{recentRejected.length}</p>
              <p className="text-xs uppercase font-bold tracking-wider mt-0.5">Rejected Requests</p>
            </div>
            <XCircle className="w-6 h-6 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Review Section Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeTab === 'PENDING_CERTS'
                ? 'Pending Certificate Approvals Queue'
                : activeTab === 'PENDING_OD'
                ? 'Pending On-Duty (OD) Applications Queue'
                : activeTab === 'RECENT_APPROVED'
                ? 'Recently Approved Requests'
                : 'Recently Rejected Requests'}
            </h2>
            <p className="text-xs text-slate-500">
              Review details → Verify credentials → Approve to forward to Class Advisor
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name or request..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Reg No & Dept</th>
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
                    Loading requests...
                  </td>
                </tr>
              ) : activeTab === 'PENDING_CERTS' && pendingCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No pending certificates awaiting Mentor review.
                  </td>
                </tr>
              ) : activeTab === 'PENDING_OD' && pendingOds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No pending OD applications awaiting Mentor review.
                  </td>
                </tr>
              ) : (
                (activeTab === 'PENDING_CERTS'
                  ? pendingCerts
                  : activeTab === 'PENDING_OD'
                  ? pendingOds
                  : activeTab === 'RECENT_APPROVED'
                  ? recentApproved
                  : recentRejected
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
                          <Eye className="w-3.5 h-3.5 mr-1" /> View & Review
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
            role: user?.role || 'MENTOR',
            name: user?.name || '',
          }}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default MentorDashboard;
