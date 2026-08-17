import React, { useState } from 'react';
import { Certificate } from '../../types';
import { StatusBadge } from './StatusBadge';
import { X, Download, Printer, CheckCircle2, XCircle, FileText, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CertificateViewerModalProps {
  certificate: Certificate | null;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  certificate,
  onClose,
  onApprove,
  onReject,
}) => {
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!certificate) return null;

  const canVerify = (user?.role === 'HOD' || user?.role === 'ADMIN') && certificate.status === 'PENDING';
  const fileUrl = `/api/certificates/${certificate.id}/file`;
  const isPdf = certificate.fileType?.includes('pdf') || certificate.fileName?.endsWith('.pdf');

  const handleApprove = async () => {
    if (!onApprove) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      await onApprove(certificate.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to approve certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReject) return;
    if (!rejectionReason.trim()) {
      setErrorMsg('Rejection remark is required before rejecting.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onReject(certificate.id, rejectionReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reject certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = certificate.fileName || `${certificate.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-ksrct-orange" />
            </div>
            <div>
              <h2 className="text-base font-bold truncate max-w-md">{certificate.title}</h2>
              <p className="text-xs text-slate-400 font-medium">Category: {certificate.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={certificate.status} />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* File View (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-slate-100 p-4 flex flex-col justify-center items-center min-h-[350px] lg:min-h-[500px]">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                title={certificate.title}
                className="w-full h-full min-h-[450px] rounded-xl border border-slate-300 bg-white shadow-sm"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <img
                  src={fileUrl}
                  alt={certificate.title}
                  className="max-h-[450px] w-auto max-w-full rounded-xl shadow-md border border-slate-300 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Details & Actions (Right 5 Cols) */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between overflow-y-auto bg-white space-y-6">
            <div className="space-y-6">
              {/* Student Details Card */}
              {certificate.student && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-ksrct-navy uppercase tracking-wider">
                    <User className="w-4 h-4 text-ksrct-orange" />
                    <span>Student Profile</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{certificate.student.name}</p>
                    <p className="text-slate-600">Register No: <span className="font-semibold">{certificate.student.registerNumber || 'N/A'}</span></p>
                    <p className="text-slate-600">Department: <span className="font-semibold">{certificate.student.department}</span></p>
                    {certificate.student.year && <p className="text-slate-600">Year: <span className="font-semibold">{certificate.student.year} Year</span></p>}
                    <p className="text-slate-500 font-mono text-[11px]">{certificate.student.email}</p>
                  </div>
                </div>
              )}

              {/* Certificate Metadata */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificate Metadata</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Category</span>
                    </div>
                    <p className="font-bold text-slate-800">{certificate.category}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Issue Date</span>
                    </div>
                    <p className="font-bold text-slate-800">{certificate.issuedDate}</p>
                  </div>
                </div>

                {certificate.description && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">Description / Remarks</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{certificate.description}</p>
                  </div>
                )}
              </div>

              {/* Rejection Remark Alert if Rejected */}
              {certificate.status === 'REJECTED' && certificate.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Rejection Remark</span>
                  </div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    "{certificate.rejectionReason}"
                  </p>
                </div>
              )}

              {/* Error Message display */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Verification Form Box for HOD */}
              {canVerify && showRejectBox && (
                <form onSubmit={handleRejectSubmit} className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                  <label className="block text-xs font-bold text-rose-900">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter explicit rejection remarks (e.g. Blurry seal, incorrect date, invalid issuer)..."
                    className="w-full p-2.5 text-xs rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {/* Common Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Print Certificate"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* HOD/Admin Verification Buttons */}
              {canVerify && !showRejectBox && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectBox(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
