import React, { useState } from 'react';
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

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

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
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fill buttons
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 font-sans">
      {/* Left Column: Institutional Visual & Branding */}
      <div className="relative lg:w-7/12 bg-ksrct-navy text-white flex flex-col justify-between p-8 lg:p-14 overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('/assets/ksrct-campus.jpg')` }} />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg">
            <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-tight">
              K.S. RANGASAMY COLLEGE OF TECHNOLOGY
            </h1>
            <p className="text-xs text-ksrct-orange font-semibold tracking-wide uppercase">
              (Autonomous) | Tiruchengode - 637 215, Tamil Nadu
            </p>
          </div>
        </div>

        {/* Middle Hero Content */}
        <div className="relative z-10 my-12 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-ksrct-orange/20 text-ksrct-orange border border-ksrct-orange/30">
            <UserCheck className="w-3.5 h-3.5" />
            Official Certificate Portal
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Student Certificate Management Portal
          </h2>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Upload, verify, and track academic & extra-curricular certificates with ease. Institutional certificate verification workflow for students, HODs, and administrators.
          </p>
        </div>

        {/* Bottom Footer Info */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} K.S. Rangasamy College of Technology. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('STUDENT'); }} className="hover:text-ksrct-orange">Demo Student</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('HOD'); }} className="hover:text-ksrct-orange">Demo HOD</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); fillDemo('ADMIN'); }} className="hover:text-ksrct-orange">Demo Admin</a>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form Card */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-ksrct-navy">Welcome Back!</h3>
            <p className="text-xs text-slate-500 font-medium">Please login to your portal account</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Role Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
              >
                <option value="STUDENT">Student</option>
                <option value="HOD">HOD / Verifier</option>
                <option value="ADMIN">Administrator</option>
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

          {/* Quick Demo Fill Credentials Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-ksrct-orange" />
              <span>Instant Demo Login Credentials:</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('STUDENT')}
                className="px-2 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-ksrct-orange hover:text-white rounded-xl transition-all border border-slate-200 text-center"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('HOD')}
                className="px-2 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-ksrct-navy hover:text-white rounded-xl transition-all border border-slate-200 text-center"
              >
                HOD Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="px-2 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all border border-slate-200 text-center"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
