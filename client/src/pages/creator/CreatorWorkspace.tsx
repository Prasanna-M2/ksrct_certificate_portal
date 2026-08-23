import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CertificateTemplate } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  Palette,
  Type,
  Image as ImageIcon,
  QrCode,
  FileCode,
  Plus,
  Save,
  CheckCircle,
  Eye,
  Trash2,
  Move,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

interface Element {
  id: string;
  type: 'text' | 'image' | 'dynamic' | 'qr' | 'shape';
  content?: string;
  field?: string;
  src?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const DYNAMIC_FIELDS = [
  '{{student_name}}',
  '{{register_number}}',
  '{{department}}',
  '{{certificate_title}}',
  '{{issue_date}}',
  '{{certificate_id}}',
  '{{issuer_name}}',
];

export const CreatorWorkspace: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('New Certificate Format');
  const [category, setCategory] = useState('Academic');
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED'>('DRAFT');
  const [elements, setElements] = useState<Element[]>([
    { id: '1', type: 'image', src: '/assets/ksrct-logo.png', x: 350, y: 30, width: 100, height: 80 },
    { id: '2', type: 'text', content: 'K.S. RANGASAMY COLLEGE OF TECHNOLOGY', x: 400, y: 130, fontSize: 20, fontWeight: 'bold', color: '#0f2942', align: 'center' },
    { id: '3', type: 'text', content: '(Autonomous) | Tiruchengode - 637 215', x: 400, y: 160, fontSize: 12, color: '#f97316', align: 'center' },
    { id: '4', type: 'text', content: 'CERTIFICATE OF ACHIEVEMENT', x: 400, y: 210, fontSize: 24, fontWeight: 'bold', color: '#0f2942', align: 'center' },
    { id: '5', type: 'dynamic', field: '{{certificate_title}}', x: 400, y: 260, fontSize: 18, fontWeight: 'bold', color: '#0f2942', align: 'center' },
    { id: '6', type: 'text', content: 'This is proudly presented to', x: 400, y: 300, fontSize: 14, color: '#64748b', align: 'center' },
    { id: '7', type: 'dynamic', field: '{{student_name}}', x: 400, y: 340, fontSize: 22, fontWeight: 'bold', color: '#0f2942', align: 'center' },
    { id: '8', type: 'dynamic', field: 'Reg No: {{register_number}} | Dept: {{department}}', x: 400, y: 375, fontSize: 13, color: '#475569', align: 'center' },
    { id: '9', type: 'dynamic', field: 'Issued on: {{issue_date}} | Certificate ID: {{certificate_id}}', x: 400, y: 420, fontSize: 12, color: '#64748b', align: 'center' },
    { id: '10', type: 'qr', x: 100, y: 460, width: 80, height: 80 },
  ]);

