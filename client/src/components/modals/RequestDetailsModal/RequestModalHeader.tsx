import React from 'react';
import { FileText, Calendar, X } from 'lucide-react';

interface RequestModalHeaderProps {
  isCert: boolean;
  requestId?: string | null;
  requestType: 'CERTIFICATE' | 'OD';
  title?: string | null;
  onClose: () => void;
}

export const RequestModalHeader: React.FC<RequestModalHeaderProps> = ({
  isCert,
  requestId,
  requestType,
  title,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="flex items-center space-x-3.5">
        {/* macOS Window Dots */}
        <div className="glass-window-dots pr-2 border-r border-slate-200">
          <div className="glass-dot-red" />
          <div className="glass-dot-yellow" />
          <div className="glass-dot-green" />
        </div>

        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center font-bold shadow-xs">
          {isCert ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#f37021] bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200 shadow-xs">
              {requestId}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-500">
              {requestType} Request
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">{title}</h3>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
