import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { ConfirmModal, Dropdown } from '../../components/ui';
import OpportunityAutomation from './OpportunityAutomation';

const EMPTY_FORM = {
  title: '',
  description: '',
  note: '',
  link_url: '',
  scrap_url: '',
  is_active: true,
  scan_interval_minutes: 1440,
  pagination_enabled: true,
  max_pages: 5,
};

const SCAN_STATUS_LABELS = {
  queued: 'Sırada',
  running: 'Taranıyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
  never: 'Henüz taranmadı',
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

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function SourceResultsModal({ source, onClose }) {
  const [candidates, setCandidates] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [resultSort, setResultSort] = useState('score_desc');

  useEffect(() => {
    let current = true;
    Promise.all([
      api.getOpportunityCandidates({ source_id: source.id, limit: 200 }),
      api.getOpportunityScanRuns(10, source.id),
    ])
      .then(([candidateData, runData]) => {
        if (!current) return;
        setCandidates(candidateData);
        setRuns(runData);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Tarama sonuçları yüklenemedi.');
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [source.id]);

  const visibleCandidates = useMemo(() => candidates
    .filter((candidate) => {
      if (listFilter === 'shortlisted') return candidate.is_shortlisted;
      if (listFilter === 'not_shortlisted') return !candidate.is_shortlisted;
      return true;
    })
    .sort((a, b) => {
      if (resultSort === 'score_asc') return Number(a.score) - Number(b.score);
      if (resultSort === 'newest') return new Date(b.last_seen_at) - new Date(a.last_seen_at);
      if (resultSort === 'oldest') return new Date(a.last_seen_at) - new Date(b.last_seen_at);
      return Number(b.score) - Number(a.score);
    }), [candidates, listFilter, resultSort]);

  const toggleShortlist = async (candidate) => {
    try {
      const updated = await api.updateOpportunityCandidate(candidate.id, { is_shortlisted: !candidate.is_shortlisted });
      setCandidates((current) => current.map((item) => (
        item.id === candidate.id ? { ...item, is_shortlisted: updated.is_shortlisted } : item
      )));
    } catch (requestError) {
      setError(requestError.message || 'Kısa liste güncellenemedi.');
    }
  };

  const latestRun = runs[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5" onClick={onClose}>
      <div className="source-results-modal max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="source-results-header sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-800 bg-gray-900/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300">Son taramalar ve fırsatlar</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-white">{source.title}</h2>
            <p className="mt-1 text-xs text-gray-500">Son tarama: {formatDateTime(source.last_scanned_at)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Kapat</button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {latestRun && (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Durum</span>
                <p className="mt-1 text-sm font-semibold text-white">{SCAN_STATUS_LABELS[latestRun.status] || 'Bilinmiyor'}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Taranan sayfa</span>
                <p className="mt-1 text-sm font-semibold text-white">{latestRun.details?.pages_scanned || '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Bulunan</span>
                <p className="mt-1 text-sm font-semibold text-white">{latestRun.discovered_count}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Değerlendirilen</span>
                <p className="mt-1 text-sm font-semibold text-white">{latestRun.analyzed_count}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Kısa liste</span>
                <p className="mt-1 text-sm font-semibold text-green-300">{latestRun.shortlisted_count}</p>
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Bulunan fırsatlar</h3>
                <p className="mt-1 text-xs text-gray-500">{visibleCandidates.length} sonuç gösteriliyor; toplam {candidates.length} kayıt.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">Gösterim</span>
                <select value={listFilter} onChange={(event) => setListFilter(event.target.value)} className="h-9 rounded-lg border border-gray-700 bg-gray-800 px-3 text-xs text-white outline-none focus:border-cyan-500/60">
                  <option value="all">Tüm sonuçlar</option>
                  <option value="shortlisted">Yalnızca kısa liste</option>
                  <option value="not_shortlisted">Kısa liste dışındakiler</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">Sıralama</span>
                <select value={resultSort} onChange={(event) => setResultSort(event.target.value)} className="h-9 rounded-lg border border-gray-700 bg-gray-800 px-3 text-xs text-white outline-none focus:border-cyan-500/60">
                  <option value="score_desc">Puanı yüksekten düşüğe</option>
                  <option value="score_asc">Puanı düşükten yükseğe</option>
                  <option value="newest">En son görülene göre</option>
                  <option value="oldest">İlk görülene göre</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="py-14 text-center text-sm text-gray-500">Tarama sonuçları yükleniyor...</div>
            ) : visibleCandidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center text-sm text-gray-500">Bu gösterime uygun tarama sonucu bulunamadı.</div>
            ) : (
              <div className="space-y-3">
                {visibleCandidates.map((candidate) => (
                  <article key={candidate.id} className={`rounded-xl border p-4 ${candidate.is_shortlisted ? 'border-green-500/25 bg-green-500/[0.05]' : 'border-gray-800 bg-gray-950/40'}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2 py-1 text-xs font-bold ${candidate.score >= 80 ? 'bg-green-500/15 text-green-300' : candidate.score >= 60 ? 'bg-amber-500/15 text-amber-200' : 'bg-red-500/15 text-red-300'}`}>{candidate.score}/100</span>
                          {candidate.is_shortlisted && <span className="rounded-full border border-green-500/25 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-300">KISA LİSTE</span>}
                          <span className="text-[11px] text-gray-500">Güven: %{candidate.confidence}</span>
                          <span className="text-[11px] text-gray-600">Son görülme: {formatDateTime(candidate.last_seen_at)}</span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-white">{candidate.title}</h4>
                        {candidate.description && <p className="mt-1 text-xs leading-5 text-gray-400">{candidate.description}</p>}
                        {candidate.rationale && <p className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs leading-5 text-gray-300">{candidate.rationale}</p>}
                        <div className="mt-2 grid gap-1 text-[11px] text-gray-500 sm:grid-cols-3">
                          <span>Son tarih: {candidate.deadline_text || 'Belirtilmedi'}</span>
                          <span>Destek: {candidate.funding_text || 'Belirtilmedi'}</span>
                          <span>Bölge: {candidate.geography || 'Belirtilmedi'}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {candidate.external_url && <a href={candidate.external_url} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-gray-950 hover:bg-cyan-400">Fırsatı aç</a>}
                        <button type="button" onClick={() => toggleShortlist(candidate)} className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                          {candidate.is_shortlisted ? 'Kısa listeden çıkar' : 'Kısa listeye ekle'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {runs.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-white">Son taramalar</h3>
              <div className="overflow-hidden rounded-xl border border-gray-800">
                {runs.map((run) => (
                  <div key={run.id} className="flex flex-col gap-1 border-b border-gray-800 bg-gray-950/30 px-3 py-2.5 text-xs last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-gray-300">{SCAN_STATUS_LABELS[run.status] || 'Bilinmiyor'}</span>
                    <span className="text-gray-500">{formatDateTime(run.started_at)} · {run.discovered_count} bulunan · {run.analyzed_count} değerlendirilen · {run.shortlisted_count} kısa liste</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
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
  const [scanningIds, setScanningIds] = useState([]);
  const [togglingIds, setTogglingIds] = useState([]);
  const [resultsSource, setResultsSource] = useState(null);

  const load = () => {
    setLoading(true);
    api.getTrackedOpportunities()
      .then(setItems)
      .catch((err) => setError(err.message || 'Fırsatlar yüklenemedi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let current = true;
    api.getTrackedOpportunities()
      .then((data) => { if (current) setItems(data); })
      .catch((err) => { if (current) setError(err.message || 'Fırsatlar yüklenemedi'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const refreshAfterScan = () => {
      api.getTrackedOpportunities()
        .then(setItems)
        .catch((requestError) => setError(requestError.message || 'Fırsatlar yenilenemedi'));
    };
    window.addEventListener('opportunity-scan-finished', refreshAfterScan);
    return () => window.removeEventListener('opportunity-scan-finished', refreshAfterScan);
  }, []);

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
        if (typeFilter === 'active' && item.is_active === false) return false;
        if (typeFilter === 'inactive' && item.is_active !== false) return false;
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
      is_active: item.is_active !== false,
      scan_interval_minutes: item.scan_interval_minutes || 1440,
      pagination_enabled: item.pagination_enabled !== false,
      max_pages: item.max_pages || 5,
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

  const scanSource = async (item) => {
    setError('');
    setScanningIds((current) => [...current, item.id]);
    try {
      await api.scanTrackedOpportunity(item.id);
      setItems((current) => current.map((source) => (
        source.id === item.id ? { ...source, last_scan_status: 'running', last_scan_error: null } : source
      )));
      window.setTimeout(load, 2500);
    } catch (err) {
      setError(err.message || 'Tarama başlatılamadı');
    } finally {
      setScanningIds((current) => current.filter((id) => id !== item.id));
    }
  };

  const toggleSourceActive = async (item) => {
    setError('');
    setTogglingIds((current) => [...current, item.id]);
    try {
      const updated = await api.updateTrackedOpportunity(item.id, {
        title: item.title,
        description: item.description || '',
        note: item.note || '',
        link_url: item.link_url || '',
        scrap_url: item.scrap_url || '',
        is_active: item.is_active === false,
        scan_interval_minutes: item.scan_interval_minutes || 1440,
        pagination_enabled: item.pagination_enabled !== false,
        max_pages: item.max_pages || 5,
      });
      setItems((current) => current.map((source) => (source.id === item.id ? updated : source)));
    } catch (requestError) {
      setError(requestError.message || 'Tarama katılım durumu güncellenemedi.');
    } finally {
      setTogglingIds((current) => current.filter((id) => id !== item.id));
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
    <div className="opportunity-tracking-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fırsat Takibi</h1>
          <p className="mt-1 text-sm text-gray-400">Kaynakları belirli aralıklarla tarayın, Gemini ile değerlendirin ve uygun fırsatları kısa listeye alın.</p>
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

      <OpportunityAutomation />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Toplam</div>
          <div className="mt-1 text-2xl font-bold text-white">{items.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Bağlantılı</div>
          <div className="mt-1 text-2xl font-bold text-cyan-300">{items.filter((item) => item.link_url).length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">Tarama Bağlantısı</div>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Başlık, açıklama, not, domain veya link ara..."
                className="h-10 w-full rounded-lg border border-gray-800 bg-gray-950/80 pl-9 pr-3 text-sm text-white placeholder-gray-500 shadow-inner shadow-black/20 outline-none transition-colors hover:border-gray-700 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </div>
          </label>
          <FilterSelect
            label="Alan adı"
            value={domainFilter}
            onChange={(value) => {
              setDomainFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'Tüm alan adları' },
              ...domains.map((domain) => ({ value: domain, label: domain })),
            ]}
          />
          <FilterSelect
            label="Tür"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'Tüm kayıtlar' },
              { value: 'linked', label: 'Bağlantılı kayıtlar' },
              { value: 'scrap', label: 'Tarama bağlantılı' },
              { value: 'active', label: 'Taramaya dahil' },
              { value: 'inactive', label: 'Tarama dışı' },
              { value: 'without-note', label: 'Notu boş' },
            ]}
          />
          <FilterSelect
            label="Sıralama"
            value={sortBy}
            onChange={(value) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'newest', label: 'Yeni önce' },
              { value: 'oldest', label: 'Eski önce' },
              { value: 'title', label: 'Başlığa göre' },
              { value: 'domain', label: 'Alan adına göre' },
            ]}
          />
          <FilterSelect
            label="Sayfalama"
            value={String(pageSize)}
            onChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
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
                setCurrentPage(1);
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
                          Tarama
                        </span>
                      )}
                      {item.scrap_url && item.pagination_enabled !== false && (
                        <span className="hidden xl:inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300 shrink-0">
                          ≤ {item.max_pages || 5} sayfa
                        </span>
                      )}
                      <span className={`hidden md:inline-flex rounded-full border px-2 py-0.5 text-[10px] ${item.is_active ? 'border-green-500/20 bg-green-500/10 text-green-300' : 'border-gray-700 bg-gray-800 text-gray-500'}`}>
                        {item.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <p className="text-gray-400 truncate">
                        {item.description || <span className="text-gray-600">Açıklama yok</span>}
                      </p>
                      <p className="opportunity-note text-amber-200/80 truncate">
                        {item.note || <span className="text-gray-600">Not yok</span>}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                      <span>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                      {item.domain && <span className="sm:hidden">{item.domain}</span>}
                      {item.scrap_url && <span className="md:hidden">Tarama</span>}
                      {item.last_scan_status && item.last_scan_status !== 'never' && (
                        <span className={item.last_scan_status === 'failed' ? 'text-red-300' : ['queued', 'running'].includes(item.last_scan_status) ? 'text-amber-200' : 'text-green-300'}>
                          Tarama: {SCAN_STATUS_LABELS[item.last_scan_status] || 'Bilinmiyor'}
                        </span>
                      )}
                      {item.last_scanned_at && <span>Son: {new Date(item.last_scanned_at).toLocaleString('tr-TR')}</span>}
                    </div>
                    {item.last_scan_error && <p className="mt-1 truncate text-[11px] text-red-300" title={item.last_scan_error}>{item.last_scan_error}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSourceActive(item)}
                    disabled={togglingIds.includes(item.id) || ['queued', 'running'].includes(item.last_scan_status)}
                    className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${item.is_active !== false ? 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20' : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-white/5'}`}
                  >
                    {togglingIds.includes(item.id) ? 'Güncelleniyor...' : item.is_active !== false ? 'Taramaya Dahil' : 'Tarama Dışı'}
                  </button>
                  {item.last_scanned_at && (
                    <button
                      type="button"
                      onClick={() => setResultsSource(item)}
                      className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Son Taramaları Gör
                    </button>
                  )}
                  {item.scrap_url && item.is_active !== false && (
                    <button
                      onClick={() => scanSource(item)}
                      disabled={scanningIds.includes(item.id) || ['queued', 'running'].includes(item.last_scan_status)}
                      className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 disabled:opacity-40"
                    >
                      {scanningIds.includes(item.id) || item.last_scan_status === 'running' ? 'Taranıyor...' : item.last_scan_status === 'queued' ? 'Sırada...' : 'Şimdi Tara'}
                    </button>
                  )}
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
                <p className="mt-1 text-sm text-gray-500">Bağlantı girildiğinde site simgesi otomatik kaydedilir.</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Fırsat bağlantısı</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tarama bağlantısı</label>
                <input
                  value={editing.scrap_url}
                  onChange={(e) => setEditing({ ...editing, scrap_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                  placeholder="Otomatik taranacak kaynak veya liste URL'si"
                />
                <p className="mt-1.5 text-xs text-gray-500">Etkin kaynaklar belirlenen aralıkta taranır. Bağlantıyı değiştirmek geçmiş sonuçları silmez ve kaynağı yeniden tarama sırasına alır. Uygulama arayüzü veya yayın akışı adresi varsa doğrudan onu kullanın.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-300">Tarama periyodu (dakika)</span>
                  <input
                    type="number"
                    min="15"
                    max="43200"
                    value={editing.scan_interval_minutes}
                    onChange={(e) => setEditing({ ...editing, scan_interval_minutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-cyan-500/60 focus:outline-none"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">60: saatlik · 1440: günlük · 10080: haftalık</p>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-300">Azami sayfa sayısı</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editing.max_pages}
                    disabled={!editing.pagination_enabled}
                    onChange={(e) => setEditing({ ...editing, max_pages: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-cyan-500/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Maliyet ve süre kontrolü için 1–20 arası.</p>
                </label>
                <label className="flex h-12 items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    className="h-4 w-4 accent-cyan-500"
                  />
                  Taramaya dahil
                </label>
                <label className="flex h-12 items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editing.pagination_enabled}
                    onChange={(e) => setEditing({ ...editing, pagination_enabled: e.target.checked })}
                    className="h-4 w-4 accent-cyan-500"
                  />
                  Alt sayfaları otomatik tara
                </label>
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

      {resultsSource && (
        <SourceResultsModal source={resultsSource} onClose={() => setResultsSource(null)} />
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
