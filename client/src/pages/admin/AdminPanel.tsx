import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { User, AuditLogItem, SupportTicket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  ShieldAlert,
  Building,
  GraduationCap,
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  // Tab: 'structure' | 'staff' | 'students' | 'audit'
  const [activeTab, setActiveTab] = useState<'structure' | 'staff' | 'students' | 'audit'>('structure');

  const [loading, setLoading] = useState(true);
  const [structureData, setStructureData] = useState<any>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState<User | null>(null);
  const [isMentorRole, setIsMentorRole] = useState(false);
  const [isAdvisorRole, setIsAdvisorRole] = useState(false);
  const [isHodRole, setIsHodRole] = useState(false);
  const [mentorCapacity, setMentorCapacity] = useState(24);
  const [savingResponsibilities, setSavingResponsibilities] = useState(false);

  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [targetYear, setTargetYear] = useState('III');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
  const [savingAdvisors, setSavingAdvisors] = useState(false);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<User | null>(null);
  const [reassignMentorId, setReassignMentorId] = useState('');
  const [reassignAdvisorId, setReassignAdvisorId] = useState('');
  const [savingStudentAssign, setSavingStudentAssign] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newYear, setNewYear] = useState('I');
  const [newSection, setNewSection] = useState('A');
  const [newRegNo, setNewRegNo] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStaffMentor, setNewStaffMentor] = useState(false);
  const [newStaffAdvisor, setNewStaffAdvisor] = useState(false);
  const [newStaffHod, setNewStaffHod] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchStructure = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/structure');
      if (res.data?.success) {
        setStructureData(res.data.structure);
      }
    } catch (err) {
      console.error('Failed to load EEE structure:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/staff');
      if (res.data?.success) {
        setStaffList(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: { role: 'STUDENT', search: searchQuery, year: yearFilter, section: sectionFilter, limit: 150 },
      });
      if (res.data?.success) {
        setStudentsList(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, yearFilter, sectionFilter]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', { params: { search: auditSearch, limit: 100 } });
      if (res.data?.success) {
        setAuditLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [auditSearch]);

  useEffect(() => {
    if (activeTab === 'structure') fetchStructure();
    if (activeTab === 'staff') fetchStaff();
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchStructure, fetchStaff, fetchStudents, fetchAuditLogs]);

  // Handlers for Modals
  const openStaffModal = (staff: User) => {
    setTargetStaff(staff);
    const resps = (staff as any).staffResponsibilities?.map((r: any) => r.responsibility) || staff.responsibilities || [];
    setIsMentorRole(resps.includes('MENTOR'));
    setIsAdvisorRole(resps.includes('ADVISOR'));
    setIsHodRole(resps.includes('HOD'));
    setMentorCapacity(staff.mentorCapacity || 24);
    setStaffModalOpen(true);
  };

  const handleSaveStaffResponsibilities = async () => {
    if (!targetStaff) return;
    try {
      setSavingResponsibilities(true);
      const resps: string[] = [];
      if (isMentorRole) resps.push('MENTOR');
      if (isAdvisorRole) resps.push('ADVISOR');
      if (isHodRole) resps.push('HOD');

      const res = await api.patch(`/users/${targetStaff.id}/responsibilities`, {
        responsibilities: resps,
        mentorCapacity,
      });

      if (res.data?.success) {
        showToast('Staff responsibilities updated successfully.', 'success');
        setStaffModalOpen(false);
        fetchStaff();
        fetchStructure();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update responsibilities.', 'error');
    } finally {
      setSavingResponsibilities(false);
    }
  };

  const handleSaveYearAdvisors = async () => {
    try {
      setSavingAdvisors(true);
      const res = await api.patch('/users/assign-year-advisors', {
        year: targetYear,
        staffIds: selectedAdvisorIds,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Advisors updated for year.', 'success');
        setAdvisorModalOpen(false);
        fetchStructure();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update year advisors.', 'error');
    } finally {
      setSavingAdvisors(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    const isStudent = userToDelete.role === 'STUDENT';
    const confirmMsg = isStudent
      ? `Are you sure you want to permanently delete student ${userToDelete.name} (${userToDelete.registerNumber || userToDelete.email})? All their certificates and OD records will also be removed.`
      : `Are you sure you want to delete faculty member ${userToDelete.name} (${userToDelete.email})?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await api.delete(`/users/${userToDelete.id}`);
      if (res.data?.success) {
        showToast(res.data.message || 'User deleted successfully.', 'success');
        fetchStudents();
        fetchStaff();
        fetchStructure();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  const handleSaveStudentAssignment = async () => {
    if (!targetStudent) return;
    try {
      setSavingStudentAssign(true);
      const res = await api.patch('/users/assign-student', {
        studentId: targetStudent.id,
        mentorId: reassignMentorId || null,
        advisorId: reassignAdvisorId || null,
      });

      if (res.data?.success) {
        showToast('Student assignment updated successfully.', 'success');
        setStudentModalOpen(false);
        fetchStudents();
        fetchStructure();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update student assignment.', 'error');
    } finally {
      setSavingStudentAssign(false);
    }
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    try {
      const res = await api.patch(`/users/${userToUpdate.id}/status`, { isActive: !userToUpdate.isActive });
      if (res.data?.success) {
        showToast(`User ${!userToUpdate.isActive ? 'activated' : 'disabled'} successfully.`, 'success');
        if (activeTab === 'staff') fetchStaff();
        if (activeTab === 'students') fetchStudents();
      }
    } catch (err: any) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    try {
      setCreating(true);
      const resps: string[] = [];
      if (createType === 'STAFF') {
        if (newStaffMentor) resps.push('MENTOR');
        if (newStaffAdvisor) resps.push('ADVISOR');
        if (newStaffHod) resps.push('HOD');
      }

      const res = await api.post('/users', {
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: createType,
        year: createType === 'STUDENT' ? newYear : undefined,
        section: createType === 'STUDENT' ? newSection : undefined,
        registerNumber: createType === 'STUDENT' ? newRegNo.trim().toUpperCase() : undefined,
        phone: newPhone.trim() || undefined,
        responsibilities: resps,
      });

      if (res.data?.success) {
        showToast(`Created ${createType} account for ${newName}!`, 'success');
        setCreateModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRegNo('');
        setNewPhone('');
        if (createType === 'STAFF') fetchStaff();
        else fetchStudents();
        fetchStructure();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Creator Workspace</h1>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-[#0a4c95] font-black border border-blue-300">
              Department Master Architecture
            </span>
          </div>
          <p className="text-xs text-slate-900 font-bold mt-1">
            Department of Electrical & Electronics Engineering — Hierarchy Matrix (1 HOD, 2 Advisors/year, Mentors)
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] hover:from-[#ff8133] hover:to-[#e06214] rounded-2xl shadow-md transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'structure'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>EEE Hierarchy Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Staff & Multi-Responsibilities</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students & Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-md'
              : 'bg-white text-slate-900 border border-slate-300 hover:bg-orange-50 hover:text-[#f37021]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* 1. EEE HIERARCHY MATRIX */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          {/* HOD Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  EEE Head of Department (HOD) — Strictly 1 Active Enforced
                </h3>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 font-black border border-emerald-300">
                Single Active HOD Active
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-slate-900">{structureData?.hod?.name || 'No HOD Assigned'}</p>
                <p className="text-xs text-slate-900 font-bold mt-0.5">{structureData?.hod?.email || '-'} &bull; {structureData?.hod?.phone || 'N/A'}</p>
              </div>
              <button
                onClick={() => {
                  if (structureData?.hod) openStaffModal(structureData.hod);
                  else setActiveTab('staff');
                }}
                className="px-4 py-2 text-xs font-black text-[#0a4c95] bg-white border-2 border-slate-300 rounded-xl hover:border-[#0a4c95] cursor-pointer"
              >
                Change HOD
              </button>
            </div>
          </div>

          {/* Year-Wise Advisors (2 per year) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Year-wise Class Advisors (2 per Year)</h3>
                <p className="text-xs text-slate-900 font-bold">Each Year cohort in EEE has exactly 2 active Advisors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structureData?.yearDetails?.map((yd: any) => (
                <div key={yd.year} className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-[#f37021] uppercase">Year {yd.year} EEE</span>
                    <span className="text-xs text-slate-900 font-black">{yd.studentCount} Students</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-900 uppercase">Assigned Advisors (Max 2):</p>
                    {yd.advisors?.length > 0 ? (
                      yd.advisors.map((adv: any, idx: number) => (
                        <div key={adv.id || idx} className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{adv.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-rose-700 font-bold italic">No advisors assigned</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setTargetYear(yd.year);
                      setSelectedAdvisorIds(yd.advisors?.map((a: any) => a.id) || []);
                      setAdvisorModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 text-xs font-black text-[#0a4c95] bg-slate-50 border border-slate-300 rounded-xl hover:bg-blue-50 cursor-pointer"
                  >
                    Assign Year {yd.year} Advisors
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mentors Matrix */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h3 className="text-sm font-black text-slate-900">Faculty Mentors Matrix (Year-Based Capacity Tracking)</h3>
                <p className="text-xs text-slate-500 font-semibold">24 Mentees per staff (target: 4 to 6 students per academic year)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {structureData?.mentors?.map((m: any) => {
                const totalCap = m.mentorCapacity || 24;
                const totalMentees = m.mentees?.length || 0;
                const y1Count = m.mentees?.filter((st: any) => st.year === 'I').length || 0;
                const y2Count = m.mentees?.filter((st: any) => st.year === 'II').length || 0;
                const y3Count = m.mentees?.filter((st: any) => st.year === 'III').length || 0;
                const y4Count = m.mentees?.filter((st: any) => st.year === 'IV').length || 0;

                return (
                  <div key={m.id} className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 truncate max-w-[180px]">{m.name}</p>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        totalMentees >= totalCap
                          ? 'bg-rose-100 text-rose-950 border-rose-300'
                          : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                      }`}>
                        {totalMentees} / {totalCap}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold truncate">{m.email}</p>
                    
                    {/* Year-Based Mentee Breakdown (4-6 per year) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px]">
                      <div className="bg-slate-50 p-1.5 rounded-xl text-center border border-slate-200">
                        <p className="text-slate-500 font-bold">Yr I</p>
                        <p className="font-extrabold text-slate-900">{y1Count}/6</p>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-xl text-center border border-slate-200">
                        <p className="text-slate-500 font-bold">Yr II</p>
                        <p className="font-extrabold text-slate-900">{y2Count}/6</p>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-xl text-center border border-slate-200">
                        <p className="text-slate-500 font-bold">Yr III</p>
                        <p className="font-extrabold text-slate-900">{y3Count}/6</p>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-xl text-center border border-slate-200">
                        <p className="text-slate-500 font-bold">Yr IV</p>
                        <p className="font-extrabold text-slate-900">{y4Count}/6</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold pt-0.5">
                      {totalMentees >= totalCap
                        ? '● Full capacity reached'
                        : `○ ${totalCap - totalMentees} total slots remaining`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. STAFF & RESPONSIBILITIES TABLE */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Staff & Multi-Responsibilities Matrix</h3>
              <p className="text-xs text-slate-900 font-bold">Configure Mentor, Advisor, and HOD responsibilities per staff account</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black border-y border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Active Responsibilities</th>
                  <th className="py-3 px-4">Mentee Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                {staffList.map((st) => {
                  const resps = (st as any).staffResponsibilities?.map((r: any) => r.responsibility) || st.responsibilities || [];
                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{st.name}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{st.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {resps.includes('HOD') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                              HOD
                            </span>
                          )}
                          {resps.includes('ADVISOR') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-300">
                              Advisor
                            </span>
                          )}
                          {resps.includes('MENTOR') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-950 border border-indigo-300">
                              Mentor ({st._count?.mentees || 0}/{st.mentorCapacity || 24})
                            </span>
                          )}
                          {resps.length === 0 && (
                            <span className="text-slate-500 font-bold italic">No assigned roles</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{st.mentorCapacity || 24} students (4–6/yr)</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${st.isActive ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-rose-100 text-rose-950 border-rose-300'}`}>
                          {st.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openStaffModal(st)}
                          className="px-2.5 py-1 text-xs font-black text-[#0a4c95] bg-slate-100 border border-slate-300 rounded-xl hover:bg-blue-50 cursor-pointer"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`px-2.5 py-1 text-xs font-black rounded-xl border ${st.isActive ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'} cursor-pointer`}
                        >
                          {st.isActive ? 'Disable' : 'Enable'}
                        </button>
                        {st.role !== 'CREATOR' && (
                          <button
                            onClick={() => handleDeleteUser(st)}
                            className="px-2.5 py-1 text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STUDENTS & ASSIGNMENTS TABLE */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Students Assignment Control</h3>
              <p className="text-xs text-slate-900 font-bold">Creator has final override control over Mentor and Advisor assignments</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="pl-8 pr-3 py-2 text-xs font-black rounded-xl bg-white border-2 border-slate-300 text-slate-900 focus:border-[#f37021]"
                />
              </div>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 text-xs font-black rounded-xl bg-white border-2 border-slate-300 text-slate-900 cursor-pointer focus:border-[#f37021]"
              >
                <option value="ALL">All Years</option>
                <option value="I">Year I</option>
                <option value="II">Year II</option>
                <option value="III">Year III</option>
                <option value="IV">Year IV</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black border-y border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Year / Sec</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4">Assigned Advisor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                {studentsList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-[#f37021]">{st.registerNumber || 'N/A'}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{st.name}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">Year {st.year || '-'} ({st.section || 'A'})</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{st.mentor?.name || <span className="text-[#f37021] font-black">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{st.advisor?.name || <span className="text-[#f37021] font-black">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setTargetStudent(st);
                          setReassignMentorId(st.mentorId || '');
                          setReassignAdvisorId(st.advisorId || '');
                          setStudentModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-black text-[#0a4c95] bg-slate-100 border border-slate-300 rounded-xl hover:bg-blue-50 cursor-pointer"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`px-2.5 py-1 text-xs font-black rounded-xl border ${st.isActive ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'} cursor-pointer`}
                      >
                        {st.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(st)}
                        className="px-2.5 py-1 text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-black text-slate-900">System Audit Trail</h3>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="px-3 py-2 text-xs font-black rounded-xl bg-white border-2 border-slate-300 text-slate-900 focus:border-[#f37021]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black border-y border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Request / User</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-900 font-mono font-bold">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-[#f37021]">{log.requestId || log.entityId || '-'}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{log.userName || 'System'} ({log.userRole || '-'})</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN STAFF RESPONSIBILITIES */}
      {staffModalOpen && targetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Assign Staff Responsibilities</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-slate-700 hover:text-slate-900 font-black">✕</button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <p className="font-black text-slate-900">{targetStaff.name}</p>
              <p className="text-slate-900 font-bold">{targetStaff.email}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                Select Active Responsibilities:
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMentorRole}
                  onChange={(e) => setIsMentorRole(e.target.checked)}
                  className="w-4 h-4 text-[#f37021] rounded"
                />
                <div>
                  <p className="text-xs font-black text-slate-900">Faculty Mentor</p>
                  <p className="text-[11px] text-slate-900 font-bold">Can mentor 4-6 students and perform Mentor Review</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdvisorRole}
                  onChange={(e) => setIsAdvisorRole(e.target.checked)}
                  className="w-4 h-4 text-[#f37021] rounded"
                />
                <div>
                  <p className="text-xs font-black text-slate-900">Class Advisor</p>
                  <p className="text-[11px] text-slate-900 font-bold">Can monitor assigned year/class and perform Advisor Review</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHodRole}
                  onChange={(e) => setIsHodRole(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <p className="text-xs font-black text-emerald-950">Head of Department (HOD)</p>
                  <p className="text-[11px] text-emerald-900 font-bold">Enforces single active HOD for EEE department</p>
                </div>
              </label>

              {isMentorRole && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-900 uppercase">Max Mentee Capacity</label>
                    <span className="text-[10px] font-bold text-slate-500">Target: 4 to 6 students / year</span>
                  </div>
                  <input
                    type="number"
                    value={mentorCapacity}
                    onChange={(e) => setMentorCapacity(parseInt(e.target.value, 10) || 24)}
                    min={1}
                    max={50}
                    className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Configured for 24 mentees across Years I, II, III, and IV.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingResponsibilities}
                onClick={handleSaveStaffResponsibilities}
                className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] rounded-xl shadow-md"
              >
                {savingResponsibilities ? 'Saving...' : 'Save Responsibilities'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN YEAR ADVISORS */}
      {advisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Assign Advisors for Year {targetYear}</h3>
              <button onClick={() => setAdvisorModalOpen(false)} className="text-slate-700 hover:text-slate-900 font-black">✕</button>
            </div>

            <p className="text-xs text-slate-900 font-bold">
              Select up to 2 active staff advisors for Year {targetYear} in the EEE department:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {staffList.map((st) => {
                const isSelected = selectedAdvisorIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-orange-50 border-[#f37021] text-slate-900 font-black' : 'bg-white border-slate-300 text-slate-900 font-bold'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">{st.name}</p>
                      <p className="text-[11px] text-slate-900 font-bold">{st.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedAdvisorIds.length >= 2) {
                            showToast('Maximum 2 Advisors allowed per Year.', 'warning');
                            return;
                          }
                          setSelectedAdvisorIds([...selectedAdvisorIds, st.id]);
                        } else {
                          setSelectedAdvisorIds(selectedAdvisorIds.filter((id) => id !== st.id));
                        }
                      }}
                      className="w-4 h-4 text-[#f37021] rounded"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdvisorModalOpen(false)}
                className="px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAdvisors}
                onClick={handleSaveYearAdvisors}
                className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] rounded-xl shadow-md"
              >
                {savingAdvisors ? 'Saving...' : 'Save Year Advisors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE USER ACCOUNT */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Create New Portal Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-700 hover:text-slate-900 font-black">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setCreateType('STUDENT')}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    createType === 'STUDENT' ? 'bg-[#f37021] text-white shadow-xs' : 'text-slate-900'
                  }`}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setCreateType('STAFF')}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    createType === 'STAFF' ? 'bg-[#f37021] text-white shadow-xs' : 'text-slate-900'
                  }`}
                >
                  Staff Account
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900 uppercase">Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. K. Saravanan"
                  className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-[#f37021]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@ksrct.ac.in"
                    className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-[#f37021]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase">Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-[#f37021]"
                    required
                  />
                </div>
              </div>

              {createType === 'STUDENT' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-900 uppercase">Reg No</label>
                    <input
                      type="text"
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      placeholder="24EE042"
                      className="w-full p-3 text-xs font-mono font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 uppercase focus:border-[#f37021]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-900 uppercase">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-[#f37021]"
                    >
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-900 uppercase">Sec</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full p-3 text-xs font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-[#f37021]"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="Nil">Nil</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-black text-slate-900 uppercase">Assign Initial Roles:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffMentor}
                        onChange={(e) => setNewStaffMentor(e.target.checked)}
                        className="w-4 h-4 text-[#f37021]"
                      />
                      Mentor
                    </label>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffAdvisor}
                        onChange={(e) => setNewStaffAdvisor(e.target.checked)}
                        className="w-4 h-4 text-[#f37021]"
                      />
                      Advisor
                    </label>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffHod}
                        onChange={(e) => setNewStaffHod(e.target.checked)}
                        className="w-4 h-4 text-[#f37021]"
                      />
                      HOD
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] rounded-xl shadow-md"
                >
                  {creating ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
