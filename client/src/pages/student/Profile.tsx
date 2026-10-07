import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Shield,
  Save,
  Building,
  CheckCircle2,
  Edit3,
  Award,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, login, token } = useAuth();
  const { showToast } = useNotification();

  const isStudent = user?.role === 'STUDENT';
  const isCreatorOrAdmin = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [registerNumber] = useState(user?.registerNumber || '');
  const [department] = useState(user?.department || 'Electrical and Electronics Engineering');
  const [year, setYear] = useState(user?.year || 'III');
  const [section, setSection] = useState(user?.section || 'A');

  // Selected faculty (Students only)
  const [mentorId, setMentorId] = useState(user?.mentor?.id || '');
  const [advisorId, setAdvisorId] = useState(user?.advisor?.id || '');

  // Available options
  const [mentors, setMentors] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch mentors with capacity & advisors for students
  const fetchFaculty = async () => {
    if (!isStudent) return;
    try {
      setLoadingFaculty(true);
      const [mentorRes, advisorRes] = await Promise.all([
        api.get('/users/mentors'),
        api.get('/users/advisors'),
      ]);

      if (mentorRes.data?.success) {
        setMentors(mentorRes.data.mentors || []);
      }
      if (advisorRes.data?.success) {
        setAdvisors(advisorRes.data.advisors || []);
      }
    } catch (err: any) {
      console.error('Error fetching faculty lists:', err);
    } finally {
      setLoadingFaculty(false);
    }
  };

  useEffect(() => {
    if (isStudent) {
      fetchFaculty();
    }
  }, [isStudent]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (isStudent) {
        payload.year = year;
        payload.section = section;
        payload.mentorId = mentorId || undefined;
        payload.advisorId = advisorId || undefined;
      }

      const res = await api.put('/users/profile', payload);

      if (res.data?.success) {
        showToast('Profile updated successfully!', 'success');
        if (token && res.data.user) {
          login(token, res.data.user);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const responsibilities = user?.responsibilities || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
      {/* Top Cards for Students ONLY */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Assigned Faculty Mentor</span>
              <p className="text-sm font-semibold text-[#0a4c95]">{user?.mentor?.name || 'Not Selected'}</p>
              <p className="text-xs text-slate-500 font-normal">{user?.mentor?.email || 'Choose your mentor below'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0a4c95] border border-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Assigned Class Advisor</span>
              <p className="text-sm font-semibold text-[#f37021]">{user?.advisor?.name || 'Not Selected'}</p>
              <p className="text-xs text-slate-500 font-normal">{user?.advisor?.email || 'Year advisor'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f37021] border border-orange-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Top Banner for Admin / Creator / Staff */}
      {!isStudent && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0a4c95] to-[#1e3a8a] text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white uppercase tracking-wider shadow-xs">
              <Shield className="w-3.5 h-3.5" /> System Authority Overview
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-white">{user?.name}</h2>
            <p className="text-xs font-normal text-sky-200">
              Department of Electrical & Electronics Engineering &bull; {user?.role === 'CREATOR' ? 'Master Creator / Portal Administrator' : user?.role}
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white">
            <Building className="w-7 h-7" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Avatar Card (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#f37021] to-[#ff8c3b] text-white flex items-center justify-center text-3xl font-bold shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">{user?.name}</h2>
            {isStudent && (
              <p className="text-xs font-mono font-medium text-[#f37021] mt-0.5">Reg No: {user?.registerNumber || 'N/A'}</p>
            )}
            <div className="pt-2 flex flex-wrap justify-center gap-1.5">
              <span className="inline-block px-3 py-1 text-[11px] font-medium bg-orange-50 text-orange-800 rounded-full border border-orange-200 uppercase tracking-wider shadow-xs">
                {isStudent ? (user?.year ? `Year ${user.year} EEE` : 'Student') : user?.role}
              </span>
              {responsibilities.map((r) => (
                <span key={r} className="inline-block px-2.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-800 rounded-full border border-blue-200 uppercase">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-100 text-left space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-slate-500 font-medium text-[11px]">Department:</span>
              <span className="font-medium text-[#0a4c95] text-xs text-right">{department}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-medium text-[11px]">Status:</span>
              <span className="font-medium text-emerald-600 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Form (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0a4c95] uppercase tracking-wider">
            <Edit3 className="w-4 h-4 text-[#0a4c95]" />
            <span>Profile Details & Account Information</span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 uppercase">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                    required
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 uppercase">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-slate-50 text-slate-600 opacity-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                  />
                </div>
              </div>

              {/* Student specific fields */}
              {isStudent && (
                <>
                  {/* Register Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 uppercase">Register Number</label>
                    <input
                      type="text"
                      value={registerNumber}
                      disabled
                      className="w-full p-2.5 text-xs font-mono font-normal rounded-xl border border-slate-200 bg-slate-50 text-slate-600 opacity-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 uppercase">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full p-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                    >
                      <option value="I">1st Year (I)</option>
                      <option value="II">2nd Year (II)</option>
                      <option value="III">3rd Year (III)</option>
                      <option value="IV">4th Year (IV)</option>
                    </select>
                  </div>

                  {/* Section */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 uppercase">Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full p-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="Nil">Nil</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Student Faculty Selection ONLY */}
            {isStudent && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-semibold text-[#0a4c95] uppercase tracking-wider">
                  Support Faculty Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Faculty Mentor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 uppercase">
                      Faculty Mentor (Strict Capacity Limit)
                    </label>
                    <select
                      value={mentorId}
                      onChange={(e) => setMentorId(e.target.value)}
                      className="w-full p-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                    >
                      <option value="">Choose your mentor...</option>
                      {mentors.map((m) => {
                        const isCurrentMentor = user?.mentor?.id === m.id;
                        const isFull = !m.isAvailable && !isCurrentMentor;
                        return (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={isFull}
                          >
                            {m.name} ({m.currentCount}/{m.capacity} students) {isFull ? '[FULL]' : ''} {isCurrentMentor ? '★ Current' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Class Advisor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 uppercase">
                      Class Advisor
                    </label>
                    <select
                      value={advisorId}
                      onChange={(e) => setAdvisorId(e.target.value)}
                      className="w-full p-2.5 text-xs font-normal rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:border-[#f37021] focus:ring-1 focus:ring-[#f37021]"
                    >
                      <option value="">Choose Class Advisor...</option>
                      {advisors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} {user?.advisor?.id === a.id ? '★ Current' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-[#f37021] to-[#d8580d] hover:from-[#ff8133] hover:to-[#e06214] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
export { Profile as StudentProfile };
