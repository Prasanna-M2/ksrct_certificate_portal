import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CertificateViewerModal } from '../../components/common/CertificateViewerModal';
import { Award, Search, Filter, Eye, Download, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'NPTEL',
  'Internship',
  'Workshop',
  'Hackathon',
  'NSS',
  'NCC',
  'Sports',
  'Technical',
  'Academic',
  'Certification',
  'Other',
];

export const HodCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates', {
        params: { search, category, status },
      });
      if (res.data.success) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDownload = (cert: Certificate) => {
    const fileUrl = `/api/certificates/${cert.id}/file`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = cert.fileName || `${cert.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-ksrct-navy" />
          <span>Department Certificates</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Browse and manage all student certificate records
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by certificate title, student name, register number..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full md:w-36 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchCertificates}
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No certificates found matching your query.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{cert.student?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Reg: {cert.student?.registerNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">
                      {cert.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{cert.category}</td>
                    <td className="py-3.5 px-4 text-slate-500">{cert.issuedDate}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-2 text-slate-600 hover:text-ksrct-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(cert)}
                          className="p-2 text-slate-600 hover:text-ksrct-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewer Modal */}
      {selectedCert && (
        <CertificateViewerModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};
