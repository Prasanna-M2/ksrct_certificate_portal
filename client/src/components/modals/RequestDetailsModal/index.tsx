import React, { useState, useEffect } from 'react';
import { Certificate, OdRequest, Role, ApprovalRecord, AuditLogItem } from '../../../types';
import { ApprovalTimeline } from '../../ui/ApprovalTimeline';
import { OfficialOdLeaveFormModal } from '../OfficialOdLeaveFormModal';
import api from '../../../services/api';
import { Download, Printer, RotateCcw } from 'lucide-react';

import { RequestModalHeader } from './RequestModalHeader';
import { RequestDetailsCard } from './RequestDetailsCard';
import { StudentInfoCard } from './StudentInfoCard';
import { ApproverActionPanel } from './ApproverActionPanel';
import { AuditTrailTable } from './AuditTrailTable';
import { RejectReasonModal } from './RejectReasonModal';
import { ResubmitRequestModal } from './ResubmitRequestModal';

export interface RequestDetailsModalProps {
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
  const [, setLoading] = useState(false);
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
    <div className="fixed inset-0 z-50 overflow-y-auto glass-modal-backdrop flex items-center justify-center p-3 sm:p-6 animate-fade-in-up">
      <div className="relative w-full max-w-4xl glass-container rounded-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <RequestModalHeader
          isCert={isCert}
          requestId={requestId}
          requestType={requestType}
          title={title}
          onClose={onClose}
        />

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs bg-slate-50/70 backdrop-blur-md">
          {/* Approval Progress Stepper */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200">
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
          <RequestDetailsCard isCert={isCert} cert={cert} od={od} />

          {/* Student Profile Info */}
          <StudentInfoCard request={request} />

          {/* Approver Action Panel */}
          {canApprove && (
            <ApproverActionPanel
              actionRemarks={actionRemarks}
              setActionRemarks={setActionRemarks}
              actionError={actionError}
              isSubmittingAction={isSubmittingAction}
              onOpenRejectModal={() => setShowRejectModal(true)}
              onApprove={handleApprove}
            />
          )}

          {/* Audit History Log Table */}
          <AuditTrailTable auditLogs={auditLogs} />
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 bg-white/90 backdrop-blur-md">
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
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        actionRemarks={actionRemarks}
        setActionRemarks={setActionRemarks}
        isSubmittingAction={isSubmittingAction}
        onReject={handleReject}
      />

      {/* RESUBMIT MODAL */}
      <ResubmitRequestModal
        isOpen={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        isCert={isCert}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editEventName={editEventName}
        setEditEventName={setEditEventName}
        setNewFile={setNewFile}
        isSubmittingAction={isSubmittingAction}
        onSubmit={handleResubmit}
      />

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
