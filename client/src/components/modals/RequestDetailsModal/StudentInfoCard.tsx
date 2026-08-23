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
    <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white flex items-center justify-center font-black text-sm shadow-xs">
        {studentName?.charAt(0) || 'S'}
      </div>
      <div className="flex-1">
        <p className="text-xs font-black text-slate-900">{studentName}</p>
        <p className="text-[11px] text-slate-700 font-bold font-mono">
          Reg: {regNo} • Dept: {dept}
        </p>
      </div>
    </div>
  );
};
