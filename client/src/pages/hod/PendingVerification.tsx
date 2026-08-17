import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CertificateViewerModal } from '../../components/common/CertificateViewerModal';
import { useNotification } from '../../context/NotificationContext';
import { CheckSquare, Search, Eye, RefreshCw } from 'lucide-react';

export const PendingVerification: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const { showToast } = useNotification();

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates', {
        params: { status: 'PENDING', search },
      });
      if (res.data && res.data.success) {
        setCertificates(res.data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending certificates:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: string) => {
    try {
      const res = await api.post(`/certificates/${id}/approve`);
      if (res.data.success) {
        showToast('Certificate approved successfully!', 'success');
        fetchPending();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve.', 'error');
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    try {
      const res = await api.post(`/certificates/${id}/reject`, { rejectionReason });
      if (res.data.success) {
        showToast('Certificate rejected with remarks.', 'warning');
        fetchPending();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-ksrct-orange" />
          <span>Pending Verification Queue</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review and verify uploaded certificates for your department
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, register number, certificate title..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>
        <button
          onClick={fetchPending}
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Certificate Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Uploaded At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading pending queue...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No pending certificates awaiting verification! 🎉
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{cert.student?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Reg: {cert.student?.registerNumber || 'N/A'} ({cert.student?.year} Year)
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">
                      {cert.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{cert.category}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(cert.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-lg shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-ksrct-orange" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewer & Verifier Modal */}
      {selectedCert && (
        <CertificateViewerModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
