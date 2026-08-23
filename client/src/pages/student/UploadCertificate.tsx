import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Upload, FileText, Calendar, Tag, AlertCircle, CheckCircle2, X, Building2, Paperclip } from 'lucide-react';

const CATEGORIES = [
  'NPTEL',
  'Internship',
  'Workshop',
  'Hackathon',
  'NSS',
  'NCC',
  'Sports',
  'Technical',
  'Academic',
  'Certification',
  'Other',
];

export const UploadCertificate: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('NPTEL');
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleFileChange = (selectedFile: File | null, isSupporting = false) => {
    setErrorMsg('');
    if (!selectedFile) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(selectedFile.type) && !allowedExts.includes(ext)) {
      setErrorMsg('Invalid file format. Only PDF, JPG, JPEG, and PNG files are allowed.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10 MB limit.');
      return;
    }

    if (isSupporting) {
      setSupportingFile(selectedFile);
    } else {
      setFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !category || !issuedDate || !file) {
      setErrorMsg('Please fill all required fields and upload your certificate file.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('eventName', eventName.trim() || title.trim());
      formData.append('organization', organization.trim() || 'N/A');
      formData.append('eventDate', eventDate);
      formData.append('issuedDate', issuedDate);
      formData.append('description', description.trim());
      formData.append('file', file);
      if (supportingFile) {
        formData.append('supportingFile', supportingFile);
      }

      const res = await api.post('/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast(`Certificate ${res.data.certificate.certificateId || ''} submitted! Sent to Mentor for review.`, 'success');
        navigate('/my-certificates');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Student Certificate Submission</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dashboard &gt; Submit Certificate
          </p>
        </div>
        <div className="bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-xl border border-amber-200 font-semibold flex items-center">
          Workflow: Student → Mentor → Advisor → HOD → Approved
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Certificate Title *</label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NPTEL - Electric Vehicles & Energy Storage"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Category *</label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Event / Course Name</label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. National Level Technical Symposium 2026"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Organization / Institution */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Organization / Institution</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. IIT Madras / IEEE / Anna University"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Event Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Event Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Issue Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Certificate Issue Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
                required
              />
            </div>
          </div>
        </div>

        {/* Certificate Upload Zone */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Certificate Document Upload * (PDF, JPG, JPEG, PNG)</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
              dragActive
                ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800">{file.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-900/10 text-slate-900 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Drag & Drop certificate file here</p>
                <p className="text-[11px] text-slate-400 my-1">or</p>
                <label className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors">
                  <span>Choose Certificate File</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-3">PDF, JPG, JPEG, PNG (Max 10MB)</p>
              </>
            )}
          </div>
        </div>

        {/* Optional Supporting Document */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Optional Supporting Document (e.g. Schedule / Letter)</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors flex items-center">
              <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Attach Supporting Doc</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0], true)}
                className="hidden"
              />
            </label>
            {supportingFile && (
              <span className="text-xs text-emerald-600 font-semibold truncate max-w-[250px]">
                ✓ {supportingFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Description / Remarks */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Description / Achievement Remarks</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter additional details regarding scores, rank, or course learning outcome..."
            className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>

        {/* Form Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting Request...' : 'Submit Certificate for Mentor Review'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setEventName('');
              setOrganization('');
              setDescription('');
              setFile(null);
              setSupportingFile(null);
            }}
            className="px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadCertificate;
