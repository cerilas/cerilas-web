import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const TABS = [
  { id: 'shortlist', label: 'Yapay Zekâ Kısa Listesi' },
  { id: 'settings', label: 'Yapay Zekâ Ayarları' },
  { id: 'runs', label: 'Tarama Geçmişi' },
];

const VISIBLE_RUN_LIMIT = 20;
const SCAN_STATUS_LABELS = {
  queued: 'Sırada',
  running: 'Taranıyor',
  completed: 'Tamamlandı',
  completed_with_errors: 'Hatalarla tamamlandı',
  failed: 'Başarısız',
  never: 'Henüz taranmadı',
};
const TRIGGER_TYPE_LABELS = {
  manual: 'Elle başlatıldı',
  manual_batch: 'Elle toplu başlatıldı',
  cron: 'Zamanlanmış tarama',
  scheduler: 'Zamanlanmış tarama',
};

const ACTIVE_SCAN_STATUSES = new Set(['queued', 'running']);
const RECENT_SCAN_VISIBILITY_MS = 60_000;

const WEIGHT_FIELDS = [
  ['technical_fit', 'Teknik uyum'],
  ['financial_value', 'Finansal değer'],
  ['eligibility', 'Başvuru uygunluğu'],
  ['strategic_value', 'Stratejik katkı'],
  ['personal_fit', 'Kişisel profil uyumu'],
  ['application_effort', 'Başvuru eforu'],
];

