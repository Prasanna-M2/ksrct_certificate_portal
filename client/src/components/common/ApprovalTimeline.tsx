import React from 'react';
import { PortalStage, PortalStatus, ApprovalRecord } from '../../types';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalTimelineProps {
  currentStage: PortalStage;
  status: PortalStatus;
  approvals?: ApprovalRecord[];
  mentorRemarks?: string | null;
  advisorRemarks?: string | null;
  hodRemarks?: string | null;
  rejectionReason?: string | null;
  rejectedByRole?: string | null;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  currentStage,
  status,
  approvals = [],
  mentorRemarks,
  advisorRemarks,
  hodRemarks,
  rejectionReason,
  rejectedByRole,
}) => {
  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  // Helper to find approval record by role
  const findApproval = (role: string) => approvals.find((a) => a.approverRole === role && a.action === 'APPROVED');
  const mentorApproval = findApproval('MENTOR');
  const advisorApproval = findApproval('ADVISOR');
  const hodApproval = findApproval('HOD');

  const steps = [
    {
      key: 'SUBMITTED',
      title: 'Submitted',
      role: 'Student',
      isCompleted: true,
      isCurrent: false,
      date: approvals.find((a) => a.action === 'SUBMITTED' || a.action === 'RESUBMITTED')?.actionDate,
      remarks: null,
    },
    {
      key: 'MENTOR_REVIEW',
      title: 'Mentor Review',
      role: 'Faculty Mentor',
      isCompleted: Boolean(mentorApproval) || currentStage === 'ADVISOR_REVIEW' || currentStage === 'HOD_REVIEW' || isApproved,
      isCurrent: !isRejected && (currentStage === 'MENTOR_REVIEW' || status === 'SUBMITTED' || status === 'RESUBMITTED'),
      isRejected: isRejected && rejectedByRole === 'MENTOR',
      date: mentorApproval?.actionDate,
      remarks: mentorRemarks || mentorApproval?.remarks,
    },
    {
      key: 'ADVISOR_REVIEW',
      title: 'Advisor Review',
      role: 'Class Advisor',
      isCompleted: Boolean(advisorApproval) || currentStage === 'HOD_REVIEW' || isApproved,
      isCurrent: !isRejected && currentStage === 'ADVISOR_REVIEW',
      isRejected: isRejected && rejectedByRole === 'ADVISOR',
      date: advisorApproval?.actionDate,
      remarks: advisorRemarks || advisorApproval?.remarks,
    },
    {
      key: 'HOD_REVIEW',
      title: 'HOD Review',
      role: 'Head of Dept',
      isCompleted: Boolean(hodApproval) || isApproved,
      isCurrent: !isRejected && currentStage === 'HOD_REVIEW',
      isRejected: isRejected && (rejectedByRole === 'HOD' || rejectedByRole === 'STAFF' || rejectedByRole === 'ADMIN'),
      date: hodApproval?.actionDate,
      remarks: hodRemarks || hodApproval?.remarks,
    },
    {
      key: 'COMPLETED',
      title: isRejected ? 'Rejected' : 'Completed',
      role: 'Final Verification',
      isCompleted: isApproved,
      isCurrent: isApproved || isRejected,
      isRejected: isRejected,
      date: isApproved ? hodApproval?.actionDate : undefined,
      remarks: isRejected ? rejectionReason : null,
    },
  ];

  return (
    <div className="w-full py-4">
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
        {/* Connection Line behind nodes */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-white/10 -z-0" />

        {steps.map((step, idx) => {
          let nodeBg = 'bg-[#061426] border-white/10 text-slate-500';
          let icon = <Clock className="w-4 h-4 text-slate-500" />;
          let badgeText = 'Waiting';
          let badgeClass = 'bg-white/5 text-slate-400 border-white/10';

          if (step.isCompleted) {
            nodeBg = 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
            icon = <CheckCircle2 className="w-4 h-4 text-slate-950 font-black" />;
            badgeText = 'Completed';
            badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
          } else if (step.isRejected) {
            nodeBg = 'bg-rose-500 border-rose-400 text-white shadow-xs';
            icon = <XCircle className="w-4 h-4 text-white" />;
            badgeText = 'Rejected';
            badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
          } else if (step.isCurrent) {
            nodeBg = 'bg-[#f37021] border-[#ff934d] text-white shadow-[0_0_18px_rgba(243,112,33,0.45)] animate-pulse-subtle';
            icon = <AlertCircle className="w-4 h-4 text-white font-black" />;
            badgeText = 'In Review';
            badgeClass = 'bg-[#f37021]/20 text-[#f37021] border-[#f37021]/40';
          }

          return (
            <div key={idx} className="relative z-10 flex md:flex-col items-center space-x-3 md:space-x-0 md:space-y-2 text-left md:text-center flex-1">
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${nodeBg}`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-white">{step.title}</p>
                <p className="text-[10px] text-slate-400 font-medium">{step.role}</p>

                <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold border rounded-full ${badgeClass}`}>
                  {badgeText}
                </span>

                {step.date && (
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}

                {step.remarks && (
                  <p className="text-[10px] italic text-[#f37021]/90 mt-1 max-w-[140px] truncate" title={step.remarks}>
                    "{step.remarks}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalTimeline;
