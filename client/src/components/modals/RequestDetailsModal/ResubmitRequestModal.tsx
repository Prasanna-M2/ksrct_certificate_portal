import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCert: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editEventName: string;
  setEditEventName: (val: string) => void;
  setNewFile: (file: File | null) => void;
  isSubmittingAction: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ResubmitRequestModal: React.FC<ResubmitRequestModalProps> = ({
  isOpen,
  onClose,
  isCert,
  editTitle,
  setEditTitle,
  editEventName,
  setEditEventName,
  setNewFile,
  isSubmittingAction,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#f37021]" />
          <span>Resubmit Request (Resets to Mentor Review)</span>
        </h3>
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
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
              onClick={onClose}
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
  );
};
