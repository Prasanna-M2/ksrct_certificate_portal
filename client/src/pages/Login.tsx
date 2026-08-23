import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import {
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'STUDENT' | 'STAFF' | 'CREATOR'>('STUDENT');
  const [isRegister, setIsRegister] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register State (Students only)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regYear, setRegYear] = useState('III');
  const [regSection, setRegSection] = useState('A');
  const [regPhone, setRegPhone] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  // Mentors & Advisors list for registration
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [availableAdvisors, setAvailableAdvisors] = useState<any[]>([]);

  const { user, token, login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  // Fetch mentors & advisors when switching to registration or year changes
  useEffect(() => {
    if (isRegister) {
      api.get('/users/mentors')
        .then((res) => {
          if (res.data?.success) {
            setAvailableMentors(res.data.mentors || []);
          }
        })
        .catch(() => {});

      api.get(`/users/advisors?year=${regYear}`)
        .then((res) => {
          if (res.data?.success) {
            setAvailableAdvisors(res.data.advisors || []);
          }
        })
        .catch(() => {});
    }
  }, [isRegister, regYear]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your institutional email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim(), password });

      if (res.data && res.data.success && res.data.user && res.data.token) {
        login(res.data.token, res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName || !regEmail || !regPassword || !regNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        registerNumber: regNumber.trim().toUpperCase(),
        department: 'EEE',
        year: regYear,
        section: regSection,
        phone: regPhone.trim(),
        mentorId: selectedMentor || undefined,
        advisorId: selectedAdvisor || undefined,
      });

      if (res.data && res.data.success) {
        showToast('Registration successful! Please sign in.', 'success');
        setIsRegister(false);
        setEmail(regEmail);
        setPassword(regPassword);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-[#f37021] selection:text-white">
      {/* Background Ambient Glow Orbs with Official College Colors */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0a4c95]/30 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#f37021]/20 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#00529b]/25 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />

      {/* Floating Top Bar */}
      <header className="relative z-20 px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5 group select-none">
          <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-blue-950/40 border border-white/30 transition-transform group-hover:scale-105">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Seal" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none uppercase flex items-center gap-2">
              <span>K.S. Rangasamy College of Technology</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f37021]/20 text-[#f37021] border border-[#f37021]/40">AUTONOMOUS</span>
            </h1>
            <p className="text-[11px] font-bold text-[#f37021] mt-1 tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Department of Electrical & Electronics Engineering
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-[#f37021]/30 text-xs font-bold text-[#f37021] shadow-[0_0_15px_rgba(243,112,33,0.15)]">
          <ShieldCheck className="w-4 h-4 text-[#f37021]" />
          <span>Official Portal</span>
        </div>
      </header>

      {/* Main Container - Light Box Inside */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-white/20 grid grid-cols-1 lg:grid-cols-12 overflow-hidden animate-fade-in-up">
          
          {/* Left Side: Professional Institutional Branding (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0a4c95] via-[#083b74] to-[#041d3d] p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200 text-white">
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/15 text-white border border-white/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#ffa266]" />
                <span>KSRCT EEE PORTAL</span>
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                  Certificate & Academic Management Portal
                </h2>
                <p className="text-xs text-blue-100 font-medium leading-relaxed mt-2.5">
                  Official platform for student certificate verification, On-Duty processing, and faculty mentorship workflow.
                </p>
              </div>

              {/* Campus Visual Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-lg group">
                <img
                  src="/ksrct-building.jpg"
                  alt="KSRCT Campus"
                  className="w-full h-40 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041d3d]/90 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[11px] font-black text-[#ffa266]">Tiruchengode Autonomous Campus</span>
                </div>
              </div>

              {/* Verified Feature Highlights */}
              <div className="space-y-2 text-xs text-blue-100 font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs">✓</div>
                  <span>Multi-Tier Institutional Approval Workflow</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#f37021]/30 text-[#ffb180] flex items-center justify-center font-bold text-xs">✓</div>
                  <span>Instant On-Duty & Leave Request Tracking</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/15 text-[11px] text-blue-200 flex justify-between items-center z-10">
              <span className="font-medium text-blue-200">Autonomous • EEE Dept</span>
              <a href="https://ksrct.ac.in" target="_blank" rel="noreferrer" className="text-[#ffa266] font-bold hover:underline">
                ksrct.ac.in
              </a>
            </div>
          </div>

          {/* Right Side: Clean Light Box Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white text-slate-800 space-y-6">
            <div className="space-y-6">
              
              {/* Role Selector */}
              {!isRegister && (
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setLoginType('STUDENT'); setError(''); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      loginType === 'STUDENT'
                        ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginType('STAFF'); setError(''); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      loginType === 'STAFF'
                        ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginType('CREATOR'); setError(''); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      loginType === 'CREATOR'
                        ? 'bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>
              )}

              {/* Clean Title */}
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {isRegister ? 'Student Registration' : `${loginType === 'CREATOR' ? 'Admin' : loginType} Sign In`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isRegister
                    ? 'Fill in your details to create your student portal account'
                    : `Enter your institutional credentials to continue`}
                </p>
              </div>

              {/* Error Callout */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2 animate-scale-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Form */}
              {!isRegister ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Quick Demo Creator Login Chip */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-orange-50/70 border border-orange-200">
                    <span className="text-[10px] uppercase font-bold text-[#f37021] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#f37021]" /> Quick Creator Login (Click to Auto-fill)
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => { setLoginType('CREATOR'); setEmail('creator@ksrct.ac.in'); setPassword('Creator@123'); setError(''); }}
                        className="px-3 py-1.5 text-xs font-bold bg-white text-[#f37021] hover:bg-orange-100 border border-orange-200 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        ⚡ Creator / Admin (`creator@ksrct.ac.in`)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={loginType === 'STUDENT' ? 'student1@ksrct.ac.in' : loginType === 'STAFF' ? 'staff@ksrct.ac.in' : 'creator@ksrct.ac.in'}
                        className="w-full pl-10 pr-3.5 py-3 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] focus:ring-2 focus:ring-[#f37021]/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-3 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] focus:ring-2 focus:ring-[#f37021]/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#f37021] to-[#d8580d] hover:from-[#ff8133] hover:to-[#e06214] text-white text-xs font-black shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Signing in...' : `Sign In to Portal`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Student Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Student Name"
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Register No *</label>
                      <input
                        type="text"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder="24EE042"
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase font-mono focus:bg-white focus:border-[#f37021] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Email *</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@ksrct.ac.in"
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Password *</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Academic Year</label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none cursor-pointer"
                      >
                        <option value="I">1st Year (I)</option>
                        <option value="II">2nd Year (II)</option>
                        <option value="III">3rd Year (III)</option>
                        <option value="IV">4th Year (IV)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Section</label>
                      <select
                        value={regSection}
                        onChange={(e) => setRegSection(e.target.value)}
                        className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none cursor-pointer"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>
                  </div>

                  {/* Mentor */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Select Mentor</label>
                    <select
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(e.target.value)}
                      className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none cursor-pointer"
                    >
                      <option value="">Choose Mentor...</option>
                      {availableMentors.map((m) => (
                        <option key={m.id} value={m.id} disabled={!m.isAvailable}>
                          {m.name} ({m.currentCount}/{m.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Advisor */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Select Class Advisor</label>
                    <select
                      value={selectedAdvisor}
                      onChange={(e) => setSelectedAdvisor(e.target.value)}
                      className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#f37021] outline-none cursor-pointer"
                    >
                      <option value="">Choose Class Advisor...</option>
                      {availableAdvisors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#f37021] to-[#d8580d] text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    {loading ? 'Registering...' : 'Register Account'}
                  </button>
                </form>
              )}

              {/* Student Self-Registration Toggle */}
              {loginType === 'STUDENT' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="text-xs font-bold text-[#f37021] hover:text-[#d8580d] transition-colors cursor-pointer"
                  >
                    {isRegister
                      ? '← Back to Student Sign In'
                      : 'New Student? Create an account →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        K.S. Rangasamy College of Technology — Department of Electrical & Electronics Engineering © 2026
      </footer>
    </div>
  );
};

export default Login;
