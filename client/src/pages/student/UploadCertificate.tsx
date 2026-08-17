import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Upload, FileText, Calendar, Tag, AlertCircle, CheckCircle2, X } from 'lucide-react';

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
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleFileChange = (selectedFile: File | null) => {
    setErrorMsg('');
    if (!selectedFile) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10 MB limit.');
      return;
    }

    setFile(selectedFile);
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
      setErrorMsg('Please fill all required fields and select a valid file.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('issuedDate', issuedDate);
      formData.append('description', description.trim());
      formData.append('file', file);

      const res = await api.post('/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Certificate uploaded successfully! Pending HOD verification.', 'success');
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
      {/* Breadcrumb Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Upload Certificate</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Dashboard &gt; Upload Certificate
        </p>
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
                placeholder="e.g. NPTEL - Internet of Things"
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
        </div>

        {/* Issue Date */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Date of Issue *</label>
          <div className="relative max-w-md">
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

        {/* Drag and Drop Zone */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Upload File *</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
              dragActive
                ? 'border-ksrct-orange bg-orange-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-slate-50 hover:border-ksrct-navy'
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
                <div className="w-12 h-12 rounded-full bg-ksrct-navy/10 text-ksrct-navy flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Drag & Drop file here</p>
                <p className="text-[11px] text-slate-400 my-1">or</p>
                <label className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-xl shadow-sm transition-colors">
                  <span>Choose File</span>
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

        {/* Description / Remarks */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">Description / Details (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter additional details regarding the certification or issuer..."
            className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy focus:outline-none bg-slate-50"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-xl shadow-lg shadow-ksrct-navy/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Uploading Certificate...' : 'Upload Certificate'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setFile(null);
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
