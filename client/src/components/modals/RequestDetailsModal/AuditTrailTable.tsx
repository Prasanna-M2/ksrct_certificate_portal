import React from 'react';
import { Clock } from 'lucide-react';
import { AuditLogItem } from '../../../types';

interface AuditTrailTableProps {
  auditLogs: AuditLogItem[];
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-slate-400" /> Full Audit Trail
      </h4>
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Date & Time</th>
              <th className="py-2.5 px-3">Actor (Role)</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900">
                    {log.userName || 'System'} ({log.userRole || 'User'})
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold bg-orange-50 text-[#f37021] border border-orange-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 italic">{log.remarks || log.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No audit history recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
