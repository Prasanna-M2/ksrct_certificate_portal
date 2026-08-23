import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  FileText,
  CheckSquare,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(false);
  const [certStats, setCertStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [odStats, setOdStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<{ item: any; type: 'CERTIFICATE' | 'OD' } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [certRes, odRes] = await Promise.all([
        api.get('/certificates/my'),
        api.get('/od/my'),
      ]);

      const certs = certRes.data?.data || [];
      const ods = odRes.data?.data || [];

      // Calculate Certificate Stats
      const cPending = certs.filter(
        (c: any) => c.status === 'SUBMITTED' || c.status === 'MENTOR_REVIEW' || c.status === 'ADVISOR_REVIEW' || c.status === 'HOD_REVIEW' || c.status === 'RESUBMITTED'
      ).length;
      const cApproved = certs.filter((c: any) => c.status === 'APPROVED' || c.status === 'ISSUED').length;
      const cRejected = certs.filter((c: any) => c.status === 'REJECTED').length;

      setCertStats({
        total: certs.length,
        pending: cPending,
        approved: cApproved,
        rejected: cRejected,
      });

      // Calculate OD Stats
      const odPending = ods.filter(
        (o: any) => o.status === 'SUBMITTED' || o.status === 'MENTOR_REVIEW' || o.status === 'ADVISOR_REVIEW' || o.status === 'HOD_REVIEW' || o.status === 'RESUBMITTED'
      ).length;
      const odApproved = ods.filter((o: any) => o.status === 'APPROVED').length;
      const odRejected = ods.filter((o: any) => o.status === 'REJECTED').length;

      setOdStats({
        total: ods.length,
        pending: odPending,
        approved: odApproved,
        rejected: odRejected,
      });

      // Combine and sort recent requests
      const combined = [
        ...certs.map((c: any) => ({
          id: c.id,
          requestId: c.certificateNumber || `CERT-${c.id.substring(0, 8)}`,
          title: c.title,
          type: 'CERTIFICATE' as const,
          categoryOrType: c.category || 'General',
          submittedDate: c.createdAt,
          currentStage: c.currentStage,
          status: c.status,
          originalItem: c,
        })),
        ...ods.map((o: any) => ({
          id: o.id,
          requestId: o.odNumber || `OD-${o.id.substring(0, 8)}`,
          title: o.eventName || `${o.reason || 'OD'} Application`,
          type: 'OD' as const,
          categoryOrType: o.category || 'Academic',
          submittedDate: o.createdAt,
          currentStage: o.currentStage,
          status: o.status,
          originalItem: o,
        })),
      ].sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

      setRecentRequests(combined.slice(0, 10));
    } catch (err: any) {
      showToast('Failed to load dashboard metrics. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-md bg-gradient-to-br from-[#0a4c95] via-[#083b74] to-[#041d3d] text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#f37021]/20 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-sky-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#ffa266]" />
              <span>DEPARTMENT OF ELECTRICAL & ELECTRONICS ENGINEERING</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome Back, {user?.name}! 👋
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-100 font-semibold pt-1">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5 text-[#ffa266]" />
                <span>{user?.department || 'EEE Department'}</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/15 border border-white/20 font-mono text-[#ffa266] font-bold">
                Reg No: {user?.registerNumber || '24EE042'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/15 border border-white/20">
                Year {user?.year || 'III'} • Section {user?.section || 'A'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all cursor-pointer hover:scale-105"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/student/od"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-[#0a4c95] bg-white hover:bg-slate-100 rounded-2xl shadow-sm transition-all cursor-pointer hover:scale-105"
            >
              <CheckSquare className="w-4 h-4 text-[#0a4c95]" />
              <span>Apply On-Duty</span>
            </Link>

            <Link
              to="/upload"
              className="glass-button-primary flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-2xl cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Certificate</span>
            </Link>
          </div>
        </div>
      </div>

      {/* My Academic Support Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0a4c95]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">My Academic Support Team</h2>
          </div>
          <Link to="/profile" className="text-xs font-bold text-[#f37021] hover:text-[#d8580d] transition-colors flex items-center gap-1">
            <span>Change / Update Profile</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Faculty Mentor</p>
              <p className="text-sm font-black text-slate-900">{user?.mentor?.name || 'Unassigned'}</p>
              <p className="text-xs text-slate-500">{user?.mentor?.email || 'Select via Profile setup'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0a4c95] border border-blue-100 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Class Advisor</p>
              <p className="text-sm font-black text-slate-900">{user?.advisor?.name || 'Unassigned'}</p>
              <p className="text-xs text-slate-500">{user?.advisor?.email || 'Year advisor'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards (Certificates + OD Applications) */}
      <div className="space-y-4">
        {/* Certificate Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Award className="w-4 h-4 text-[#f37021]" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Certificate Management</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{certStats.total}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Certificates</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0a4c95] border border-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-emerald-600">{certStats.approved}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved Certificates</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-[#f37021]">{certStats.pending}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-rose-600">{certStats.rejected}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Returned / Revision</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* OD Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <CheckSquare className="w-4 h-4 text-[#0a4c95]" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">On-Duty Applications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{odStats.total}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total OD Applied</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0a4c95] border border-blue-100 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-emerald-600">{odStats.approved}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved OD</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-[#f37021]">{odStats.pending}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending OD</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-rose-600">{odStats.rejected}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejected OD</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Recent Student Requests History</h2>
            <p className="text-xs text-slate-500">Track multi-stage approval (Student → Mentor → Advisor → HOD)</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold text-[#f37021] hover:text-[#d8580d] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Roster</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Service Type</th>
                <th className="py-3 px-3">Title / Details</th>
                <th className="py-3 px-3">Submitted Date</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                    Loading your request history...
                  </td>
                </tr>
              ) : recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                    No active requests found. Click Apply On-Duty or Submit Certificate above to start!
                  </td>
                </tr>
              ) : (
                recentRequests.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#f37021] bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                        {item.requestId}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border ${
                          item.type === 'CERTIFICATE'
                            ? 'bg-orange-50 text-[#f37021] border-orange-200'
                            : 'bg-sky-50 text-[#0a4c95] border-blue-200'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-bold">
                      <div>{item.title}</div>
                      <span className="text-[10px] text-slate-500 font-normal">{item.categoryOrType}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(item.submittedDate).toLocaleDateString()}
                    </td>
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
                        onClick={() => setSelectedRequest({ item: item.originalItem, type: item.type })}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0a4c95] hover:bg-[#125eb5] rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          requestType={selectedRequest.type}
          request={selectedRequest.item}
          currentUser={{
            id: user?.id || '',
            role: (user?.role || 'STUDENT') as any,
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

export default StudentDashboard;
