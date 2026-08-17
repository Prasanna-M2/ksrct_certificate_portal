import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  CheckSquare,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [charts, setCharts] = useState<{
    statusOverview: Array<{ name: string; value: number; color: string }>;
    monthlyUploads: Array<{ month: string; count: number }>;
    categoryDistribution: Array<{ category: string; count: number }>;
  }>({
    statusOverview: [],
    monthlyUploads: [],
    categoryDistribution: [],
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/hod');
      if (res.data.success) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setRecentActivities(res.data.recentActivities);
      }
    } catch (err) {
      console.error('Failed to fetch HOD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">HOD Dashboard</h1>
          <p className="text-xs text-ksrct-orange font-bold mt-1 uppercase tracking-wider">
            Department of {user?.department}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/hod/pending"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-xl shadow-md shadow-ksrct-navy/20 transition-all"
          >
            <CheckSquare className="w-4 h-4 text-ksrct-orange" />
            <span>Verify Pending ({stats.pending})</span>
          </Link>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">{stats.totalStudents}</p>
            <p className="text-[11px] font-semibold text-slate-500">Total Students</p>
          </div>
        </div>

        {/* Total Certificates */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">{stats.totalCertificates}</p>
            <p className="text-[11px] font-semibold text-slate-500">Total Certificates</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">{stats.pending}</p>
            <p className="text-[11px] font-semibold text-slate-500">Pending Review</p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">{stats.approved}</p>
            <p className="text-[11px] font-semibold text-slate-500">Approved</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">{stats.rejected}</p>
            <p className="text-[11px] font-semibold text-slate-500">Rejected</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Overview Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Certificate Status Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.statusOverview.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center items-center gap-6 pt-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Approved ({stats.approved})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Pending ({stats.pending})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Rejected ({stats.rejected})</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Category Breakdown</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f2942" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities Audit Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-ksrct-orange" />
            <h2 className="text-sm font-bold text-slate-800">Recent Department Activity Feed</h2>
          </div>
          <Link to="/hod/reports" className="text-xs font-bold text-ksrct-navy hover:underline">
            Generate Full Reports &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No activity logged yet.</p>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between text-xs gap-4">
                <div>
                  <p className="font-bold text-slate-800">{act.description}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">By: {act.userName || 'System'}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
