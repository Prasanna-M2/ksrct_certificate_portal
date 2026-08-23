import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { User, AuditLogItem, SupportTicket, Role } from '../../types';
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
  UserX,
  UserCheck,
  RefreshCw,
  X,
  Edit3,
  Award,
  FileText,
  Layers,
  ChevronRight,
  Sparkles,
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
  const [mentorCapacity, setMentorCapacity] = useState(6);
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

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', { params: { search: auditSearch } });
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
    else if (activeTab === 'staff') fetchStaff();
    else if (activeTab === 'students') fetchStudents();
    else if (activeTab === 'audit') fetchAudit();
  }, [activeTab, fetchStructure, fetchStaff, fetchStudents, fetchAudit]);

  const openStaffModal = (staff: User) => {
    setTargetStaff(staff);
    const resps = (staff as any).staffResponsibilities?.map((r: any) => r.responsibility) || staff.responsibilities || [];
    setIsMentorRole(resps.includes('MENTOR'));
    setIsAdvisorRole(resps.includes('ADVISOR'));
    setIsHodRole(resps.includes('HOD'));
    setMentorCapacity(staff.mentorCapacity || 6);
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
        showToast(res.data.message || 'Responsibilities updated.', 'success');
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

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      if (res.data?.success) {
        showToast(`User ${!user.isActive ? 'activated' : 'disabled'} successfully.`, 'success');
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
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-white tracking-tight">Creator Workspace</h1>
            <span className="text-xs px-3 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
              Department Master Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Department of Electrical & Electronics Engineering — Hierarchy Matrix (1 HOD, 2 Advisors/year, Mentors)
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-glow-gold transition-all duration-300 cursor-pointer hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'structure'
              ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>EEE Hierarchy Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Staff & Multi-Responsibilities</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students & Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
              : 'glass-card text-slate-300 hover:text-white'
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
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  EEE Head of Department (HOD) — Strictly 1 Active Enforced
                </h3>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Single Active HOD Active
              </span>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-white">{structureData?.hod?.name || 'No HOD Assigned'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{structureData?.hod?.email || '-'} • {structureData?.hod?.phone || 'N/A'}</p>
              </div>
              <button
                onClick={() => {
                  if (structureData?.hod) openStaffModal(structureData.hod);
                  else setActiveTab('staff');
                }}
                className="px-4 py-2 text-xs font-bold text-amber-400 glass-card rounded-xl hover:bg-white/10 cursor-pointer"
              >
                Change HOD
              </button>
            </div>
          </div>

          {/* Year-Wise Advisors (2 per year) */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Year-wise Class Advisors (2 per Year)</h3>
                <p className="text-xs text-slate-400">Each Year cohort in EEE has exactly 2 active Advisors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structureData?.yearDetails?.map((yd: any) => (
                <div key={yd.year} className="p-5 rounded-2xl glass-card border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black text-amber-400 uppercase">Year {yd.year} EEE</span>
                    <span className="text-xs text-slate-400 font-bold">{yd.studentCount} Students</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Advisors (Max 2):</p>
                    {yd.advisors?.length > 0 ? (
                      yd.advisors.map((adv: any, idx: number) => (
                        <div key={adv.id || idx} className="text-xs font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{adv.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-rose-400 italic">No advisors assigned</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setTargetYear(yd.year);
                      setSelectedAdvisorIds(yd.advisors?.map((a: any) => a.id) || []);
                      setAdvisorModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 text-xs font-bold text-slate-200 glass-card rounded-xl hover:bg-white/15 cursor-pointer"
                  >
                    Assign Year {yd.year} Advisors
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mentors Matrix */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white">Faculty Mentors Matrix (Capacity Tracking)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {structureData?.mentors?.map((m: any) => (
                <div key={m.id} className="p-4 rounded-2xl glass-card border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-white">{m.name}</p>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {m.mentees?.length || 0} / {m.mentorCapacity || 6}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {m.mentees?.length >= (m.mentorCapacity || 6)
                      ? '● At full capacity'
                      : `○ ${(m.mentorCapacity || 6) - (m.mentees?.length || 0)} slots available`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. STAFF & RESPONSIBILITIES TABLE */}
      {activeTab === 'staff' && (
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black text-white">Staff & Multi-Responsibilities Matrix</h3>
              <p className="text-xs text-slate-400">Configure Mentor, Advisor, and HOD responsibilities per staff account</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold border-y border-white/10 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Active Responsibilities</th>
                  <th className="py-3 px-4">Mentee Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {staffList.map((st) => {
                  const resps = (st as any).staffResponsibilities?.map((r: any) => r.responsibility) || st.responsibilities || [];
                  return (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{st.name}</td>
                      <td className="py-3 px-4 text-slate-400">{st.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {resps.includes('HOD') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              HOD
                            </span>
                          )}
                          {resps.includes('ADVISOR') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Advisor
                            </span>
                          )}
                          {resps.includes('MENTOR') && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Mentor ({st._count?.mentees || 0}/{st.mentorCapacity || 6})
                            </span>
                          )}
                          {resps.length === 0 && (
                            <span className="text-slate-500 italic">No assigned roles</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{st.mentorCapacity || 6} students</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.isActive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                          {st.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openStaffModal(st)}
                          className="px-3 py-1 text-xs font-bold text-amber-400 glass-card rounded-xl hover:bg-white/10 cursor-pointer"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-xl ${st.isActive ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'} cursor-pointer`}
                        >
                          {st.isActive ? 'Disable' : 'Enable'}
                        </button>
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
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black text-white">Students Assignment Control</h3>
              <p className="text-xs text-slate-400">Creator has final override control over Mentor and Advisor assignments</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl glass-input"
                />
              </div>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl glass-input cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Years</option>
                <option value="I" className="bg-slate-900 text-white">Year I</option>
                <option value="II" className="bg-slate-900 text-white">Year II</option>
                <option value="III" className="bg-slate-900 text-white">Year III</option>
                <option value="IV" className="bg-slate-900 text-white">Year IV</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold border-y border-white/10 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Year / Sec</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4">Assigned Advisor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {studentsList.map((st) => (
                  <tr key={st.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">{st.registerNumber || 'N/A'}</td>
                    <td className="py-3 px-4 font-bold text-white">{st.name}</td>
                    <td className="py-3 px-4">Year {st.year || '-'} ({st.section || 'A'})</td>
                    <td className="py-3 px-4 text-slate-200">{st.mentor?.name || <span className="text-amber-400 font-bold">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-slate-200">{st.advisor?.name || <span className="text-amber-400 font-bold">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setTargetStudent(st);
                          setReassignMentorId(st.mentorId || '');
                          setReassignAdvisorId(st.advisorId || '');
                          setStudentModalOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-bold text-amber-400 glass-card rounded-xl hover:bg-white/10 cursor-pointer"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-xl ${st.isActive ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'} cursor-pointer`}
                      >
                        {st.isActive ? 'Disable' : 'Enable'}
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
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white">System Audit Trail</h3>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="px-3 py-1.5 text-xs font-medium rounded-xl glass-input"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold border-y border-white/10 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Request / User</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-amber-300 border border-white/10">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">{log.requestId || log.entityId || '-'}</td>
                    <td className="py-3 px-4 font-bold text-white">{log.userName || 'System'} ({log.userRole || '-'})</td>
                    <td className="py-3 px-4 text-slate-400">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN STAFF RESPONSIBILITIES */}
      {staffModalOpen && targetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Assign Staff Responsibilities</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3.5 glass-card rounded-2xl text-xs space-y-1">
              <p className="font-bold text-white">{targetStaff.name}</p>
              <p className="text-slate-400">{targetStaff.email}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Active Responsibilities:
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl glass-card border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMentorRole}
                  onChange={(e) => setIsMentorRole(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Faculty Mentor</p>
                  <p className="text-[11px] text-slate-400">Can mentor 4-6 students and perform Mentor Review</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl glass-card border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdvisorRole}
                  onChange={(e) => setIsAdvisorRole(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Class Advisor</p>
                  <p className="text-[11px] text-slate-400">Can monitor assigned year/class and perform Advisor Review</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHodRole}
                  onChange={(e) => setIsHodRole(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Head of Department (HOD)</p>
                  <p className="text-[11px] text-emerald-400/90">Enforces single active HOD for EEE department</p>
                </div>
              </label>

              {isMentorRole && (
                <div className="space-y-1 pt-2">
                  <label className="block text-xs font-bold text-slate-300">Max Mentee Capacity</label>
                  <input
                    type="number"
                    value={mentorCapacity}
                    onChange={(e) => setMentorCapacity(parseInt(e.target.value, 10) || 6)}
                    min={1}
                    max={20}
                    className="w-full p-2.5 text-xs font-medium rounded-xl glass-input"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingResponsibilities}
                onClick={handleSaveStaffResponsibilities}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-glow-gold"
              >
                {savingResponsibilities ? 'Saving...' : 'Save Responsibilities'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN YEAR ADVISORS */}
      {advisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Assign Advisors for Year {targetYear}</h3>
              <button onClick={() => setAdvisorModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Select up to 2 active staff advisors for Year {targetYear} in the EEE department:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {staffList.map((st) => {
                const isSelected = selectedAdvisorIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-500/20 border-amber-500/40 text-white' : 'glass-card border-white/10 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{st.name}</p>
                      <p className="text-[11px] text-slate-400">{st.email}</p>
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
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdvisorModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAdvisors}
                onClick={handleSaveYearAdvisors}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-glow-gold"
              >
                {savingAdvisors ? 'Saving...' : 'Save Year Advisors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REASSIGN STUDENT MENTOR / ADVISOR */}
      {studentModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Reassign Student Academic Support</h3>
              <button onClick={() => setStudentModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3.5 glass-card rounded-2xl text-xs space-y-1">
              <p className="font-bold text-white">{targetStudent.name} ({targetStudent.registerNumber || 'Student'})</p>
              <p className="text-slate-400">Year {targetStudent.year} • Section {targetStudent.section || 'A'}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">Assign Mentor</label>
                <select
                  value={reassignMentorId}
                  onChange={(e) => setReassignMentorId(e.target.value)}
                  className="w-full p-2.5 font-medium rounded-xl glass-input cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">No Mentor Assigned</option>
                  {staffList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.name} ({m._count?.mentees || 0}/{m.mentorCapacity || 6})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300">Assign Class Advisor</label>
                <select
                  value={reassignAdvisorId}
                  onChange={(e) => setReassignAdvisorId(e.target.value)}
                  className="w-full p-2.5 font-medium rounded-xl glass-input cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">No Advisor Assigned</option>
                  {staffList.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingStudentAssign}
                onClick={handleSaveStudentAssignment}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-glow-gold"
              >
                {savingStudentAssign ? 'Saving...' : 'Update Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE STUDENT / STAFF */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Create New Portal Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="flex bg-slate-950/80 p-1 rounded-2xl text-xs font-bold border border-white/10">
              <button
                type="button"
                onClick={() => setCreateType('STUDENT')}
                className={`flex-1 py-2 rounded-xl transition-all ${createType === 'STUDENT' ? 'bg-amber-500 text-slate-950 shadow-glow-gold font-extrabold' : 'text-slate-400'}`}
              >
                Student Account
              </button>
              <button
                type="button"
                onClick={() => setCreateType('STAFF')}
                className={`flex-1 py-2 rounded-xl transition-all ${createType === 'STAFF' ? 'bg-amber-500 text-slate-950 shadow-glow-gold font-extrabold' : 'text-slate-400'}`}
              >
                Staff Account
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full p-2.5 font-medium rounded-xl glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ksrct.ac.in"
                    className="w-full p-2.5 font-medium rounded-xl glass-input"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300">Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 font-medium rounded-xl glass-input"
                    required
                  />
                </div>
              </div>

              {createType === 'STUDENT' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">Register No *</label>
                    <input
                      type="text"
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      placeholder="24EE042"
                      className="w-full p-2.5 font-medium rounded-xl glass-input uppercase font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full p-2.5 font-medium rounded-xl glass-input cursor-pointer"
                    >
                      <option value="I" className="bg-slate-900 text-white">1st Year</option>
                      <option value="II" className="bg-slate-900 text-white">2nd Year</option>
                      <option value="III" className="bg-slate-900 text-white">3rd Year</option>
                      <option value="IV" className="bg-slate-900 text-white">4th Year</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full p-2.5 font-medium rounded-xl glass-input cursor-pointer"
                    >
                      <option value="A" className="bg-slate-900 text-white">Section A</option>
                      <option value="B" className="bg-slate-900 text-white">Section B</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="block font-bold text-slate-300">Initial Staff Responsibilities</label>
                  <div className="flex items-center gap-4 text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffMentor}
                        onChange={(e) => setNewStaffMentor(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Mentor</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffAdvisor}
                        onChange={(e) => setNewStaffAdvisor(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Advisor</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffHod}
                        onChange={(e) => setNewStaffHod(e.target.checked)}
                        className="rounded text-emerald-500"
                      />
                      <span>HOD</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-glow-gold cursor-pointer"
                >
                  {creating ? 'Creating...' : `Create ${createType}`}
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
