import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Dropdown } from '../../components/ui';

const emptyForm = {
  slug: '',
  title_tr: '',
  title_en: '',
  problem_tr: '',
  problem_en: '',
  solution_tr: '',
  solution_en: '',
  seo_title_tr: '',
  seo_title_en: '',
  seo_description_tr: '',
  seo_description_en: '',
  cover_image_url: '',
  tags_tr: [],
  tags_en: [],
  keywords_tr: [],
  keywords_en: [],
  status: 'draft',
  published_at: '',
};

export default function UseCaseForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [tagsTrStr, setTagsTrStr] = useState('');
  const [tagsEnStr, setTagsEnStr] = useState('');
  const [keywordsTrStr, setKeywordsTrStr] = useState('');
  const [keywordsEnStr, setKeywordsEnStr] = useState('');

  useEffect(() => {
    if (isNew) return;

    api.getAdminUseCase(id)
      .then((item) => {
        setForm({
          ...item,
          published_at: item.published_at ? item.published_at.slice(0, 16) : '',
        });
        setTagsTrStr((item.tags_tr || []).join(', '));
        setTagsEnStr((item.tags_en || []).join(', '));
        setKeywordsTrStr((item.keywords_tr || []).join(', '));
        setKeywordsEnStr((item.keywords_en || []).join(', '));
      })
      .catch(() => navigate('/admin/use-cases'))
      .finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      tags_tr: splitCsv(tagsTrStr),
      tags_en: splitCsv(tagsEnStr),
      keywords_tr: splitCsv(keywordsTrStr),
      keywords_en: splitCsv(keywordsEnStr),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    };

    try {
      if (isNew) await api.createUseCase(payload);
      else await api.updateUseCase(id, payload);
      navigate('/admin/use-cases');
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
        <h1 className="text-2xl font-bold text-white">{isNew ? 'Yeni Use Case' : 'Use Case Düzenle'}</h1>
        <button onClick={() => navigate('/admin/use-cases')} className="text-sm text-gray-400 hover:text-white">
          ← Geri
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
        <Section title="Temel Bilgiler">
          <Field label="Slug" value={form.slug} onChange={(value) => handleChange('slug', value)} placeholder="ornek-use-case-slug" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Başlık (TR)" value={form.title_tr} onChange={(value) => handleChange('title_tr', value)} />
            <Field label="Title (EN)" value={form.title_en} onChange={(value) => handleChange('title_en', value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durum</label>
              <Dropdown
                value={form.status}
                options={[
                  { value: 'draft', label: 'Taslak' },
                  { value: 'published', label: 'Yayında' },
                ]}
                onChange={(val) => handleChange('status', val)}
              />
            </div>
            <Field
              label="Yayın Tarihi"
              type="datetime-local"
              value={form.published_at}
              onChange={(value) => handleChange('published_at', value)}
            />
          </div>
          <ImageUpload
            label="Kapak Görseli"
            value={form.cover_image_url}
            onChange={(value) => handleChange('cover_image_url', value)}
          />
        </Section>

        <Section title="İçerik">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea label="Problem (TR)" value={form.problem_tr} onChange={(value) => handleChange('problem_tr', value)} rows={7} />
            <TextArea label="Problem (EN)" value={form.problem_en} onChange={(value) => handleChange('problem_en', value)} rows={7} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea label="Cerilas'ın Çözümü (TR)" value={form.solution_tr} onChange={(value) => handleChange('solution_tr', value)} rows={7} />
            <TextArea label="Cerilas Solution (EN)" value={form.solution_en} onChange={(value) => handleChange('solution_en', value)} rows={7} />
          </div>
        </Section>

        <Section title="SEO Alanları">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="SEO Title (TR)" value={form.seo_title_tr} onChange={(value) => handleChange('seo_title_tr', value)} />
            <Field label="SEO Title (EN)" value={form.seo_title_en} onChange={(value) => handleChange('seo_title_en', value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea label="SEO Description (TR)" value={form.seo_description_tr} onChange={(value) => handleChange('seo_description_tr', value)} rows={4} />
            <TextArea label="SEO Description (EN)" value={form.seo_description_en} onChange={(value) => handleChange('seo_description_en', value)} rows={4} />
          </div>
        </Section>

        <Section title="Etiketler ve Anahtar Kelimeler">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Etiketler TR" value={tagsTrStr} onChange={setTagsTrStr} placeholder="sağlık, fizyoterapi, klinik yazılım" />
            <Field label="Tags EN" value={tagsEnStr} onChange={setTagsEnStr} placeholder="health, physiotherapy, clinic software" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Anahtar Kelimeler TR" value={keywordsTrStr} onChange={setKeywordsTrStr} placeholder="fizyoterapi yazılımı, hasta takip sistemi" />
            <Field label="Keywords EN" value={keywordsEnStr} onChange={setKeywordsEnStr} placeholder="physiotherapy software, patient tracking system" />
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
            onClick={() => navigate('/admin/use-cases')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

function splitCsv(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 5, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
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

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      {value ? (
        <div className="relative group">
          <img src={value} alt="Kapak görseli" className="w-full max-h-64 object-cover rounded-lg border border-gray-700" />
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
        </div>
      ) : (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
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
              <p className="text-sm text-gray-400">Kapak görseli sürükleyin veya <span className="text-cyan-400">tıklayın</span></p>
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
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}