import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { Role } from '../types';
import { Lock, Mail, UserCheck, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, token, login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // If user is already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoRole: Role) => {
    if (demoRole === 'STUDENT') {
      setEmail('prasanna@student.ksrct.ac.in');
      setPassword('Student@123');
      setRole('STUDENT');
    } else if (demoRole === 'HOD') {
      setEmail('hod.eee@ksrct.ac.in');
      setPassword('Hod@123');
      setRole('HOD');
    } else if (demoRole === 'ADMIN') {
      setEmail('admin@ksrct.ac.in');
      setPassword('Admin@123');
      setRole('ADMIN');
    }
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-100 font-sans overflow-x-hidden">
      {/* Left Column: Institutional Visual & Branding */}
      <div className="relative lg:w-7/12 bg-ksrct-navy text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('/assets/ksrct-campus.jpg')` }} />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg flex-shrink-0">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-white leading-tight">
              K.S. RANGASAMY COLLEGE OF TECHNOLOGY
            </h1>
            <p className="text-[11px] sm:text-xs text-ksrct-orange font-semibold tracking-wide uppercase mt-0.5">
              (Autonomous) | Tiruchengode - 637 215, Tamil Nadu
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-8 lg:my-12 space-y-4 sm:space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-ksrct-orange/20 text-ksrct-orange border border-ksrct-orange/30">
            <UserCheck className="w-3.5 h-3.5" />
            Official Certificate Management Portal
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Student Certificate Verification System
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
            Seamlessly upload, verify, and track academic, NPTEL, internship, and extra-curricular certificates with real-time institutional approval workflows.
          </p>
        </div>

        {/* Bottom Footer Info */}
        <div className="relative z-10 text-[11px] sm:text-xs text-slate-400 border-t border-white/10 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} K.S. Rangasamy College of Technology. All rights reserved.</p>
          <div className="flex gap-3 text-xs font-medium">
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('STUDENT'); }} className="hover:text-ksrct-orange transition-colors">Student Demo</a>
            <span className="text-slate-600">•</span>
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('HOD'); }} className="hover:text-ksrct-orange transition-colors">HOD Demo</a>
            <span className="text-slate-600">•</span>
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('ADMIN'); }} className="hover:text-ksrct-orange transition-colors">Admin Demo</a>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="lg:w-5/12 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-ksrct-navy">Welcome Back!</h3>
            <p className="text-xs text-slate-500 font-medium">Please login to access your portal account</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50 cursor-pointer"
              >
                <option value="STUDENT">Student Login</option>
                <option value="HOD">HOD / Verifier Login</option>
                <option value="ADMIN">Administrator Login</option>
              </select>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter.email@ksrct.ac.in"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-xl shadow-lg shadow-ksrct-navy/20 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Login to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Accounts */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-ksrct-orange" />
              <span>Quick Instant Login Fill:</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('STUDENT')}
                className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-ksrct-orange hover:text-white rounded-xl transition-all border border-slate-200 text-center truncate"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemo('HOD')}
                className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-ksrct-navy hover:text-white rounded-xl transition-all border border-slate-200 text-center truncate"
              >
                HOD
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all border border-slate-200 text-center truncate"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
