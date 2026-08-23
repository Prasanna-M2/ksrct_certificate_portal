import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { OdRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { RequestDetailsModal } from '../../components/common/RequestDetailsModal';
import { OfficialOdLeaveFormModal } from '../../components/common/OfficialOdLeaveFormModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Calendar,
  Building2,
  Clock,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  MapPin,
  Tag,
  UserCheck,
  RefreshCw,
  Download,
  Printer,
  Briefcase,
  HeartPulse,
} from 'lucide-react';

const EVENT_TYPES = [
  'Technical Symposium',
  'Paper Presentation',
  'Workshop / Hands-on',
  'Hackathon / Coding Contest',
  'Conference',
  'Sports Event',
  'Cultural Event',
  'NSS / NCC Activity',
  'Internship On-Duty',
  'Industrial Visit',
  'Other',
];

const LEAVE_TYPES = [
  'Medical Leave',
  'Personal / Family Leave',
  'Emergency Leave',
  'Special Academic Leave',
  'Other Leave',
];

export const StudentOdForm: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeMode, setActiveMode] = useState<'OD' | 'LEAVE'>('OD');
  const [odHistory, setOdHistory] = useState<OdRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OD & Leave Form Fields
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Technical Symposium');
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');
  const [odDate, setOdDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Modals
  const [selectedOd, setSelectedOd] = useState<OdRequest | null>(null);
  const [downloadModalOd, setDownloadModalOd] = useState<OdRequest | null>(null);

  const fetchOdHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/od');
      if (res.data?.success && Array.isArray(res.data.odRequests)) {
        setOdHistory(res.data.odRequests);
      }
    } catch (err: any) {
      console.error('Error fetching OD history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isLeaveMode = activeMode === 'LEAVE';
    const mainTitle = isLeaveMode ? `Leave Request (${leaveType})` : eventName.trim();

    if (!mainTitle || !odDate || !purpose.trim()) {
      setErrorMsg(`Please fill in required fields: ${isLeaveMode ? 'Leave Reason & Dates' : 'Event Name, Date, and Purpose'}.`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('requestType', isLeaveMode ? 'LEAVE' : 'EVENT_OD');
      formData.append('eventName', mainTitle);
      formData.append('eventType', isLeaveMode ? leaveType : eventType);
      formData.append('organization', isLeaveMode ? 'Personal / Medical' : organization.trim() || 'N/A');
      formData.append('venue', isLeaveMode ? 'N/A' : venue.trim() || 'College Campus');
      formData.append('odDate', odDate);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('numberOfDays', numberOfDays.toString());
      formData.append('purpose', purpose.trim());
      formData.append('description', description.trim());
      formData.append('coordinator', coordinator.trim());

      if (file) {
        formData.append('supportingFile', file);
      }

      const res = await api.post('/od', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        showToast(
          `${isLeaveMode ? 'Leave Application' : 'OD Request'} ${res.data.odRequest?.odId || ''} submitted successfully! Sent to Mentor for review.`,
          'success'
        );
        setEventName('');
        setOrganization('');
        setVenue('');
        setPurpose('');
        setDescription('');
        setCoordinator('');
        setFile(null);
        fetchOdHistory();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
            STUDENT SERVICES — ON-DUTY & LEAVE PORTAL
          </span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
            Apply for On-Duty (OD) & Student Leave Permission
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Strict Approval Workflow: <strong>Student → Mentor → Advisor → HOD → Official Sanctioned Form</strong>
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 text-xs px-3.5 py-2 rounded-2xl border border-emerald-200 font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="font-bold">{user?.name} ({user?.registerNumber || '24EE042'})</div>
            <div className="text-[10px] text-emerald-700">{user?.department}</div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        {/* Toggle Mode Tabs (OD vs Leave) */}
        <div className="flex border-b border-slate-200 pb-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveMode('OD')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeMode === 'OD'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>On-Duty (OD) Application</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('LEAVE')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeMode === 'LEAVE'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <span>Student Leave Application</span>
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            {activeMode === 'OD' ? 'On-Duty Application Form' : 'Official Student Leave Form'}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Auto ID Format: {activeMode === 'OD' ? 'OD-2026-XXXX' : 'LEAVE-2026-XXXX'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMode === 'OD' ? (
              <>
                {/* Event Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Event / Activity Name *</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. National Level Technical Symposium"
                    className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                    required
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Event Type *</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50 cursor-pointer"
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Organization / Host Institution</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. IEEE Student Branch / PSG Tech"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                    />
                  </div>
                </div>

                {/* Venue */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Venue</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Main Auditorium / External Campus"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Leave Type */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Leave Category / Type *</label>
                  <div className="relative">
                    <HeartPulse className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50 cursor-pointer"
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* OD / Leave Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {activeMode === 'OD' ? 'OD Date *' : 'Leave Start Date *'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="date"
                  value={odDate}
                  onChange={(e) => setOdDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                  required
                />
              </div>
            </div>

            {/* Timing & Days */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Start Time</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">End Time</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="05:00 PM"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold"
                />
              </div>
            </div>

            {/* Faculty Coordinator */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Faculty / Event Coordinator</label>
              <input
                type="text"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
                placeholder="e.g. Dr. S. Sundaram (Faculty Advisor)"
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
              />
            </div>

            {/* Supporting Document */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {activeMode === 'LEAVE' ? 'Medical Certificate / Document (Optional)' : 'Event Proof / Supporting File (Optional)'}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              {activeMode === 'LEAVE' ? 'Detailed Leave Purpose / Medical Reason *' : 'Purpose of On-Duty *'}
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={activeMode === 'LEAVE' ? 'Enter reason for medical or personal leave...' : 'State the core objective or paper presentation topic...'}
              className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-ksrct-navy"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {submitting ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit {activeMode === 'LEAVE' ? 'Leave Application' : 'OD Application'} to Mentor</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* OD & LEAVE HISTORY TABLE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your OD & Leave Applications History</h3>
            <p className="text-xs text-slate-500">Track multi-level status across Mentor, Advisor, and HOD</p>
          </div>
          <button
            onClick={fetchOdHistory}
            className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-3 px-3">OD / Leave ID</th>
                <th className="py-3 px-3">Event / Purpose</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Date & Days</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading history...</td>
                </tr>
              ) : odHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No OD or leave applications submitted yet.</td>
                </tr>
              ) : (
                odHistory.map((od) => (
                  <tr key={od.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {od.odId || `OD-${od.id.substring(0, 6)}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <div>{od.eventName}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{od.organization}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600">{od.eventType || od.requestType}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {od.odDate} ({od.numberOfDays}d)
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {od.currentStage === 'MENTOR_REVIEW'
                        ? '● Mentor Review'
                        : od.currentStage === 'ADVISOR_REVIEW'
                        ? '● Advisor Review'
                        : od.currentStage === 'HOD_REVIEW'
                        ? '● HOD Review'
                        : '✓ Completed'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={od.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Download Form Button for Approved Requests */}
                        {od.status === 'APPROVED' && (
                          <button
                            onClick={() => setDownloadModalOd(od)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Download Approved Form"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> Download Form
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOd(od)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Timeline Modal */}
      {selectedOd && (
        <RequestDetailsModal
          isOpen={Boolean(selectedOd)}
          onClose={() => setSelectedOd(null)}
          request={selectedOd}
          requestType="OD"
          currentUser={{
            id: user?.id || '',
            role: user?.role || 'STUDENT',
            name: user?.name || '',
          }}
          onRefresh={fetchOdHistory}
        />
      )}

      {/* Printable Official Form Modal */}
      {downloadModalOd && (
        <OfficialOdLeaveFormModal
          isOpen={Boolean(downloadModalOd)}
          onClose={() => setDownloadModalOd(null)}
          odRequest={downloadModalOd}
        />
      )}
    </div>
  );
};

export default StudentOdForm;
