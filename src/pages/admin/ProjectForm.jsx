import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Dropdown } from '../../components/ui';

const emptyProject = {
  slug: '', title_tr: '', title_en: '',
  short_desc_tr: '', short_desc_en: '',
  challenge_tr: '', challenge_en: '',
  solution_tr: '', solution_en: '',
  impact_tr: '', impact_en: '',
  date_tr: '', date_en: '',
  tags_tr: [], tags_en: [],
  technologies: [],
  grant_info: '', university: '', academic_staff: '', partner: '', budget: '',
  image_url: '', sort_order: 0, status: 'active',
  seo_title_tr: '', seo_title_en: '', seo_description_tr: '', seo_description_en: ''
};

export default function ProjectForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProject);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Temp string inputs for array fields
  const [tagsTrStr, setTagsTrStr] = useState('');
  const [tagsEnStr, setTagsEnStr] = useState('');
  const [techStr, setTechStr] = useState('');

  useEffect(() => {
    if (!isNew) {
      api.getAdminProjects()
        .then((projects) => {
          const p = projects.find((pr) => pr.id === Number(id));
          if (p) {
            setForm(p);
            setTagsTrStr((p.tags_tr || []).join(', '));
            setTagsEnStr((p.tags_en || []).join(', '));
            setTechStr((p.technologies || []).join(', '));
          } else {
            navigate('/admin/projects');
          }
        })
        .catch(() => navigate('/admin/projects'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      tags_tr: tagsTrStr.split(',').map((s) => s.trim()).filter(Boolean),
      tags_en: tagsEnStr.split(',').map((s) => s.trim()).filter(Boolean),
      technologies: techStr.split(',').map((s) => s.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      if (isNew) {
        await api.createProject(payload);
      } else {
        await api.updateProject(id, payload);
      }
      navigate('/admin/projects');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">
          {isNew ? 'Yeni Proje' : 'Proje Düzenle'}
        </h1>
        <button
          onClick={() => navigate('/admin/projects')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Geri
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        {/* Basic Info */}
        <Section title="Temel Bilgiler">
          <Field label="Slug (URL)" value={form.slug} onChange={(v) => handleChange('slug', v)} placeholder="proje-adi" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Başlık (TR)" value={form.title_tr} onChange={(v) => handleChange('title_tr', v)} />
            <Field label="Title (EN)" value={form.title_en} onChange={(v) => handleChange('title_en', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarih (TR)" value={form.date_tr} onChange={(v) => handleChange('date_tr', v)} placeholder="1 Oca 2025" />
            <Field label="Date (EN)" value={form.date_en} onChange={(v) => handleChange('date_en', v)} placeholder="1 Jan 2025" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sıralama" type="number" value={form.sort_order} onChange={(v) => handleChange('sort_order', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durum</label>
              <Dropdown
                value={form.status}
                options={[
                  { value: 'active', label: 'Aktif' },
                  { value: 'draft', label: 'Taslak' },
                ]}
                onChange={(val) => handleChange('status', val)}
              />
            </div>
          </div>
        </Section>

        {/* Descriptions */}
        <Section title="Açıklamalar">
          <div className="grid grid-cols-2 gap-4">
            <TextArea label="Kısa Açıklama (TR)" value={form.short_desc_tr} onChange={(v) => handleChange('short_desc_tr', v)} />
            <TextArea label="Short Desc (EN)" value={form.short_desc_en} onChange={(v) => handleChange('short_desc_en', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextArea label="Problem (TR)" value={form.challenge_tr} onChange={(v) => handleChange('challenge_tr', v)} />
            <TextArea label="Challenge (EN)" value={form.challenge_en} onChange={(v) => handleChange('challenge_en', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextArea label="Çözüm (TR)" value={form.solution_tr} onChange={(v) => handleChange('solution_tr', v)} />
            <TextArea label="Solution (EN)" value={form.solution_en} onChange={(v) => handleChange('solution_en', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextArea label="Etki (TR)" value={form.impact_tr} onChange={(v) => handleChange('impact_tr', v)} />
            <TextArea label="Impact (EN)" value={form.impact_en} onChange={(v) => handleChange('impact_en', v)} />
          </div>
        </Section>

        {/* Tags & Tech */}
        <Section title="Etiketler & Teknolojiler">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Etiketler TR (virgülle)" value={tagsTrStr} onChange={setTagsTrStr} placeholder="Yapay Zeka, Robotik" />
            <Field label="Tags EN (comma-sep)" value={tagsEnStr} onChange={setTagsEnStr} placeholder="AI, Robotics" />
          </div>
          <Field label="Teknolojiler (virgülle)" value={techStr} onChange={setTechStr} placeholder="Python, PyTorch, ROS2" />
        </Section>

        {/* Grants & Academic */}
        <Section title="Hibe & Akademik (Opsiyonel)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hibe Bilgisi" value={form.grant_info || ''} onChange={(v) => handleChange('grant_info', v)} placeholder="TÜBİTAK 1501" />
            <Field label="Üniversite" value={form.university || ''} onChange={(v) => handleChange('university', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Akademik Kadro" value={form.academic_staff || ''} onChange={(v) => handleChange('academic_staff', v)} />
            <Field label="Ortak" value={form.partner || ''} onChange={(v) => handleChange('partner', v)} />
          </div>
          <Field label="Bütçe" value={form.budget || ''} onChange={(v) => handleChange('budget', v)} placeholder="2.500.000 TL" />
          <ImageUpload
            label="Proje Görseli"
            value={form.image_url || ''}
            onChange={(v) => handleChange('image_url', v)}
          />
        </Section>

        {/* SEO Settings */}
        <Section title="SEO Ayarları">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SEO Başlık (TR)" value={form.seo_title_tr} onChange={(v) => handleChange('seo_title_tr', v)} placeholder="Google'da görünecek Türkçe başlık" />
            <Field label="SEO Title (EN)" value={form.seo_title_en} onChange={(v) => handleChange('seo_title_en', v)} placeholder="English title for Google" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextArea label="SEO Açıklama (TR)" value={form.seo_description_tr} onChange={(v) => handleChange('seo_description_tr', v)} placeholder="Meta description for TR" />
            <TextArea label="SEO Description (EN)" value={form.seo_description_en} onChange={(v) => handleChange('seo_description_en', v)} placeholder="Meta description for EN" />
          </div>
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {saving ? 'Kaydediliyor...' : isNew ? 'Oluştur' : 'Kaydet'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/projects')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm resize-y"
        placeholder={placeholder}
      />
    </div>
  );
}

function ImageUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadImage(file);
      onChange(data.url);
    } catch (err) {
      console.error('Upload error:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Proje görseli"
            className="w-full max-h-48 object-cover rounded-lg border border-gray-700"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg"
            >
              Kaldır
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={value}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(value); }}
              className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg px-3 py-2 shrink-0"
            >
              Kopyala
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-cyan-500 bg-cyan-500/5'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              <p className="text-sm text-gray-400">
                Görsel sürükleyin veya <span className="text-cyan-400">tıklayarak seçin</span>
              </p>
              <p className="text-xs text-gray-600">JPEG, PNG, WebP, GIF, SVG · Max 10MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
