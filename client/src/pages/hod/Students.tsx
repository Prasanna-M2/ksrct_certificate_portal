import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { User, Certificate } from '../../types';
import { CertificateViewerModal } from '../../components/common/CertificateViewerModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Filter, Users, Eye, X, Award } from 'lucide-react';

export const HodStudents: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentCerts, setStudentCerts] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: { search, year, role: 'STUDENT', limit: 1000 },
      });
      if (res.data && res.data.success) {
        setStudents(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [search, year]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleViewStudent = async (student: User) => {
    setSelectedStudent(student);
    try {
      setLoadingCerts(true);
      const res = await api.get('/certificates', {
        params: { studentId: student.id },
      });
      if (res.data && res.data.success) {
        setStudentCerts(res.data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to fetch student certificates:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-ksrct-navy" />
          <span>Department Student Directory</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          View students and inspect their individual certificate histories
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, register number, email..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          >
            <option value="ALL">All Academic Years</option>
            <option value="I">1st Year</option>
            <option value="II">2nd Year</option>
            <option value="III">3rd Year</option>
            <option value="IV">4th Year</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Register No</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Certificates</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{st.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {st.registerNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{st.year ? `${st.year} Year` : 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{st.email}</td>
                    <td className="py-3.5 px-4 font-bold text-ksrct-navy">
                      {st._count?.certificates || 0} uploaded
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewStudent(st)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-ksrct-navy hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-ksrct-orange" />
                        <span>View History</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student History Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedStudent.name}'s Certificate History</h2>
                <p className="text-xs text-slate-500">
                  Reg No: {selectedStudent.registerNumber} | {selectedStudent.year} Year ({selectedStudent.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {loadingCerts ? (
                <p className="py-8 text-center text-xs text-slate-400">Loading student certificates...</p>
              ) : studentCerts.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">This student has not uploaded any certificates yet.</p>
              ) : (
                studentCerts.map((cert) => (
                  <div key={cert.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{cert.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Category: {cert.category} | Issued: {cert.issuedDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={cert.status} />
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="p-1.5 text-slate-600 hover:text-ksrct-navy bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {selectedCert && (
        <CertificateViewerModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};
