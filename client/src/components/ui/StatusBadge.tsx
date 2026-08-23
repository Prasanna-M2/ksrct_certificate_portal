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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-xs">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
          Approved
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100/90 text-sky-900 border border-sky-300 shadow-xs">
          {showIcon && <Send className="w-3.5 h-3.5 text-sky-700" />}
          Submitted
        </span>
      );
    case 'MENTOR_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100/90 text-orange-950 border border-orange-300 shadow-xs">
          {showIcon && <Clock className="w-3.5 h-3.5 text-orange-700 animate-spin" />}
          Mentor Review
        </span>
      );
    case 'ADVISOR_REVIEW':
    case 'MENTOR_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100/90 text-blue-950 border border-blue-300 shadow-xs">
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-700 animate-pulse" />}
          Advisor Review
        </span>
      );
    case 'HOD_REVIEW':
    case 'ADVISOR_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100/90 text-indigo-950 border border-indigo-300 shadow-xs">
          {showIcon && <Clock className="w-3.5 h-3.5 text-indigo-700 animate-pulse" />}
          HOD Review
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100/90 text-amber-950 border border-amber-300 shadow-xs">
          {showIcon && <RotateCcw className="w-3.5 h-3.5 text-amber-700" />}
          Resubmitted
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100/90 text-rose-950 border border-rose-300 shadow-xs">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-900 border border-slate-300">
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-700" />}
          {status}
        </span>
      );
  }
};

export default StatusBadge;
