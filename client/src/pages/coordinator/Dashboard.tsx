import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Certificate, CertificateStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CertificateViewerModal } from '../../components/common/CertificateViewerModal';
import { useNotification } from '../../context/NotificationContext';
import {
  CheckSquare,
  Award,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  pendingVerification: number;
  awaitingIssuance: number;
  issuedToday: number;
  totalApproved: number;
  totalRejected: number;
  totalCertificates: number;
}

export const CoordinatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalCert, setRejectionModalCert] = useState<Certificate | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { showToast } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, certsRes] = await Promise.all([
        api.get('/dashboard/coordinator'),
        api.get('/certificates'),
      ]);

      if (statsRes.data?.success && statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (certsRes.data?.success && Array.isArray(certsRes.data?.certificates)) {
        setCertificates(certsRes.data.certificates);
      }
    } catch (err: any) {
      console.error('Error fetching coordinator dashboard:', err);
      showToast('Failed to load coordinator verification queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/certificates/${id}/approve`);
      if (res.data?.success) {
        showToast('Certificate approved successfully!', 'success');
        fetchData();
        if (selectedCert?.id === id) setSelectedCert(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve certificate.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModalCert || !rejectionReason.trim()) {
      showToast('Please provide a reason for rejection or correction.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post(`/certificates/${rejectionModalCert.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        showToast('Certificate status updated with remarks.', 'warning');
        setRejectionModalCert(null);
        setRejectionReason('');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update certificate.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/certificates/${id}/issue`);
      if (res.data?.success) {
        const codeStr = res.data?.certificate?.certificateCode || id;
        showToast(`Certificate officially issued under code: ${codeStr}`, 'success');
        fetchData();
        if (selectedCert?.id === id) setSelectedCert(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to issue certificate.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCertificates = certificates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.student?.name && c.student.name.toLowerCase().includes(q)) ||
      (c.student?.registerNumber && c.student.registerNumber.toLowerCase().includes(q)) ||
      (c.certificateCode && c.certificateCode.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ksrct-navy">Certificate Coordinator Verification Queue</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review student certificate submissions, verify compliance, and perform official institutional issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Pending Verification</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats?.pendingVerification || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Awaiting Issuance</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats?.awaitingIssuance || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Issued Today</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-700">{stats?.issuedToday || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total System Record</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats?.totalCertificates || 0}</p>
        </div>
      </div>

      {/* Main Verification Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, title, code..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ksrct-navy"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksrct-navy"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ISSUED">Issued</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Verification Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Student Details</th>
                <th className="py-3.5 px-4">Certificate Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading verification queue...
                  </td>
                </tr>
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <Award className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold">No certificate submissions match criteria</p>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{cert.student?.name || 'Student'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {cert.student?.registerNumber || 'No Reg No'} • {cert.student?.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ksrct-navy">{cert.title}</div>
                      {cert.certificateCode && (
                        <div className="text-[10px] text-emerald-600 font-mono">Code: {cert.certificateCode}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg">
                        {cert.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(cert.uploadedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>

                      {(cert.status === 'PENDING' || cert.status === 'SUBMITTED' || cert.status === 'MENTOR_REVIEW') && (
                        <button
                          onClick={() => handleApprove(cert.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {cert.status === 'APPROVED' && (
                        <button
                          onClick={() => handleIssue(cert.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Issue Official</span>
                        </button>
                      )}

                      {cert.status !== 'APPROVED' && cert.status !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setRejectionModalCert(cert);
                            setRejectionReason('');
                          }}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Viewer Modal */}
      {selectedCert && (
        <CertificateViewerModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onApprove={() => handleApprove(selectedCert.id)}
          onReject={async (id, _reason) => {
            setRejectionModalCert(selectedCert);
            setSelectedCert(null);
          }}
        />
      )}

      {/* Rejection / Remarks Modal */}
      {rejectionModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Reject or Request Correction</h3>
            <p className="text-xs text-slate-500 font-medium">
              Please enter mandatory rejection remarks for student <strong>{rejectionModalCert.student?.name}</strong>.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document seal is blurry, please re-upload clear original copy."
              className="w-full h-28 p-3 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalCert(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md disabled:opacity-50"
              >
                Submit Rejection Remarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
