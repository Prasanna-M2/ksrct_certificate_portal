import React from 'react';
import { Tag, Building2, Calendar, Clock, MapPin } from 'lucide-react';
import { Certificate, OdRequest } from '../../../types';

interface RequestDetailsCardProps {
  isCert: boolean;
  cert: Certificate | null;
  od: OdRequest | null;
}

export const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({ isCert, cert, od }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-xs">
      {isCert ? (
        <>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#f37021]" /> Category
            </span>
            <p className="text-xs font-bold text-slate-900">{cert?.category}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0a4c95]" /> Organization / Issuer
            </span>
            <p className="text-xs font-bold text-slate-900">{cert?.organization || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0a4c95]" /> Issued / Event Date
            </span>
            <p className="text-xs font-bold text-slate-900">{cert?.issuedDate || cert?.eventDate || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#f37021]" /> Uploaded At
            </span>
            <p className="text-xs font-bold text-slate-900 font-mono">
              {new Date(cert?.uploadedAt || '').toLocaleString()}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" /> Category / Type
            </span>
            <p className="text-xs font-bold text-slate-900">
              {od?.requestType} — {od?.eventType}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0a4c95]" /> Organization / Host
            </span>
            <p className="text-xs font-bold text-slate-900">{od?.organization || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Venue
            </span>
            <p className="text-xs font-bold text-slate-900">{od?.venue || 'Campus'}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Date Range & Days
            </span>
            <p className="text-xs font-bold text-slate-900">
              {od?.odDate || 'Sanctioned Date'} ({od?.numberOfDays} Day{od?.numberOfDays! > 1 ? 's' : ''})
            </p>
          </div>
        </>
      )}

      <div className="col-span-full space-y-1 pt-2 border-t border-slate-200">
        <span className="text-[10px] text-slate-500 uppercase font-bold">Purpose / Description</span>
        <p className="text-xs text-slate-700 p-3 rounded-xl bg-white/80 border border-slate-200 backdrop-blur-xs">
          {isCert ? cert?.description || 'No description provided.' : od?.purpose || od?.description || 'N/A'}
        </p>
      </div>
    </div>
  );
};