  const [activeElementId, setActiveElementId] = useState<string | null>('7');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const { showToast } = useNotification();

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      if (res.data?.success) {
        setTemplates(res.data.templates);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const loadTemplate = (t: CertificateTemplate) => {
    setSelectedTemplateId(t.id);
    setTitle(t.title);
    setCategory(t.category || 'Academic');
    setStatus(t.status);
    try {
      const parsed = JSON.parse(t.layoutJson);
      if (parsed.elements) setElements(parsed.elements);
    } catch (e) {
      console.error('Layout parse error:', e);
    }
  };

  const activeElement = elements.find((e) => e.id === activeElementId);

  const updateActiveElement = (updated: Partial<Element>) => {
    if (!activeElementId) return;
    setElements((prev) =>
      prev.map((e) => (e.id === activeElementId ? { ...e, ...updated } : e))
    );
  };

  const addTextElement = () => {
    const newEl: Element = {
      id: String(Date.now()),
      type: 'text',
      content: 'New Text Element',
      x: 400,
      y: 250,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0f2942',
      align: 'center',
    };
    setElements([...elements, newEl]);
    setActiveElementId(newEl.id);
  };

  const addDynamicElement = (field: string) => {
    const newEl: Element = {
      id: String(Date.now()),
      type: 'dynamic',
      field,
      x: 400,
      y: 300,
      fontSize: 18,
      fontWeight: 'bold',
      color: '#0f2942',
      align: 'center',
    };
    setElements([...elements, newEl]);
    setActiveElementId(newEl.id);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter((e) => e.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  const handleSave = async (targetStatus?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED') => {
    const newStatus = targetStatus || status;
    try {
      setSaving(true);
      const layoutJson = JSON.stringify({
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: '#ffffff',
        borderColor: '#0f2942',
        borderWidth: 8,
        elements,
      });

      if (selectedTemplateId) {
        await api.put(`/templates/${selectedTemplateId}`, {
          title,
          category,
          status: newStatus,
          layoutJson,
        });
        showToast(`Template saved as ${newStatus}!`, 'success');
      } else {
        const res = await api.post('/templates', {
          title,
          category,
          status: newStatus,
          layoutJson,
        });
        if (res.data?.success) {
          setSelectedTemplateId(res.data.template.id);
          showToast(`Template created as ${newStatus}!`, 'success');
        }
      }
      setStatus(newStatus);
      fetchTemplates();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ksrct-navy">Visual Certificate Designer</h1>
            <span className="px-3 py-1 text-xs font-bold bg-ksrct-orange/10 text-ksrct-orange rounded-full border border-ksrct-orange/20">
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Design certificate layouts with dynamic placeholders, custom typography, logos, and QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Exit Preview' : 'Live Preview'}</span>
          </button>

          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-ksrct-navy hover:bg-ksrct-navyLight shadow-md transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Publish Template</span>
          </button>
        </div>
      </div>

      {/* Editor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Elements Palette */}
        <div className="lg:col-span-3 space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-ksrct-orange" />
            Elements Palette
          </h3>

          <div className="space-y-2">
            <button
              onClick={addTextElement}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors text-left"
            >
              <Type className="w-4 h-4 text-ksrct-navy" />
              <span>Add Static Text</span>
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase">Dynamic Field Placeholders</label>
            <div className="space-y-1.5">
              {DYNAMIC_FIELDS.map((f) => (
                <button
                  key={f}
                  onClick={() => addDynamicElement(f)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-ksrct-navy hover:text-white border border-slate-200 text-xs font-mono font-medium text-slate-700 transition-all text-left"
                >
                  <span className="truncate">{f}</span>
                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Template List Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase">Existing Templates</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold text-left truncate transition-colors border ${
                    t.id === selectedTemplateId
                      ? 'bg-ksrct-orange/10 border-ksrct-orange text-ksrct-orange'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live Certificate Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-900/5 p-4 rounded-3xl border border-slate-200 min-h-[500px]">
          <div
            className="relative bg-white shadow-2xl overflow-hidden rounded-xl transition-all"
            style={{
              width: '100%',
              maxWidth: '800px',
              height: '560px',
              border: '8px double #0f2942',
            }}
          >
            {/* Background Decorative Frame */}
            <div className="absolute inset-2 border-2 border-ksrct-orange/30 pointer-events-none" />

            {/* Elements Layer */}
            {elements.map((el) => {
              const isSelected = el.id === activeElementId && !previewMode;

              return (
                <div
                  key={el.id}
                  onClick={() => !previewMode && setActiveElementId(el.id)}
                  className={`absolute cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-ksrct-orange ring-offset-2 bg-ksrct-orange/5' : ''
                  }`}
                  style={{
                    left: `${(el.x / 800) * 100}%`,
                    top: `${(el.y / 600) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    textAlign: el.align || 'center',
                    fontSize: `${el.fontSize || 16}px`,
                    fontWeight: el.fontWeight || 'normal',
                    color: el.color || '#0f2942',
                  }}
                >
                  {el.type === 'text' && <span>{el.content}</span>}

                  {el.type === 'dynamic' && (
                    <span className="font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900">
                      {previewMode
                        ? el.field === '{{student_name}}'
                          ? 'Prasanna M'
                          : el.field === '{{register_number}}'
                          ? '22EE123'
                          : el.field === '{{department}}'
                          ? 'Electrical and Electronics Engineering'
                          : el.field === '{{certificate_title}}'
                          ? 'NPTEL Online Certification'
                          : el.field === '{{issue_date}}'
                          ? '20 Aug 2026'
                          : 'KSRCT-2026-00124'
                        : el.field}
                    </span>
                  )}

                  {el.type === 'image' && (
                    <img
                      src={el.src}
                      alt="Logo"
                      style={{ width: `${el.width || 80}px`, height: `${el.height || 60}px` }}
                      className="object-contain"
                    />
                  )}

                  {el.type === 'qr' && (
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 p-1 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      [QR Code]
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Element Properties Editor */}
        <div className="lg:col-span-3 space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-ksrct-navy" />
            Properties Inspector
          </h3>

          {activeElement ? (
            <div className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Element Type</label>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 uppercase font-mono text-[11px]">
                  {activeElement.type}
                </span>
              </div>

              {activeElement.type === 'text' && (
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Text Content</label>
                  <input
                    type="text"
                    value={activeElement.content || ''}
                    onChange={(e) => updateActiveElement({ content: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                  />
                </div>
              )}

              {activeElement.type === 'dynamic' && (
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Dynamic Field Tag</label>
                  <input
                    type="text"
                    value={activeElement.field || ''}
                    onChange={(e) => updateActiveElement({ field: e.target.value })}
                    className="w-full p-2.5 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ksrct-navy bg-slate-50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Font Size (px)</label>
                  <input
                    type="number"
                    value={activeElement.fontSize || 16}
                    onChange={(e) => updateActiveElement({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Text Color</label>
                  <input
                    type="color"
                    value={activeElement.color || '#0f2942'}
                    onChange={(e) => updateActiveElement({ color: e.target.value })}
                    className="w-full h-9 p-1 rounded-xl border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Position X</label>
                  <input
                    type="number"
                    value={activeElement.x}
                    onChange={(e) => updateActiveElement({ x: parseInt(e.target.value, 10) })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">Position Y</label>
                  <input
                    type="number"
                    value={activeElement.y}
                    onChange={(e) => updateActiveElement({ y: parseInt(e.target.value, 10) })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => removeElement(activeElement.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Element</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Click any canvas element to inspect & edit properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
