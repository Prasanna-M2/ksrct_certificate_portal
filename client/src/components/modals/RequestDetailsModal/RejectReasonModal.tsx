import React from 'react';
import { XCircle } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionRemarks: string;
  setActionRemarks: (val: string) => void;
  isSubmittingAction: boolean;
  onReject: () => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  actionRemarks,
  setActionRemarks,
  isSubmittingAction,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={isSubmittingAction || !actionRemarks.trim()}
            onClick={onReject}
            className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmittingAction ? 'Processing...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};