const fieldClass = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10';
const labelClass = 'mb-1.5 block text-xs font-medium text-gray-400';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatRemainingTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return 'Tamamlanmak üzere';
  if (value < 60) return `Yaklaşık ${Math.ceil(value)} saniye`;
  const minutes = Math.ceil(value / 60);
  if (minutes < 60) return `Yaklaşık ${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `Yaklaşık ${hours} saat${remainingMinutes ? ` ${remainingMinutes} dakika` : ''}`;
}

function isRecentlyFinished(item) {
  if (!item?.finished_at) return false;
  return Date.now() - new Date(item.finished_at).getTime() < RECENT_SCAN_VISIBILITY_MS;
}

function RunProgressRow({ run }) {
  const percent = Math.min(100, Math.max(0, Number(run.progress_percent) || 0));
  const timeLabel = run.status === 'completed'
    ? 'Tamamlandı'
    : run.status === 'failed' ? 'Sona erdi' : formatRemainingTime(run.estimated_remaining_seconds);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xs font-semibold text-white">{run.source_title || 'Bilinmeyen kaynak'}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${run.status === 'completed' ? 'bg-green-500/10 text-green-300' : run.status === 'failed' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-200'}`}>
              {SCAN_STATUS_LABELS[run.status] || 'Bilinmiyor'}
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] text-gray-500" title={run.progress_message}>{run.progress_message || 'Tarama bilgisi hazırlanıyor.'}</p>
        </div>
        <div className="shrink-0 text-[10px] text-gray-500 sm:text-right">
          <div>{percent}% · {timeLabel}</div>
          <div className="mt-0.5">Sayfa {run.pages_scanned || 0}/{run.pages_total || '—'} · Fırsat {run.analyzed_count || 0}/{run.total_candidates || '—'}</div>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div className={`h-full rounded-full transition-all duration-500 ${run.status === 'failed' ? 'bg-red-500' : run.status === 'completed' ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LastFullScanSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let current = true;
    const loadSummary = () => {
      api.getOpportunityScanSummary()
        .then((data) => { if (current) setSummary(data); })
        .catch(() => {});
    };
    loadSummary();
    const interval = window.setInterval(loadSummary, 5000);
    return () => {
      current = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!summary) return null;
  const scan = summary.last_full_scan;
  const cards = [
    ['Kayıtlı site', summary.total_sources || 0, 'text-white'],
    ['Taranabilir site', summary.scannable_sources || 0, 'text-cyan-300'],
    ['Başarıyla tamamlanan', scan?.completed_sources || 0, 'text-green-300'],
    ['Hata oluşan', scan?.failed_sources || 0, 'text-red-300'],
    ['Bulunan fırsat', scan?.discovered_count || 0, 'text-purple-300'],
    ['Kısa liste', scan?.shortlisted_count || 0, 'text-amber-200'],
  ];

  return (
    <section className="last-full-scan-summary border-b border-gray-800 px-4 py-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Son Tüm Tarama Özeti</h3>
          <p className="mt-1 text-xs text-gray-500">
            {scan
              ? `${formatDate(scan.started_at)} tarihinde başlatılan tüm kaynak taramasının özeti.`
              : 'Henüz tüm kaynakları kapsayan bir tarama yapılmadı.'}
          </p>
        </div>
        {scan && (
          <div className="text-left sm:text-right">
            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${scan.status === 'completed' ? 'bg-green-500/10 text-green-300' : scan.status === 'completed_with_errors' ? 'bg-amber-500/10 text-amber-200' : scan.status === 'failed' ? 'bg-red-500/10 text-red-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
              {SCAN_STATUS_LABELS[scan.status] || 'Bilinmiyor'}
            </span>
            {ACTIVE_SCAN_STATUSES.has(scan.status) && <p className="mt-1 text-[10px] text-gray-500">Genel ilerleme: %{scan.progress_percent || 0}</p>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-gray-800 bg-gray-950/40 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.1em] text-gray-500">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      {scan && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
          <span>Taranan kaynak: {scan.total_sources}</span>
          <span>Değerlendirilen fırsat: {scan.analyzed_count}</span>
          {scan.finished_at && <span>Tamamlanma: {formatDate(scan.finished_at)}</span>}
        </div>
      )}
    </section>
  );
}

function LiveScanProgress({ onCompleted }) {
  const [batches, setBatches] = useState([]);
  const [runs, setRuns] = useState([]);
  const previousActiveIds = useRef(new Set());
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    let current = true;
    const loadProgress = async () => {
      try {
        const [batchData, runData] = await Promise.all([
          api.getOpportunityScanBatches(5),
          api.getOpportunityScanRuns(100),
        ]);
        if (!current) return;
        setBatches(batchData);
        setRuns(runData);
        const activeIds = new Set([
          ...batchData.filter((item) => ACTIVE_SCAN_STATUSES.has(item.status)).map((item) => `b-${item.id}`),
          ...runData.filter((item) => ACTIVE_SCAN_STATUSES.has(item.status)).map((item) => `r-${item.id}`),
        ]);
        const completedSinceLastPoll = [...previousActiveIds.current].some((id) => !activeIds.has(id));
        previousActiveIds.current = activeIds;
        if (completedSinceLastPoll) {
          onCompletedRef.current?.();
          window.dispatchEvent(new CustomEvent('opportunity-scan-finished'));
        }
      } catch {
        // Ana ekranı bir ilerleme isteği hatasıyla bölme; sonraki yoklamada yeniden dene.
      }
    };
    loadProgress();
    const interval = window.setInterval(loadProgress, 2500);
    return () => {
      current = false;
      window.clearInterval(interval);
    };
  }, []);

  const visibleBatches = batches.filter((batch) => ACTIVE_SCAN_STATUSES.has(batch.status) || isRecentlyFinished(batch));
  const batchIds = new Set(visibleBatches.map((batch) => batch.id));
  const visibleIndividualRuns = runs.filter((run) => !run.batch_id && (ACTIVE_SCAN_STATUSES.has(run.status) || isRecentlyFinished(run)));
  if (!visibleBatches.length && !visibleIndividualRuns.length) return null;

  return (
    <section className="live-scan-progress mb-5 space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Canlı Tarama Takibi</h3>
        <p className="mt-1 text-xs text-gray-500">İlerleme bilgileri yaklaşık 2,5 saniyede bir yenilenir.</p>
      </div>

      {visibleBatches.map((batch) => {
        const percent = Math.min(100, Math.max(0, Number(batch.progress_percent) || 0));
        const batchRuns = runs.filter((run) => run.batch_id === batch.id);
        const batchTimeLabel = ACTIVE_SCAN_STATUSES.has(batch.status)
          ? formatRemainingTime(batch.estimated_remaining_seconds)
          : 'Tamamlandı';
        return (
          <div key={batch.id} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white">Toplu tarama</span>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">{SCAN_STATUS_LABELS[batch.status] || 'Bilinmiyor'}</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">{batch.progress_message || 'Toplu tarama hazırlanıyor.'}</p>
                {batch.current_source_title && <p className="mt-1 text-[11px] text-cyan-300">Şu an: {batch.current_source_title}</p>}
              </div>
              <div className="text-[11px] text-gray-500 sm:text-right">
                <div>{batch.completed_sources}/{batch.total_sources} tamamlandı · {batch.failed_sources} başarısız</div>
                <div className="mt-1">{batchTimeLabel}</div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
              <div className={`h-full rounded-full transition-all duration-500 ${batch.status === 'completed_with_errors' ? 'bg-amber-500' : batch.status === 'completed' ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-500"><span>Genel ilerleme</span><span>%{percent}</span></div>
            {batchRuns.length > 0 && (
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {batchRuns.map((run) => <RunProgressRow key={run.id} run={run} />)}
              </div>
            )}
          </div>
        );
      })}

      {visibleIndividualRuns.filter((run) => !batchIds.has(run.batch_id)).map((run) => (
        <RunProgressRow key={run.id} run={run} />
      ))}
    </section>
  );
}

