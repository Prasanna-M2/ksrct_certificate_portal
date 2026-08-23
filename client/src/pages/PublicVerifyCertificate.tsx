import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, Building, ExternalLink, CheckCircle2, ArrowLeft } from 'lucide-react';

interface VerificationResult {
  code: string;
  title: string;
  category: string;
  description?: string;
  status: string;
  issuedDate: string;
  studentName: string;
  registerNumber?: string;
  department: string;
  year?: string;
  verifiedBy?: string;
  issuedBy?: string;
  issuedAt?: string;
}

export const PublicVerifyCertificate: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [cert, setCert] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      if (!code) return;
      try {
        setLoading(true);
        const res = await api.get(`/certificates/verify-code/${code}`);
        if (res.data && res.data.success && res.data.certificate) {
          setValid(res.data.valid);
          setCert(res.data.certificate);
        } else {
          setValid(false);
          setErrorMsg(res.data?.message || 'Certificate verification failed.');
        }
      } catch (err: any) {
        setValid(false);
        setErrorMsg(err.response?.data?.message || 'Certificate could not be verified in the institutional registry.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-ksrct-navy text-white p-6 sm:p-8 flex items-center justify-between border-b border-ksrct-navyLight">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
              <img src="/assets/ksrct-logo.png" alt="KSRCT Logo" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                K.S. RANGASAMY COLLEGE OF TECHNOLOGY
              </h1>
              <p className="text-[11px] text-ksrct-orange font-semibold tracking-wide uppercase">
                Official Institutional Certificate Verification
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal Login</span>
          </Link>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-ksrct-navy border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Querying Institutional Blockchain Registry...</p>
            </div>
          ) : valid && cert ? (
            <div className="space-y-6">
              {/* Verified Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-emerald-900">CERTIFICATE VERIFIED</h2>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-200 text-emerald-900 rounded-md uppercase">
                      VALID
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    This certificate is authentic and recorded in the official KSRCT institutional repository.
                  </p>
                </div>
              </div>

              {/* Certificate Summary Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Certificate Title</span>
                    <h3 className="text-lg font-bold text-ksrct-navy mt-0.5">{cert.title}</h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold bg-ksrct-navy text-white rounded-lg">
                    {cert.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-ksrct-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-medium">Student Name</span>
                      <p className="font-bold text-slate-800">{cert.studentName}</p>
                      {cert.registerNumber && (
                        <p className="text-[11px] text-slate-500">Reg No: {cert.registerNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-ksrct-navy flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-medium">Department</span>
                      <p className="font-bold text-slate-800">{cert.department}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-medium">Issue Date</span>
                      <p className="font-bold text-slate-800">{cert.issuedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-medium">Verified Authority</span>
                      <p className="font-bold text-slate-800">{cert.verifiedBy || 'KSRCT Verifier'}</p>
                    </div>
                  </div>
                </div>

                {cert.description && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Description</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cert.description}</p>
                  </div>
                )}
              </div>

              {/* Verification Metadata Footer */}
              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>Verification Code: <strong className="font-mono text-slate-800">{cert.code}</strong></span>
                <span>Issuer: <strong>K.S. Rangasamy College of Technology</strong></span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {errorMsg || 'This certificate code could not be verified in the KSRCT institutional records. Please verify the code or scan the QR code again.'}
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight transition-colors"
              >
                <span>Back to Portal Login</span>
              </Link>
            </div>
          )}
        </div>

        {/* Institutional Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} K.S. Rangasamy College of Technology (Autonomous), Tiruchengode.
        </div>
      </div>
    </div>
  );
};
