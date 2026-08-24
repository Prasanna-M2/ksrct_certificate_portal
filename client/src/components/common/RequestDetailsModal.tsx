import React, { useState, useEffect } from 'react';
import { Certificate, OdRequest, Role, ApprovalRecord, AuditLogItem } from '../../types';
import { ApprovalTimeline } from './ApprovalTimeline';
import { OfficialOdLeaveFormModal } from './OfficialOdLeaveFormModal';
import api from '../../services/api';
import {
  X,
  FileText,
  Calendar,
  Building,
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  Building2,
  MapPin,
  Tag,
  Printer,
  Sparkles,
} from 'lucide-react';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Certificate | OdRequest | null;
  requestType: 'CERTIFICATE' | 'OD';
  currentUser: {
    id: string;
    role: Role;
    name: string;
  };
  onRefresh: () => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  requestType,
  currentUser,
  onRefresh,
}) => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showOfficialFormModal, setShowOfficialFormModal] = useState(false);

  // Resubmit state fields
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && request) {
      fetchDetails();
      if (requestType === 'CERTIFICATE') {
        const cert = request as Certificate;
        setEditTitle(cert.title || '');
        setEditCategory(cert.category || 'NPTEL');
        setEditEventName(cert.eventName || '');
        setEditOrganization(cert.organization || '');
        setEditEventDate(cert.eventDate || cert.issuedDate || '');
        setEditDescription(cert.description || '');
      } else {
        const od = request as OdRequest;
        setEditEventName(od.eventName || '');
        setEditOrganization(od.organization || '');
        setEditVenue(od.venue || '');
        setEditEventDate(od.odDate || '');
        setEditPurpose(od.purpose || '');
        setEditDescription(od.description || '');
      }
    }
  }, [isOpen, request]);

  const fetchDetails = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const endpoint = requestType === 'CERTIFICATE' ? `/certificates/${request.id}` : `/od/${request.id}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        setApprovals(res.data.approvals || []);
        setAuditLogs(res.data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch request details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const isCert = requestType === 'CERTIFICATE';
  const cert = isCert ? (request as Certificate) : null;
  const od = !isCert ? (request as OdRequest) : null;

  const requestId = isCert ? cert?.certificateId : od?.odId;
  const title = isCert ? cert?.title : od?.eventName;

  const isStudentOwner = currentUser.id === request.studentId;
  const isRejected = request.status === 'REJECTED';

  // Dynamic approver checking
  const canApprove =
    !isRejected &&
    request.status !== 'APPROVED' &&
    currentUser.role !== 'STUDENT';

  const handleApprove = async () => {
    setActionError('');
    setIsSubmittingAction(true);
    try {
      const endpoint = isCert
        ? `/certificates/${request.id}/approve`
        : `/od/${request.id}/approve`;
      const res = await api.post(endpoint, {
        remarks: actionRemarks || 'Approved',
      });
      if (res.data.success) {
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!actionRemarks || actionRemarks.trim() === '') {
      setActionError('A specific rejection reason is mandatory.');
      return;
    }
    setActionError('');
    setIsSubmittingAction(true);
    try {
      const endpoint = isCert
        ? `/certificates/${request.id}/reject`
        : `/od/${request.id}/reject`;
      const res = await api.post(endpoint, {
        remarks: actionRemarks.trim(),
        reason: actionRemarks.trim(),
      });
      if (res.data.success) {
        setShowRejectModal(false);
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setIsSubmittingAction(true);
    try {
      const formData = new FormData();
      if (isCert) {
        formData.append('title', editTitle);
        formData.append('category', editCategory);
        if (editEventName) formData.append('eventName', editEventName);
        if (editOrganization) formData.append('organization', editOrganization);
        if (editEventDate) formData.append('eventDate', editEventDate);
        if (editDescription) formData.append('description', editDescription);
        if (newFile) formData.append('certificateFile', newFile);
      } else {
        formData.append('eventName', editEventName);
        formData.append('organization', editOrganization);
        formData.append('venue', editVenue);
        formData.append('odDate', editEventDate);
        formData.append('purpose', editPurpose);
        formData.append('description', editDescription);
        if (newFile) {
          formData.append('supportingFile', newFile);
          formData.append('documentFile', newFile);
          formData.append('file', newFile);
        }
      }

      const endpoint = isCert
        ? `/certificates/${request.id}/resubmit`
        : `/od/${request.id}/resubmit`;

      const res = await api.put(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowResubmitModal(false);
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to resubmit request.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDownload = async () => {
    try {
      const endpoint = isCert
        ? `/certificates/${request.id}/file`
        : `/od/${request.id}/file`;
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${requestId}_document.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to download file. You may not have authorization.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in-up">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center font-bold">
              {isCert ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#f37021] bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                  {requestId}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {requestType} Request
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">{title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs bg-white">
          {/* Approval Progress Stepper */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <ApprovalTimeline
              currentStage={request.currentStage}
              status={request.status}
              approvals={approvals}
              mentorRemarks={request.mentorRemarks}
              advisorRemarks={request.advisorRemarks}
              hodRemarks={request.hodRemarks}
              rejectionReason={request.rejectionReason}
              rejectedByRole={request.rejectedByRole}
            />
          </div>

          {/* Key Request Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
            {isCert ? (
              <>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#f37021]" /> Category
                  </span>
                  <p className="text-xs font-bold text-slate-900">{cert?.category}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0a4c95]" /> Organization / Issuer
                  </span>
                  <p className="text-xs font-bold text-slate-900">{cert?.organization || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0a4c95]" /> Issued / Event Date
                  </span>
                  <p className="text-xs font-bold text-slate-900">{cert?.issuedDate || cert?.eventDate || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#f37021]" /> Uploaded At
                  </span>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {new Date(cert?.uploadedAt || '').toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" /> Category / Type
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {od?.requestType} — {od?.eventType}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0a4c95]" /> Organization / Host
                  </span>
                  <p className="text-xs font-bold text-slate-900">{od?.organization || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Venue
                  </span>
                  <p className="text-xs font-bold text-slate-900">{od?.venue || 'Campus'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Date Range & Days
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {od?.odDate || 'Sanctioned Date'} ({od?.numberOfDays} Day{od?.numberOfDays! > 1 ? 's' : ''})
                  </p>
                </div>
              </>
            )}

            <div className="col-span-full space-y-1 pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Purpose / Description</span>
              <p className="text-xs text-slate-700 p-3 rounded-xl bg-white border border-slate-200">
                {isCert ? cert?.description || 'No description provided.' : od?.purpose || od?.description || 'N/A'}
              </p>
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white flex items-center justify-center font-black text-sm shadow-xs">
              {request.student?.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-900">{request.student?.name || request.studentName}</p>
              <p className="text-[11px] text-slate-500 font-medium font-mono">
                Reg: {request.student?.registerNumber || request.registerNumber || 'N/A'} • Dept: {request.student?.department || request.department}
              </p>
            </div>
          </div>

          {/* Approver Action Panel */}
          {canApprove && (
            <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-4">
              <h4 className="text-xs font-bold text-[#f37021] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Approver Decision Bar
              </h4>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Approval Remarks / Optional Notes
                </label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Add optional notes for the student..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#f37021]"
                />
              </div>

              <div className="flex items-center space-x-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center cursor-pointer"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {isSubmittingAction ? 'Processing...' : 'Approve & Advance Stage'}
                </button>
              </div>
            </div>
          )}

          {/* Audit History Log Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> Full Audit Trail
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Actor (Role)</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {log.userName || 'System'} ({log.userRole || 'User'})
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold bg-orange-50 text-[#f37021] border border-orange-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic">{log.remarks || log.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No audit history recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#f37021]" />
              <span>Download File</span>
            </button>

            {!isCert && (
              <button
                type="button"
                onClick={() => setShowOfficialFormModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Official Form</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isStudentOwner && isRejected && (
              <button
                type="button"
                onClick={() => setShowResubmitModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Request</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Request with Reason</span>
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the specific reason for rejecting this request. The student will see this reason upon revision.
            </p>
            <textarea
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="State mandatory rejection reason..."
              rows={3}
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingAction || !actionRemarks.trim()}
                onClick={handleReject}
                className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUBMIT MODAL */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#f37021]" />
              <span>Resubmit Request (Resets to Mentor Review)</span>
            </h3>
            <form onSubmit={handleResubmit} className="space-y-3 text-xs">
              {isCert ? (
                <>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Certificate Title *</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#f37021]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">New Certificate File (Optional PDF/PNG)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Event Name *</label>
                    <input
                      type="text"
                      value={editEventName}
                      onChange={(e) => setEditEventName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#f37021]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Supporting Document (Optional PDF/PNG)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2.5 font-extrabold text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] hover:from-[#ff8133] hover:to-[#e06214] rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingAction ? 'Submitting...' : 'Confirm Resubmission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL OD LEAVE FORM MODAL */}
      {showOfficialFormModal && od && (
        <OfficialOdLeaveFormModal
          isOpen={true}
          onClose={() => setShowOfficialFormModal(false)}
          odRequest={od}
        />
      )}
    </div>
  );
};

export default RequestDetailsModal;
