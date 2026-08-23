import React from 'react';
import { Certificate, OdRequest } from '../../../types';

interface StudentInfoCardProps {
  request: Certificate | OdRequest;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({ request }) => {
  const studentName = request.student?.name || request.studentName;
  const regNo = request.student?.registerNumber || request.registerNumber || 'N/A';
  const dept = request.student?.department || request.department;

  return (
    <div className="flex items-center space-x-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white flex items-center justify-center font-black text-sm shadow-md">
        {studentName?.charAt(0) || 'S'}
      </div>
      <div className="flex-1">
        <p className="text-xs font-black text-[#0a4c95] leading-tight">{studentName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#f37021]/15 text-[#f37021] border border-[#f37021]/30 font-mono">
            {regNo}
          </span>
          <span className="text-[11px] text-slate-700 font-bold">
            {dept}
          </span>
        </div>
      </div>
    </div>
  );
};
