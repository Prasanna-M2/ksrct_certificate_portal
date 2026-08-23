import React from 'react';
import { OdRequest } from '../../types';
import { Printer, X, CheckCircle2, ShieldCheck, FileCheck2 } from 'lucide-react';

interface OfficialOdLeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  odRequest: OdRequest | null;
}

export const OfficialOdLeaveFormModal: React.FC<OfficialOdLeaveFormModalProps> = ({
  isOpen,
  onClose,
  odRequest,
}) => {
  if (!isOpen || !odRequest) return null;

  const isLeave = odRequest.requestType === 'LEAVE' || odRequest.eventType?.toLowerCase().includes('leave');
  const documentTitle = isLeave ? 'OFFICIAL LEAVE PERMISSION SANCTION FORM' : 'OFFICIAL ON-DUTY (OD) PERMISSION SANCTION FORM';
  const reqIdStr = odRequest.odId || `PERM-${odRequest.id.substring(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Action Header Bar */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">Approved Document Preview — {reqIdStr}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-slate-900 font-sans print:p-0">
          {/* Institutional Letterhead Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1.5">
            <div className="flex justify-center items-center mb-2">
              <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              K.S. RANGASAMY COLLEGE OF TECHNOLOGY (AUTONOMOUS)
            </h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Department of Electrical and Electronics Engineering
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Tiruchengode – 637 215, Namakkal District, Tamil Nadu | Autonomous Institution Affiliated to Anna University
            </p>
            <div className="pt-2">
              <span className="inline-block px-4 py-1.5 bg-slate-900 text-white font-black rounded-lg text-xs uppercase tracking-wider shadow-sm">
                {documentTitle}
              </span>
            </div>
          </div>

          {/* Sanction Metadata Row */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Sanction ID:</span>
              <strong className="font-mono text-sm text-slate-900">{reqIdStr}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Sanction Approval Date:</span>
              <strong className="text-sm text-slate-900">
                {new Date(odRequest.updatedAt || odRequest.createdAt || Date.now()).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          {/* 1. Student Credentials Section */}
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase text-xs text-slate-900 border-b border-slate-200 pb-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-ksrct-navy mr-2" /> 1. Student Profile & Credentials
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px] block">Student Name:</span>
                <strong className="text-slate-900 text-sm">{odRequest.studentName || odRequest.student?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Register Number / Roll Number:</span>
                <strong className="text-slate-900 font-mono">
                  {odRequest.registerNumber || odRequest.rollNumber || odRequest.student?.registerNumber || 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Department & Batch:</span>
                <strong className="text-slate-900">
                  {odRequest.department || 'Electrical and Electronics Engineering'} ({odRequest.year || 'III'} Year)
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Section & Semester:</span>
                <strong className="text-slate-900">
                  Section {odRequest.section || 'A'} (Semester {odRequest.semester || 'V'})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Residential Stay Type:</span>
                <strong className="text-slate-900">{odRequest.stayType || 'DAY_SCHOLAR'}</strong>
              </div>
            </div>
          </div>

          {/* 2. Permission Details Section */}
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase text-xs text-slate-900 border-b border-slate-200 pb-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-ksrct-navy mr-2" /> 2. Sanctioned Activity & Date Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px] block">Service Type:</span>
                <strong className="text-slate-900 uppercase font-bold">{odRequest.requestType}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Event Category / Type:</span>
                <strong className="text-slate-900">{odRequest.eventType || 'Technical'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 text-[11px] block">Event / Activity Name:</span>
                <strong className="text-slate-900 text-sm">{odRequest.eventName || odRequest.purpose}</strong>
              </div>
              {odRequest.organization && (
                <div>
                  <span className="text-slate-500 text-[11px] block">Organization / Host Institution:</span>
                  <strong className="text-slate-900">{odRequest.organization}</strong>
                </div>
              )}
              {odRequest.venue && (
                <div>
                  <span className="text-slate-500 text-[11px] block">Venue / Event Location:</span>
                  <strong className="text-slate-900">{odRequest.venue}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-[11px] block">Sanctioned Date(s):</span>
                <strong className="text-slate-900 font-mono">
                  {odRequest.odDate || 'Sanctioned Date Range'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Total Duration Sanctioned:</span>
                <strong className="text-slate-900">
                  {odRequest.numberOfDays} Day{odRequest.numberOfDays > 1 ? 's' : ''} ({odRequest.startTime || '09:00 AM'} - {odRequest.endTime || '05:00 PM'})
                </strong>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500 text-[11px] block">Stated Purpose / Reason:</span>
                <p className="text-slate-800 font-medium italic mt-0.5">
                  "{odRequest.purpose || odRequest.description || 'Official academic request'}"
                </p>
              </div>
            </div>
          </div>

          {/* 3. Multi-Level Sign-Off Approval Box */}
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold uppercase text-xs text-slate-900 border-b border-slate-200 pb-1 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" /> 3. Multi-Level Authorized Approval Signatures
            </h3>
            <div className="grid grid-cols-3 gap-4 border-2 border-slate-900 rounded-xl p-4 bg-white text-center">
              {/* Level 1: Faculty Mentor */}
              <div className="space-y-6 border-r border-slate-200 pr-2">
                <div>
                  <p className="font-bold text-xs text-slate-900">Faculty Mentor</p>
                  <p className="text-[10px] text-slate-500">Level 1 Verification</p>
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>✓ APPROVED</span>
                  </div>
                  <p className="text-[10px] text-slate-600 italic">
                    "{odRequest.mentorRemarks || 'Verified & Recommended'}"
                  </p>
                </div>
              </div>

              {/* Level 2: Class Advisor */}
              <div className="space-y-6 border-r border-slate-200 pr-2">
                <div>
                  <p className="font-bold text-xs text-slate-900">Class Advisor</p>
                  <p className="text-[10px] text-slate-500">Level 2 Verification</p>
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>✓ APPROVED</span>
                  </div>
                  <p className="text-[10px] text-slate-600 italic">
                    "{odRequest.advisorRemarks || 'Approved by Class Advisor'}"
                  </p>
                </div>
              </div>

              {/* Level 3: HOD */}
              <div className="space-y-6">
                <div>
                  <p className="font-bold text-xs text-slate-900">Head of Department (HOD)</p>
                  <p className="text-[10px] text-slate-500">Final Sanction Authority</p>
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>✓ SANCTIONED BY HOD</span>
                  </div>
                  <p className="text-[10px] text-slate-600 italic">
                    "{odRequest.hodRemarks || 'Approved & Granted'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer Note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 font-mono">
            Generated via KSRCT Department Student Request Management Portal | Verified Digital Seal
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialOdLeaveFormModal;
