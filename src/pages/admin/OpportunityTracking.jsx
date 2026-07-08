import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { ConfirmModal, Dropdown } from '../../components/ui';

const EMPTY_FORM = {
  title: '',
  description: '',
  note: '',
  link_url: '',
  scrap_url: '',
};

const normalizeUrl = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
};

const getPreviewFavicon = (value) => {
  try {
    const url = new URL(normalizeUrl(value));
    const domain = url.hostname.replace(/^www\./, '');
    return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '';
  } catch {
    return '';
  }
};

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
        {label}
      </span>
      <div className="relative">
        <Dropdown
          value={value}
          onChange={onChange}
          options={options}
          buttonClassName="h-10 w-full flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/80 px-3 text-sm text-gray-200 shadow-inner shadow-black/20 outline-none transition-colors hover:border-gray-700 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
        />
      </div>
    </label>
  );
}

export default function OpportunityTracking() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => {
    setLoading(true);
    api.getTrackedOpportunities()
      .then(setItems)
      .catch((err) => setError(err.message || 'Fırsatlar yüklenemedi'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const faviconPreview = useMemo(() => getPreviewFavicon(editing?.link_url), [editing?.link_url]);

  const domains = useMemo(() => (
    [...new Set(items.map((item) => item.domain).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'))
  ), [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('tr-TR');

    return items
      .filter((item) => {
        if (domainFilter !== 'all' && item.domain !== domainFilter) return false;
        if (typeFilter === 'linked' && !item.link_url) return false;
        if (typeFilter === 'scrap' && !item.scrap_url) return false;
        if (typeFilter === 'without-note' && item.note?.trim()) return false;
        if (!term) return true;

        const haystack = [
          item.title,
          item.description,
          item.note,
          item.domain,
          item.link_url,
          item.scrap_url,
        ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');

        return haystack.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'tr');
        if (sortBy === 'domain') return String(a.domain || '').localeCompare(String(b.domain || ''), 'tr');
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [items, searchTerm, domainFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, domainFilter, typeFilter, sortBy, pageSize]);

  const openNew = () => {
    setError('');
    setEditing({ ...EMPTY_FORM });
  };

  const openEdit = (item) => {
    setError('');
    setEditing({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      note: item.note || '',
      link_url: item.link_url || '',
      scrap_url: item.scrap_url || '',
    });
  };

  const closeForm = () => {
    if (!saving) setEditing(null);
  };

  const handleSave = async () => {
    if (!editing?.title?.trim()) {
      setError('Başlık zorunludur.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editing.id) {
        const updated = await api.updateTrackedOpportunity(editing.id, editing);
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createTrackedOpportunity(editing);
        setItems((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Fırsat kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTrackedOpportunity(deleteTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Fırsat silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fırsat Takibi</h1>
          <p className="mt-1 text-sm text-gray-400">Dış kaynaklı fırsatları, notları ve takip linklerini tek yerde saklayın.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-semibold rounded-lg transition-colors"
        >
          + Yeni Fırsat
        </button>
      </div>

      {error && !editing && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Toplam</div>
          <div className="mt-1 text-2xl font-bold text-white">{items.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Linkli</div>
          <div className="mt-1 text-2xl font-bold text-cyan-300">{items.filter((item) => item.link_url).length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Scrap Link</div>
          <div className="mt-1 text-2xl font-bold text-purple-300">{items.filter((item) => item.scrap_url).length}</div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-3">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(150px,1fr))]">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
              Arama
            </span>
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Başlık, açıklama, not, domain veya link ara..."
                className="h-10 w-full rounded-lg border border-gray-800 bg-gray-950/80 pl-9 pr-3 text-sm text-white placeholder-gray-500 shadow-inner shadow-black/20 outline-none transition-colors hover:border-gray-700 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </div>
          </label>
          <FilterSelect
            label="Domain"
            value={domainFilter}
            onChange={setDomainFilter}
            options={[
              { value: 'all', label: 'Tüm domainler' },
              ...domains.map((domain) => ({ value: domain, label: domain })),
            ]}
          />
          <FilterSelect
            label="Tür"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'Tüm kayıtlar' },
              { value: 'linked', label: 'Linkli kayıtlar' },
              { value: 'scrap', label: 'Scrap linkli' },
              { value: 'without-note', label: 'Notu boş' },
            ]}
          />
          <FilterSelect
            label="Sıralama"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: 'Yeni önce' },
              { value: 'oldest', label: 'Eski önce' },
              { value: 'title', label: 'Başlığa göre' },
              { value: 'domain', label: "Domain'e göre" },
            ]}
          />
          <FilterSelect
            label="Sayfalama"
            value={String(pageSize)}
            onChange={(value) => setPageSize(Number(value))}
            options={[
              { value: '5', label: '5 / sayfa' },
              { value: '10', label: '10 / sayfa' },
              { value: '20', label: '20 / sayfa' },
              { value: '50', label: '50 / sayfa' },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <span>
            {filteredItems.length} kayıt bulundu
            {filteredItems.length !== items.length ? ` / toplam ${items.length}` : ''}
          </span>
          {(searchTerm || domainFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDomainFilter('all');
                setTypeFilter('all');
                setSortBy('newest');
              }}
              className="self-start sm:self-auto text-cyan-300 hover:text-cyan-200"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/40">
          <p className="text-gray-400 mb-4">Henüz takip edilen fırsat yok.</p>
          <button
            onClick={openNew}
            className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors"
          >
            İlk Fırsatı Ekle
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/40">
          <p className="text-gray-400">Bu filtrelerle eşleşen fırsat yok.</p>
        </div>
      ) : (
        <>
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {paginatedItems.map((item) => (
            <div key={item.id} className="border-b border-gray-800 last:border-b-0 px-3 py-3 sm:px-4 hover:bg-white/[0.03] transition-colors">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 lg:items-center">
                <div className="flex gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.favicon_url ? (
                      <img src={item.favicon_url} alt="" className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">{item.title?.charAt(0)?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-sm text-white font-semibold truncate">{item.title}</h2>
                      {item.domain && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] border border-cyan-500/20 shrink-0">
                          {item.domain}
                        </span>
                      )}
                      {item.scrap_url && (
                        <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[11px] border border-purple-500/20 shrink-0">
                          Scrap
                        </span>
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <p className="text-gray-400 truncate">
                        {item.description || <span className="text-gray-600">Açıklama yok</span>}
                      </p>
                      <p className="text-amber-200/80 truncate">
                        {item.note || <span className="text-gray-600">Not yok</span>}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                      <span>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                      {item.domain && <span className="sm:hidden">{item.domain}</span>}
                      {item.scrap_url && <span className="md:hidden">Scrap</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap gap-1.5 shrink-0">
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-[76px] px-5 py-2.5 text-sm font-bold text-gray-950 text-center border border-cyan-300 rounded-lg bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm shadow-cyan-500/20"
                    >
                      Aç
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(item)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-gray-300 border border-gray-700 rounded-md hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-red-300 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-500">
            {filteredItems.length === 0 ? '0 kayıt' : `${startIndex + 1}-${Math.min(startIndex + pageSize, filteredItems.length)} / ${filteredItems.length} kayıt`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="px-3 py-2 text-xs text-gray-300 border border-gray-800 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              İlk
            </button>
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className="px-3 py-2 text-xs text-gray-300 border border-gray-800 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Önceki
            </button>
            <span className="px-3 py-2 text-xs text-white bg-gray-900 border border-gray-800 rounded-lg">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-2 text-xs text-gray-300 border border-gray-800 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sonraki
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-3 py-2 text-xs text-gray-300 border border-gray-800 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Son
            </button>
          </div>
        </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeForm}>
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{editing.id ? 'Fırsatı Düzenle' : 'Yeni Fırsat'}</h2>
                <p className="mt-1 text-sm text-gray-500">Link girildiğinde favicon otomatik kaydedilir.</p>
              </div>
              <button onClick={closeForm} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Başlık *</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                  placeholder="ör: Horizon Europe çağrısı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Açıklama</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 resize-none"
                  placeholder="Fırsatın kısa açıklaması"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Not</label>
                <textarea
                  value={editing.note}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 resize-none"
                  placeholder="İç takip notu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Link</label>
                <div className="flex gap-3">
                  <input
                    value={editing.link_url}
                    onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                    className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                    placeholder="https://example.com/firsat"
                  />
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="" className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="text-xs text-gray-500">Logo</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Scrap Link</label>
                <input
                  value={editing.scrap_url}
                  onChange={(e) => setEditing({ ...editing, scrap_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                  placeholder="İleride scraping için kullanılacak URL"
                />
                <p className="mt-1.5 text-xs text-gray-500">Şimdilik sadece kayıt edilir, herhangi bir scraping işlemi yapılmaz.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.title.trim()}
                className="px-4 py-2 text-sm font-semibold text-gray-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-cyan-500"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Fırsat silinsin mi?"
        message={deleteTarget ? `"${deleteTarget.title}" kalıcı olarak silinecek.` : ''}
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