function ModelInput({ label, value, onChange, models, placeholder }) {
  const listId = `models-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        list={listId}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
      </datalist>
    </label>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.allSettled([api.getOpportunityAiSettings(), api.getOpportunityAiModels()])
      .then(([settingsResult, modelsResult]) => {
        if (!current) return;
        if (settingsResult.status === 'rejected') throw settingsResult.reason;
        setSettings(settingsResult.value);
        if (modelsResult.status === 'fulfilled') {
          setModels((modelsResult.value.models || []).filter((model) => model.structuredOutputCompatible !== false));
        }
        else toast.error(modelsResult.reason?.message || 'Gemini model listesi alınamadı');
      })
      .catch((error) => toast.error(error.message || 'Yapay zekâ ayarları yüklenemedi'))
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const modelOptions = useMemo(() => {
    const known = [...models];
    [settings?.extraction_model, settings?.scoring_model, settings?.fallback_model]
      .filter(Boolean)
      .forEach((id) => {
        if (!known.some((model) => model.id === id)) known.push({ id, label: id });
      });
    return known;
  }, [models, settings]);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const updateWeight = (key, value) => setSettings((current) => ({
    ...current,
    score_weights: { ...current.score_weights, [key]: Number(value) },
  }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateOpportunityAiSettings(settings);
      setSettings(updated);
      toast.success('Yapay zekâ ayarları kaydedildi');
    } catch (error) {
      toast.error(error.message || 'Yapay zekâ ayarları kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Yapay zekâ ayarları yükleniyor...</div>;
  if (!settings) return <div className="py-12 text-center text-sm text-red-300">Yapay zekâ ayarları yüklenemedi.</div>;

  return (
    <div className="space-y-5">
      <div className={`rounded-xl border px-4 py-3 text-xs ${settings.gemini_configured ? 'border-green-500/25 bg-green-500/10 text-green-300' : 'border-amber-500/25 bg-amber-500/10 text-amber-200'}`}>
        {settings.gemini_configured
          ? 'Gemini erişim anahtarı yapılandırılmış. Model listesi Gemini üzerinden eşitlenir.'
          : 'Gemini erişim anahtarı henüz sunucu ortamında tanımlı değil. Ayarları kaydedebilirsiniz; tarama anahtar eklenene kadar başlamaz.'}
      </div>

      <section className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Model seçimi</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <ModelInput label="Ön eleme modeli" value={settings.extraction_model} onChange={(value) => update('extraction_model', value)} models={modelOptions} placeholder="gemini-3.5-flash-lite" />
          <ModelInput label="Puanlama modeli" value={settings.scoring_model} onChange={(value) => update('scoring_model', value)} models={modelOptions} placeholder="gemini-3.6-flash" />
          <ModelInput label="Yedek model" value={settings.fallback_model} onChange={(value) => update('fallback_model', value)} models={modelOptions} placeholder="İsteğe bağlı" />
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Listeden seçim yapabilir veya Gemini tarafından desteklenen model kodunu elle girebilirsiniz.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Şirket profili</span>
          <textarea rows={9} value={settings.company_profile || ''} onChange={(event) => update('company_profile', event.target.value)} className={`${fieldClass} resize-y`} placeholder="CERİLAS faaliyet alanları, teknoloji yetkinlikleri, referansları ve stratejik hedefleri..." />
        </label>
        <label className="block">
          <span className={labelClass}>Kişisel profil</span>
          <textarea rows={9} value={settings.personal_profile || ''} onChange={(event) => update('personal_profile', event.target.value)} className={`${fieldClass} resize-y`} placeholder="Deniz Can Ilgın deneyimi, uzmanlıkları, hedefleri ve ilgi alanları..." />
        </label>
        <label className="block">
          <span className={labelClass}>Aranan fırsat türleri</span>
          <textarea rows={4} value={settings.opportunity_types || ''} onChange={(event) => update('opportunity_types', event.target.value)} className={`${fieldClass} resize-y`} />
        </label>
        <label className="block">
          <span className={labelClass}>Hariç tutulacak fırsatlar</span>
          <textarea rows={4} value={settings.excluded_opportunities || ''} onChange={(event) => update('excluded_opportunities', event.target.value)} className={`${fieldClass} resize-y`} placeholder="Uygun olmayan sektörler, ülkeler veya fırsat tipleri..." />
        </label>
        <label className="block">
          <span className={labelClass}>Hedef bölgeler</span>
          <textarea rows={3} value={settings.target_regions || ''} onChange={(event) => update('target_regions', event.target.value)} className={`${fieldClass} resize-y`} />
        </label>
        <label className="block">
          <span className={labelClass}>Başvuru uygunluğu tercihleri</span>
          <textarea rows={3} value={settings.eligibility_preferences || ''} onChange={(event) => update('eligibility_preferences', event.target.value)} className={`${fieldClass} resize-y`} />
        </label>
        <label className="block lg:col-span-2">
          <span className={labelClass}>Özel yapay zekâ talimatı</span>
          <textarea rows={5} value={settings.custom_instructions || ''} onChange={(event) => update('custom_instructions', event.target.value)} className={`${fieldClass} resize-y`} placeholder="Modelin değerlendirme sırasında özellikle uygulamasını istediğiniz kurallar..." />
        </label>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Puanlama ve çalışma ayarları</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEIGHT_FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className={labelClass}>{label} ağırlığı</span>
              <input type="number" min="0" max="100" value={settings.score_weights?.[key] ?? 0} onChange={(event) => updateWeight(key, event.target.value)} className={fieldClass} />
            </label>
          ))}
          <label className="block">
            <span className={labelClass}>Kısa liste alt sınırı</span>
            <input type="number" min="0" max="100" value={settings.shortlist_threshold} onChange={(event) => update('shortlist_threshold', Number(event.target.value))} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Kaynak başına azami aday</span>
            <input type="number" min="1" max="50" value={settings.max_candidates_per_source} onChange={(event) => update('max_candidates_per_source', Number(event.target.value))} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Yanıt çeşitliliği</span>
            <input type="number" min="0" max="1" step="0.05" value={settings.temperature} onChange={(event) => update('temperature', Number(event.target.value))} className={fieldClass} />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-cyan-400 disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : 'Yapay Zekâ Ayarlarını Kaydet'}
        </button>
      </div>
    </div>
  );
}

function ShortlistPanel({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [reportScope, setReportScope] = useState('shortlist');
  const [exporting, setExporting] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    api.getOpportunityCandidates({ shortlisted: showAll ? '' : 'true', limit: 150 })
      .then(setItems)
      .catch((error) => toast.error(error.message || 'Yapay zekâ fırsatları yüklenemedi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let current = true;
    api.getOpportunityCandidates({ shortlisted: showAll ? '' : 'true', limit: 150 })
      .then((data) => { if (current) setItems(data); })
      .catch((error) => { if (current) toast.error(error.message || 'Yapay zekâ fırsatları yüklenemedi'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [showAll, refreshKey]);

  const toggleShortlist = async (item) => {
    try {
      await api.updateOpportunityCandidate(item.id, { is_shortlisted: !item.is_shortlisted });
      load();
    } catch (error) {
      toast.error(error.message || 'Kısa liste güncellenemedi');
    }
  };

  const addRecipients = () => {
    const values = emailDraft.split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (!values.length) return recipients;
    const invalid = values.filter((value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    if (invalid.length) {
      toast.error(`Geçersiz e-posta: ${invalid.join(', ')}`);
      return recipients;
    }
    const next = [...new Set([...recipients, ...values])].slice(0, 25);
    setRecipients(next);
    setEmailDraft('');
    return next;
  };

  const downloadReport = async (format) => {
    setExporting(format);
    try {
      const { blob, filename } = await api.downloadOpportunityReport(format, reportScope);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} raporu indirildi`);
    } catch (error) {
      toast.error(error.message || 'Rapor indirilemedi');
    } finally {
      setExporting('');
    }
  };

  const sendReport = async () => {
    const finalRecipients = emailDraft.trim() ? addRecipients() : recipients;
    if (!finalRecipients.length) return toast.error('En az bir e-posta adresi ekleyin');
    setSending(true);
    try {
      const result = await api.emailOpportunityReport({ scope: reportScope, recipients: finalRecipients });
      if (result.failed) toast.error(`${result.sent} gönderildi, ${result.failed} gönderilemedi`);
      else toast.success(`Rapor ${result.sent} alıcıya ayrı ayrı gönderildi`);
      if (!result.failed) {
        setRecipients([]);
        setEmailDraft('');
        setEmailOpen(false);
      }
    } catch (error) {
      toast.error(error.message || 'Rapor e-postası gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <section className="opportunity-report-panel mb-4 overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-purple-500/[0.04]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-white">Raporla ve paylaş</h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">Güncel sonuçları kurumsal PDF veya düzenlenebilir Excel olarak indir; aynı dosyaları özenli bir özet e-postasıyla paylaş.</p>
          </div>
          <div className="shrink-0">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Rapor kapsamı</span>
            <div className="opportunity-report-scope grid grid-cols-2 rounded-lg border border-gray-700 bg-gray-950/60 p-1">
              <button onClick={() => setReportScope('shortlist')} className={`min-w-28 rounded-md px-3 py-2 text-xs font-medium ${reportScope === 'shortlist' ? 'opportunity-report-scope-shortlist bg-green-500/15 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}>Kısa liste</button>
              <button onClick={() => setReportScope('all')} className={`min-w-28 rounded-md px-3 py-2 text-xs font-medium ${reportScope === 'all' ? 'opportunity-report-scope-all bg-cyan-500/15 text-cyan-300' : 'text-gray-500 hover:text-gray-300'}`}>Tüm sonuçlar</button>
            </div>
          </div>
        </div>
        <div className="opportunity-report-actions grid gap-3 border-t border-cyan-500/15 p-5 md:grid-cols-2">
          <div className="opportunity-report-action-card flex flex-col rounded-xl border border-gray-800 bg-gray-950/30 p-4">
            <div className="mb-4 flex-1">
              <p className="text-xs font-semibold text-white">Dosya olarak indir</p>
              <p className="mt-1 text-[11px] leading-5 text-gray-500">Sunuma hazır PDF veya üzerinde çalışabileceğiniz Excel çıktısı oluşturun.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => downloadReport('pdf')} disabled={Boolean(exporting)} className="opportunity-report-pdf rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-400/15 disabled:opacity-50">{exporting === 'pdf' ? 'Hazırlanıyor...' : 'PDF indir'}</button>
              <button onClick={() => downloadReport('xlsx')} disabled={Boolean(exporting)} className="opportunity-report-excel rounded-lg border border-green-400/25 bg-green-400/10 px-3 py-2.5 text-xs font-semibold text-green-200 hover:bg-green-400/15 disabled:opacity-50">{exporting === 'xlsx' ? 'Hazırlanıyor...' : 'Excel indir'}</button>
            </div>
          </div>
          <div className="opportunity-report-action-card flex flex-col rounded-xl border border-gray-800 bg-gray-950/30 p-4">
            <div className="mb-4 flex-1">
              <p className="text-xs font-semibold text-white">E-posta ile paylaş</p>
              <p className="mt-1 text-[11px] leading-5 text-gray-500">Birden fazla alıcıya, adresleri birbirinden gizleyerek ayrı ayrı gönderin.</p>
            </div>
            <button onClick={() => setEmailOpen((value) => !value)} className="w-full rounded-lg bg-cyan-400 px-3 py-2.5 text-xs font-semibold text-gray-950 hover:bg-cyan-300">
              {emailOpen ? 'Paylaşım alanını kapat' : 'Alıcıları ekle ve gönder'}
            </button>
          </div>
        </div>
        {emailOpen && (
          <div className="opportunity-report-email border-t border-cyan-500/15 bg-gray-950/35 p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-white">Alıcıları belirleyin</p>
                <p className="mt-1 text-[11px] text-gray-500">En fazla 25 adres ekleyebilirsiniz.</p>
              </div>
              {recipients.length > 0 && <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">{recipients.length} alıcı</span>}
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label className={labelClass}>Alıcı e-posta adresleri</label>
                {recipients.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {recipients.map((recipient) => (
                      <span key={recipient} className="opportunity-report-recipient inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                        {recipient}
                        <button onClick={() => setRecipients((current) => current.filter((item) => item !== recipient))} className="text-cyan-500 hover:text-white" aria-label={`${recipient} adresini kaldır`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (['Enter', ',', ';'].includes(event.key)) {
                      event.preventDefault();
                      addRecipients();
                    }
                  }}
                  onBlur={() => { if (emailDraft.trim()) addRecipients(); }}
                  className={`${fieldClass} h-11`}
                  placeholder="ornek@firma.com — Enter ile birden fazla adres ekleyin"
                />
              </div>
              <button onMouseDown={(event) => event.preventDefault()} onClick={sendReport} disabled={sending} className="h-11 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-300 px-5 text-xs font-bold text-gray-950 shadow-lg shadow-cyan-500/10 hover:from-cyan-300 hover:to-cyan-200 disabled:opacity-50 lg:w-auto">
                {sending ? 'Gönderiliyor...' : `${reportScope === 'shortlist' ? 'Kısa Listeyi' : 'Tüm Sonuçları'} Gönder`}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Her alıcıya ayrı e-posta gönderilir; adresler diğer alıcılarla paylaşılmaz. PDF ve Excel otomatik eklenir.</p>
          </div>
        )}
      </section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} className="h-4 w-4 accent-cyan-500" />
          Kısa liste dışındaki yapay zekâ sonuçlarını da göster
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setListCollapsed((current) => !current)}
            className="rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
          >
            {listCollapsed ? 'Sonuçları göster' : 'Sonuçları gizle'}
          </button>
          <button onClick={load} className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">Yenile</button>
        </div>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Yapay zekâ sonuçları yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center text-sm text-gray-500">Henüz yapay zekâ tarafından değerlendirilen fırsat yok.</div>
      ) : listCollapsed ? (
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-300">
          <p>{items.length} yapay zekâ sonucu saklandı. Listeyi tekrar açmak için üstteki düğmeyi kullanın.</p>
          <p className="mt-2 text-xs text-gray-500">Kısa liste dışındaki sonuçları görmek için “Kısa liste dışındaki yapay zekâ sonuçlarını da göster” seçeneğini kullanabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-xl border p-4 ${item.is_shortlisted ? 'border-green-500/25 bg-green-500/[0.05]' : 'border-gray-800 bg-gray-950/40'}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${item.score >= 80 ? 'bg-green-500/15 text-green-300' : item.score >= 60 ? 'bg-amber-500/15 text-amber-200' : 'bg-red-500/15 text-red-300'}`}>{item.score}/100</span>
                    {item.is_shortlisted && <span className="rounded-full border border-green-500/25 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-300">KISA LİSTE</span>}
                    {item.opportunity_type && <span className="text-[11px] text-cyan-300">{item.opportunity_type}</span>}
                    <span className="text-[11px] text-gray-600">Güven: %{item.confidence}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{item.description}</p>
                  {item.rationale && <p className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs leading-5 text-gray-300">{item.rationale}</p>}
                  <div className="mt-2 grid gap-1 text-[11px] text-gray-500 sm:grid-cols-2">
                    <span>Son tarih: {item.deadline_text || 'Belirtilmedi'}</span>
                    <span>Destek: {item.funding_text || 'Belirtilmedi'}</span>
                    <span>Bölge: {item.geography || 'Belirtilmedi'}</span>
                    <span>Kaynak: {item.source_title || item.source_domain || 'Bilinmiyor'}</span>
                  </div>
                  {item.fit_reasons?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.fit_reasons.map((reason) => <span key={reason} className="rounded-md bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300">{reason}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a href={item.external_url} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-gray-950 hover:bg-cyan-300">Fırsatı Aç</a>
                  <button onClick={() => toggleShortlist(item)} className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                    {item.is_shortlisted ? 'Kısa listeden çıkar' : 'Kısa listeye ekle'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RunsPanel({ refreshKey }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    api.getOpportunityScanRuns(VISIBLE_RUN_LIMIT)
      .then((data) => { if (current) setRuns(data); })
      .catch((error) => { if (current) toast.error(error.message || 'Tarama geçmişi yüklenemedi'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [refreshKey]);

  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Tarama geçmişi yükleniyor...</div>;
  if (!runs.length) return <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center text-sm text-gray-500">Henüz tarama çalıştırılmadı.</div>;

  return (
    <div>
      <p className="mb-2 text-right text-[11px] text-gray-500">Son {VISIBLE_RUN_LIMIT} tarama gösteriliyor; eski kayıtlar veritabanında korunur.</p>
      <div className="overflow-hidden rounded-xl border border-gray-800">
        {runs.map((run) => (
          <div key={run.id} className="border-b border-gray-800 bg-gray-950/30 px-4 py-3 last:border-b-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${run.status === 'completed' ? 'bg-green-500/10 text-green-300' : run.status === 'failed' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-200'}`}>{SCAN_STATUS_LABELS[run.status] || 'Bilinmiyor'}</span>
                <span className="text-xs font-medium text-white">{run.source_title || 'Silinmiş kaynak'}</span>
                <span className="text-[10px] text-gray-600">{TRIGGER_TYPE_LABELS[run.trigger_type] || 'Bilinmeyen başlatma türü'}</span>
              </div>
              {run.error && <p className="mt-1 text-xs text-red-300">{run.error}</p>}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span>Sayfa: {run.details?.pages_scanned || '—'}</span>
              <span>Bulunan: {run.discovered_count}</span>
              <span>Analiz: {run.analyzed_count}</span>
              <span>Kısa liste: {run.shortlisted_count}</span>
              <span>{formatDate(run.started_at)}</span>
            </div>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OpportunityAutomation() {
  const [tab, setTab] = useState('shortlist');
  const [scanning, setScanning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const scanAll = async () => {
    setScanning(true);
    try {
      const result = await api.scanDueOpportunities(true);
      toast.success(`${result.total_sources || 0} etkin kaynak için toplu tarama başlatıldı`);
      setTab('runs');
      window.setTimeout(() => setRefreshKey((value) => value + 1), 1500);
    } catch (error) {
      toast.error(error.message || 'Tarama başlatılamadı');
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="opportunity-automation-panel mb-6 overflow-hidden rounded-2xl border border-cyan-500/15 bg-gray-900 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-3 border-b border-gray-800 bg-gradient-to-r from-cyan-500/[0.08] to-purple-500/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Yapay Zekâ Fırsat Keşfi</h2>
          <p className="mt-1 text-xs text-gray-500">Kaynakları belirli aralıklarla tara, Gemini ile değerlendir ve uygun fırsatları kısa listeye al.</p>
        </div>
        <button onClick={scanAll} disabled={scanning} className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-50">
          {scanning ? 'Başlatılıyor...' : 'Tüm Kaynakları Şimdi Tara'}
        </button>
      </div>
      <LastFullScanSummary />
      <div className="px-4 pt-4">
        <LiveScanProgress onCompleted={() => setRefreshKey((value) => value + 1)} />
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-gray-800 px-3 pt-3">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium ${tab === item.id ? 'bg-gray-800 text-cyan-300' : 'text-gray-500 hover:text-gray-300'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === 'shortlist' && <ShortlistPanel refreshKey={refreshKey} />}
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'runs' && <RunsPanel refreshKey={refreshKey} />}
      </div>
    </section>
  );
}
