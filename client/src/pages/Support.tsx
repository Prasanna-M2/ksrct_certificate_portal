import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { HelpCircle, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I upload a certificate?',
    a: 'Go to "Upload Certificate" in the sidebar menu. Enter the certificate title, category, issue date, select your certificate PDF or image file (max 10MB), and click "Upload Certificate".',
  },
  {
    q: 'How long does verification take?',
    a: 'Verification is typically completed by your Department HOD within 1 to 3 working days.',
  },
  {
    q: 'Why was my certificate rejected?',
    a: 'Certificates may be rejected if the document is blurry, missing an institutional seal/signature, or has incorrect details. You can view the specific HOD remarks on your certificate details modal.',
  },
  {
    q: 'What file formats are supported?',
    a: 'The portal supports PDF, JPG, JPEG, and PNG files up to 10 MB in size.',
  },
  {
    q: 'Can I delete or re-upload a rejected certificate?',
    a: 'You can upload a fresh clear copy of your certificate anytime using the Upload Certificate form.',
  },
];

export const Support: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  const { showToast } = useNotification();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support');
      if (res.data && res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/support', { subject, message });
      if (res.data.success) {
        showToast('Support ticket submitted successfully.', 'success');
        setSubject('');
        setMessage('');
        fetchTickets();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-ksrct-orange" />
          <span>Help & Support Center</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Frequently asked questions and direct support ticket submission
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: FAQ Accordion (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Frequently Asked Questions</h2>

          <div className="divide-y divide-slate-100">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-ksrct-navy py-1"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-ksrct-orange flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-2 border-l-2 border-ksrct-orange">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Contact Support Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Contact Support Team</h2>

          <form onSubmit={handleSubmitTicket} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Issue with certificate upload"
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Message *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your query or technical issue..."
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight rounded-xl shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>
          </form>

          {/* Ticket History */}
          {tickets.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Submitted Tickets</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 truncate">{t.subject}</p>
                      <p className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
