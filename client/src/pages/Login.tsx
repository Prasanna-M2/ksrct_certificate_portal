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
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  GraduationCap,
  User,
  Phone,
  ArrowLeft,
  KeyRound,
  Check,
  Search,
  Loader2,
  HelpCircle,
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type RegCheckStatus = 'IDLE' | 'CHECKING' | 'SETUP_AVAILABLE' | 'ALREADY_ACTIVE' | 'NOT_FOUND';

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register / Account Setup State
  const [regNumber, setRegNumber] = useState('');
  const [regStatus, setRegStatus] = useState<RegCheckStatus>('IDLE');
  const [checkingReg, setCheckingReg] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<any>(null);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regYear, setRegYear] = useState('II');
  const [regSection, setRegSection] = useState('A');
  const [regPhone, setRegPhone] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  // Mentor & Advisor Options
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [availableAdvisors, setAvailableAdvisors] = useState<any[]>([]);

  // Forgot Password State
  const [forgotIdentity, setForgotIdentity] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotUserName, setForgotUserName] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const { user, token, login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  // Load mentors & advisors when on register view
  useEffect(() => {
    if (authMode === 'REGISTER') {
      api.get('/users/mentors')
        .then((res) => {
          if (res.data?.success) {
            setAvailableMentors(res.data.mentors || []);
          }
        })
        .catch(() => {});

      api.get('/users/advisors')
        .then((res) => {
          if (res.data?.success) {
            setAvailableAdvisors(res.data.advisors || []);
          }
        })
        .catch(() => {});
    }
  }, [authMode]);

  // Check Register Number in Department Database
  const handleCheckRegisterNumber = async (regToSearch?: string) => {
    const query = (regToSearch || regNumber).trim().toUpperCase();
    if (!query) {
      setError('Please enter your official Register Number.');
      return;
    }

    try {
      setCheckingReg(true);
      setError('');
      const res = await api.post('/auth/check-register', { registerNumber: query });

      if (res.data?.success) {
        if (res.data.status === 'SETUP_AVAILABLE') {
          setRegStatus('SETUP_AVAILABLE');
          const st = res.data.student;
          setVerifiedStudent(st);
          setRegName(st.name || '');
          setRegEmail(st.email || `${query.toLowerCase()}@ksrct.ac.in`);
          setRegYear(st.year || 'II');
          setRegSection(st.section || 'A');
          setRegPhone(st.phone || '');
          setSelectedMentor(st.mentorId || '');
          setSelectedAdvisor(st.advisorId || '');
        } else if (res.data.status === 'ALREADY_ACTIVE') {
          setRegStatus('ALREADY_ACTIVE');
          setVerifiedStudent(res.data.student);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setRegStatus('NOT_FOUND');
        setVerifiedStudent(null);
      } else {
        setError(err.response?.data?.message || 'Failed to verify register number.');
      }
    } finally {
      setCheckingReg(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your institutional email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.data && res.data.success && res.data.user && res.data.token) {
        login(res.data.token, res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Complete Registration / Account Setup Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNumber.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/complete-setup', {
        registerNumber: regNumber.trim().toUpperCase(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        phone: regPhone.trim() || null,
        mentorId: selectedMentor || undefined,
        advisorId: selectedAdvisor || undefined,
      });

      if (res.data && res.data.success && res.data.token && res.data.user) {
        showToast(res.data.message || 'Account setup complete! Welcome to KSRCT EEE Portal.', 'success');
        login(res.data.token, res.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.data?.message || 'Setup failed. Please check your details.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please verify your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 1: Lookup
  const handleForgotLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!forgotIdentity.trim()) {
      setError('Please enter your Register Number or Email Address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { identity: forgotIdentity.trim() });
      if (res.data?.success) {
        setForgotUserId(res.data.userId);
        setForgotUserName(res.data.name);
        setForgotStep(2);
        showToast(`Account verified for ${res.data.name}. Set your new password.`, 'success');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'No matching account found. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 2: Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        userId: forgotUserId,
        newPassword: forgotNewPassword,
      });

      if (res.data?.success) {
        showToast('Password reset successfully! Please sign in with your new password.', 'success');
        setAuthMode('LOGIN');
        setPassword(forgotNewPassword);
        setForgotStep(1);
        setForgotIdentity('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const resetRegisterState = () => {
    setRegNumber('');
    setRegStatus('IDLE');
    setVerifiedStudent(null);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#0a4c95] selection:text-white">
      {/* Top Header */}
      <header className="px-6 sm:px-12 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3.5 select-none">
          <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-xs">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Seal" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none uppercase flex items-center gap-2">
              <span>K.S. Rangasamy College of Technology</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                AUTONOMOUS
              </span>
            </h1>
            <p className="text-[11px] font-semibold text-[#0a4c95] mt-1 tracking-wide">
              Department of Electrical & Electronics Engineering
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0a4c95]" />
          <span>Official Portal</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.05)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Side: Clean Institutional Info (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#0a4c95] border border-slate-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#f37021]" />
                <span>KSRCT EEE PORTAL</span>
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  Certificate & Academic Management Portal
                </h2>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2.5">
                  Official platform for student certificate verification, academic workflow records, and faculty mentorship management.
                </p>
              </div>

              {/* Campus Visual Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                <img
                  src="/ksrct-building.jpg"
                  alt="KSRCT Campus"
                  className="w-full h-36 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[11px] font-bold text-white">Tiruchengode Autonomous Campus</span>
                </div>
              </div>

              {/* Institutional Feature Highlights */}
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Institutional Multi-Tier Verification Workflow</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#f37021] flex-shrink-0" />
                  <span>Encrypted Digital Academic Records & Auditing</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
              <span className="font-medium">Autonomous • EEE Dept</span>
              <a href="https://ksrct.ac.in" target="_blank" rel="noreferrer" className="text-[#0a4c95] font-bold hover:underline">
                ksrct.ac.in
              </a>
            </div>
          </div>

          {/* Right Side: Form Container (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
            <div className="space-y-5 max-w-md mx-auto w-full">
              
              {/* Top Navigation / Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {authMode === 'LOGIN' && <span>Sign In</span>}
                    {authMode === 'REGISTER' && (
                      <>
                        <GraduationCap className="w-6 h-6 text-[#0a4c95]" />
                        <span>Student Registration</span>
                      </>
                    )}
                    {authMode === 'FORGOT_PASSWORD' && (
                      <>
                        <KeyRound className="w-6 h-6 text-[#0a4c95]" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {authMode === 'LOGIN' && 'Enter your institutional credentials to access the management portal.'}
                    {authMode === 'REGISTER' && 'Link and activate your pre-registered student account.'}
                    {authMode === 'FORGOT_PASSWORD' && 'Verify your account and set a new password.'}
                  </p>
                </div>

                {authMode !== 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('LOGIN'); resetRegisterState(); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer p-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              {/* Error Callout */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2 animate-scale-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 1. SIGN IN VIEW */}
              {/* ---------------------------------------------------- */}
              {authMode === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Institutional Email or Register Number *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. 2403737710521034 or institutional email"
                        className="w-full pl-10 pr-3.5 py-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] focus:ring-2 focus:ring-[#0a4c95]/10 outline-none transition-all placeholder:text-slate-400"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('FORGOT_PASSWORD'); setError(''); }}
                        className="text-[11px] font-bold text-[#0a4c95] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] focus:ring-2 focus:ring-[#0a4c95]/10 outline-none transition-all placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0a4c95] hover:bg-[#083b74] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Register Option */}
                  <div className="pt-3 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('REGISTER'); resetRegisterState(); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0a4c95] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer shadow-xs group"
                    >
                      <UserPlus className="w-4 h-4 text-[#0a4c95] transition-transform group-hover:scale-110" />
                      <span>New Student? Register Account</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2. STUDENT REGISTRATION & ACCOUNT LINKING VIEW */}
              {/* ---------------------------------------------------- */}
              {authMode === 'REGISTER' && (
                <div className="space-y-4">
                  {/* Step 1: Register Number Search Box */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Enter Institutional Register Number *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <GraduationCap className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={regNumber}
                          onChange={(e) => {
                            setRegNumber(e.target.value);
                            setRegStatus('IDLE');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCheckRegisterNumber();
                            }
                          }}
                          placeholder="e.g. 2403737710521040"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCheckRegisterNumber()}
                        disabled={checkingReg || !regNumber.trim()}
                        className="px-4 py-2.5 rounded-xl bg-[#0a4c95] hover:bg-[#083b74] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                      >
                        {checkingReg ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contextual Feedback Banners */}
                  {regStatus === 'ALREADY_ACTIVE' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 animate-scale-in">
                      <div className="flex items-start gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>This register number ({regNumber}) is already linked to an active account.</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        If you have already set up your account, please log in with your credentials or reset your password.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('LOGIN');
                            setEmail(verifiedStudent?.email || `${regNumber.toLowerCase()}@ksrct.ac.in`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0a4c95] text-white text-xs font-bold hover:bg-[#083b74] cursor-pointer"
                        >
                          Sign In Now
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('FORGOT_PASSWORD');
                            setForgotIdentity(regNumber);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  )}

                  {regStatus === 'NOT_FOUND' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5 animate-scale-in">
                      <div className="flex items-start gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>Register number not found in EEE department master records.</span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        Please verify your 16-digit register number or contact the Department of Electrical & Electronics Engineering administration.
                      </p>
                    </div>
                  )}

                  {/* CASE 1: Student Record Found -> Complete Setup */}
                  {regStatus === 'SETUP_AVAILABLE' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-scale-in max-h-[360px] overflow-y-auto pr-1">
                      
                      {/* Verified Badge */}
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-emerald-900">
                            Student Record Found: {regName}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Year {regYear} (Section {regSection}) • Create your password to link your account
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">Full Name</label>
                          <div className="relative">
                            <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="text"
                              value={regName}
                              readOnly
                              className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">Institutional Email *</label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="name@ksrct.ac.in"
                              className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">Create Password *</label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Min 6 characters"
                              className="w-full pl-8 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">Confirm Password *</label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Phone Number (Optional)</label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                          />
                        </div>
                      </div>

                      {/* Mentor Selector */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Faculty Mentor (Optional)</label>
                        <select
                          value={selectedMentor}
                          onChange={(e) => setSelectedMentor(e.target.value)}
                          className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none cursor-pointer"
                        >
                          <option value="">Choose Faculty Mentor...</option>
                          {availableMentors.map((m) => (
                            <option key={m.id} value={m.id} disabled={!m.isAvailable}>
                              {m.name} ({m.currentCount}/{m.capacity} mentees)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0a4c95] hover:bg-[#083b74] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{loading ? 'Linking & Activating...' : 'Verify & Complete Account Setup'}</span>
                      </button>
                    </form>
                  )}

                  {/* Bottom Return Link */}
                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('LOGIN'); resetRegisterState(); }}
                      className="text-xs font-bold text-[#0a4c95] hover:underline cursor-pointer"
                    >
                      ← Already have credentials? Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 3. FORGOT PASSWORD VIEW */}
              {/* ---------------------------------------------------- */}
              {authMode === 'FORGOT_PASSWORD' && (
                <div className="space-y-4">
                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotLookup} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Register Number or Email *
                        </label>
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={forgotIdentity}
                            onChange={(e) => setForgotIdentity(e.target.value)}
                            placeholder="e.g. 2403737710521040 or email@ksrct.ac.in"
                            className="w-full pl-10 pr-3.5 py-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#0a4c95] hover:bg-[#083b74] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>{loading ? 'Verifying...' : 'Find Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-3.5 animate-scale-in">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                        <p className="font-bold">Resetting Password for: {forgotUserName}</p>
                        <p className="text-[11px] text-blue-700">Enter a new secure password for your account.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">New Password *</label>
                        <input
                          type="password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                          required
                          autoFocus
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Confirm New Password *</label>
                        <input
                          type="password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#0a4c95] outline-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-[#0a4c95] hover:bg-[#083b74] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{loading ? 'Saving New Password...' : 'Save New Password & Sign In'}</span>
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('LOGIN'); resetRegisterState(); }}
                      className="text-xs font-bold text-[#0a4c95] hover:underline cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-400 font-medium border-t border-slate-100 bg-white">
        K.S. Rangasamy College of Technology — Department of Electrical & Electronics Engineering © 2026
      </footer>
    </div>
  );
};

export default Login;
