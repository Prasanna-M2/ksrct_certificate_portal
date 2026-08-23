import React from 'react';
import { PortalStatus } from '../../types';
import { CheckCircle2, Clock, XCircle, Send, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: PortalStatus | string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  const normStatus = (status || '').toUpperCase();

  switch (normStatus) {
    case 'APPROVED':
    case 'ISSUED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          Approved
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0a4c95]/25 text-sky-300 border border-[#0a4c95]/50 shadow-[0_0_12px_rgba(10,76,149,0.3)]">
          {showIcon && <Send className="w-3.5 h-3.5 text-sky-400" />}
          Submitted
        </span>
      );
    case 'MENTOR_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f37021]/15 text-[#f37021] border border-[#f37021]/35 shadow-[0_0_12px_rgba(243,112,33,0.25)]">
          {showIcon && <Clock className="w-3.5 h-3.5 text-[#f37021] animate-spin" />}
          Mentor Review
        </span>
      );
    case 'ADVISOR_REVIEW':
    case 'MENTOR_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/35 shadow-[0_0_12px_rgba(14,165,233,0.25)]">
          {showIcon && <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />}
          Advisor Review
        </span>
      );
    case 'HOD_REVIEW':
    case 'ADVISOR_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
          {showIcon && <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
          HOD Review
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f37021]/20 text-[#f37021] border border-[#f37021]/45 shadow-[0_0_12px_rgba(243,112,33,0.3)]">
          {showIcon && <RotateCcw className="w-3.5 h-3.5 text-[#f37021]" />}
          Resubmitted
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-300 border border-rose-500/35 shadow-xs">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 border border-white/10">
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-400" />}
          {status}
        </span>
      );
  }
};

export default StatusBadge;
