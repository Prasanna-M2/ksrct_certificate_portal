import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Eye, Plus, RefreshCw, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const MyCertificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates', {
        params: { search, category, status },
      });
      if (res.data && res.data.success) {
        setCertificates(res.data.certificates || []);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
            STUDENT CERTIFICATE SERVICES
          </span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">My Certificates Roster</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track multi-stage approval (Student → Mentor → Advisor → HOD) and view rejection remarks
          </p>
        </div>

        <Link
          to="/upload"
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-900" />
          <span>Submit New Certificate</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request ID, title, organization, or category..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full md:w-36 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="MENTOR_REVIEW">Mentor Review</option>
            <option value="ADVISOR_REVIEW">Advisor Review</option>
            <option value="HOD_REVIEW">HOD Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchCertificates}
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Title & Event</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading your certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No certificates found matching your criteria.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cert.certificateId || `CERT-${cert.id.substring(0, 6)}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      <div>{cert.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{cert.organization || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{cert.category}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {cert.issuedDate || cert.eventDate || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {cert.currentStage === 'MENTOR_REVIEW'
                        ? '● Mentor Review'
                        : cert.currentStage === 'ADVISOR_REVIEW'
                        ? '● Advisor Review'
                        : cert.currentStage === 'HOD_REVIEW'
                        ? '● HOD Review'
                        : '✓ Completed'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Timeline Modal */}
      {selectedCert && (
        <RequestDetailsModal
          isOpen={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
          request={selectedCert}
          requestType="CERTIFICATE"
          currentUser={{
            id: user?.id || '',
            role: user?.role || 'STUDENT',
            name: user?.name || '',
          }}
          onRefresh={fetchCertificates}
        />
      )}
    </div>
  );
};

export default MyCertificates;
