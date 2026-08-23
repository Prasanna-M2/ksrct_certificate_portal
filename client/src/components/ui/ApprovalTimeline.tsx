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
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-slate-300 -z-0" />

        {steps.map((step, idx) => {
          let nodeBg = 'bg-slate-100 border-slate-300 text-slate-500';
          let icon = <Clock className="w-4 h-4 text-slate-500" />;
          let badgeText = 'Waiting';
          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';

          if (step.isCompleted) {
            nodeBg = 'bg-emerald-600 border-emerald-500 text-white shadow-xs';
            icon = <CheckCircle2 className="w-4 h-4 text-white font-black" />;
            badgeText = 'Completed';
            badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
          } else if (step.isRejected) {
            nodeBg = 'bg-rose-600 border-rose-500 text-white shadow-xs';
            icon = <XCircle className="w-4 h-4 text-white" />;
            badgeText = 'Rejected';
            badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
          } else if (step.isCurrent) {
            nodeBg = 'bg-[#f37021] border-[#d8580d] text-white shadow-md animate-pulse';
            icon = <AlertCircle className="w-4 h-4 text-white font-black" />;
            badgeText = 'In Review';
            badgeClass = 'bg-orange-100 text-orange-950 border-orange-300 font-extrabold';
          }

          return (
            <div key={idx} className="relative z-10 flex md:flex-col items-center space-x-3 md:space-x-0 md:space-y-2 text-left md:text-center flex-1">
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${nodeBg}`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900">{step.title}</p>
                <p className="text-[10px] text-slate-600 font-bold">{step.role}</p>

                <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-extrabold border rounded-full ${badgeClass}`}>
                  {badgeText}
                </span>

                {step.date && (
                  <p className="text-[10px] text-slate-600 font-mono font-bold mt-1">
                    {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}

                {step.remarks && (
                  <p className="text-[10px] font-bold italic text-[#f37021] mt-1 max-w-[140px] truncate" title={step.remarks}>
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
