import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface ApproverActionPanelProps {
  actionRemarks: string;
  setActionRemarks: (val: string) => void;
  actionError: string;
  isSubmittingAction: boolean;
  onOpenRejectModal: () => void;
  onApprove: () => void;
}

export const ApproverActionPanel: React.FC<ApproverActionPanelProps> = ({
  actionRemarks,
  setActionRemarks,
  actionError,
  isSubmittingAction,
  onOpenRejectModal,
  onApprove,
}) => {
  return (
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
          onClick={onOpenRejectModal}
          disabled={isSubmittingAction}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center cursor-pointer"
        >
          <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={isSubmittingAction}
          className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          {isSubmittingAction ? 'Processing...' : 'Approve & Advance Stage'}
        </button>
      </div>
    </div>
  );
};
