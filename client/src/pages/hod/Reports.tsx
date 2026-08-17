import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileSpreadsheet, Download, Printer, Filter, Search, RefreshCw } from 'lucide-react';

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

export const HodReports: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates', {
        params: { category, status, search, limit: 100 },
      });
      if (res.data && res.data.success) {
        setCertificates(res.data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  }, [category, status, search]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (certificates.length === 0) return;

    const headers = [
      'Certificate ID',
      'Student Name',
      'Register Number',
      'Department',
      'Title',
      'Category',
      'Issued Date',
      'Uploaded Date',
      'Status',
      'Verified By',
      'Rejection Remarks',
    ];

    const rows = certificates.map((c) => [
      `"${c.id}"`,
      `"${c.student?.name || ''}"`,
      `"${c.student?.registerNumber || ''}"`,
      `"${c.student?.department || ''}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.issuedDate}"`,
      `"${new Date(c.uploadedAt).toLocaleDateString()}"`,
      `"${c.status}"`,
      `"${c.verifiedBy?.name || ''}"`,
      `"${(c.rejectionReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KSRCT_Certificate_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-ksrct-orange" />
            <span>Reports & Analytics Export</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate and export department certificate reports to CSV or print view
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={certificates.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, student, register number..."
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
          onClick={fetchReportData}
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Printable Report Container */}
      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">KSRCT Certificate Verification Report</h2>
            <p className="text-xs text-slate-500">Total Records Returned: {certificates.length}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            Generated on: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Register No</th>
                <th className="py-3 px-3">Certificate Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Generating report data...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No certificate records match the specified filters.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{cert.student?.name}</td>
                    <td className="py-3 px-3 text-slate-600">{cert.student?.registerNumber || 'N/A'}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{cert.title}</td>
                    <td className="py-3 px-3 text-slate-600">{cert.category}</td>
                    <td className="py-3 px-3 text-slate-500">{cert.issuedDate}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-500">{cert.verifiedBy?.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
