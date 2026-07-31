import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { ConfirmModal, Dropdown } from '../../components/ui';

const CATEGORIES = [
  'Sözleşme',
  'Teklif',
  'Fatura',
  'Rapor',
  'Sunum',
  'Teknik Doküman',
  'Resmî Evrak',
  'Finans',
  'İnsan Kaynakları',
  'Diğer',
];

const ACCEPTED_FILES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp,.jpg,.jpeg,.png,.webp,.gif,.svg,.zip,.rar,.7z';

const EMPTY_METADATA = {
  title: '',
  scope_type: 'company',
  project_id: '',
  folder_id: '',
  category: 'Diğer',
  tags: '',
  note: '',
};

const inputClass = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10';

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getExtension(name = '') {
  return name.includes('.') ? name.split('.').pop().toUpperCase() : 'DOSYA';
}

function FileTypeIcon({ document }) {
  const mime = document.mime_type || '';
  const extension = getExtension(document.original_name);
  let color = 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  if (mime.includes('pdf')) color = 'text-red-400 bg-red-500/10 border-red-500/20';
  else if (mime.includes('word') || ['DOC', 'DOCX'].includes(extension)) color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  else if (mime.includes('sheet') || mime.includes('excel') || ['XLS', 'XLSX', 'CSV'].includes(extension)) color = 'text-green-400 bg-green-500/10 border-green-500/20';
  else if (mime.includes('presentation') || ['PPT', 'PPTX'].includes(extension)) color = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  else if (mime.startsWith('image/')) color = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  else if (mime.includes('zip') || ['ZIP', 'RAR', '7Z'].includes(extension)) color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  return (
    <div className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border ${color}`}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8m-6-6 6 6m-6-6v6h6" />
      </svg>
      <span className="mt-0.5 text-[7px] font-bold leading-none">{extension}</span>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function MetadataFields({ value, onChange, projects, folders, includeTitle = true }) {
  const availableFolders = folders.filter((folder) => (
    folder.scope_type === value.scope_type
    && Number(folder.project_id || 0) === Number(value.project_id || 0)
  ));
  const dropdownButtonClass = 'h-[42px] w-full flex items-center justify-between rounded-lg border border-gray-700 bg-gray-950/80 px-3 text-sm text-gray-300 shadow-inner shadow-black/10 outline-none transition-colors hover:border-gray-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10';

  const setField = (field, nextValue) => onChange({ ...value, [field]: nextValue });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {includeTitle && (
        <Field label="Belge Adı" className="sm:col-span-2">
          <input value={value.title} onChange={(event) => setField('title', event.target.value)} className={inputClass} placeholder="Boş bırakılırsa dosya adı kullanılır" />
        </Field>
      )}
      <Field label="Belge Alanı">
        <Dropdown
          value={value.scope_type}
          onChange={(nextValue) => onChange({
            ...value,
            scope_type: nextValue,
            project_id: '',
            folder_id: '',
          })}
          options={[
            { value: 'company', label: 'Şirket Belgeleri' },
            { value: 'project', label: 'Proje Belgeleri' },
          ]}
          buttonClassName={dropdownButtonClass}
        />
      </Field>
      <Field label="Kategori">
        <Dropdown
          value={value.category}
          onChange={(nextValue) => setField('category', nextValue)}
          options={CATEGORIES.map((category) => ({ value: category, label: category }))}
          buttonClassName={dropdownButtonClass}
        />
      </Field>
      {value.scope_type === 'project' && (
        <Field label="Proje">
          <Dropdown
            value={String(value.project_id || '')}
            onChange={(nextValue) => onChange({ ...value, project_id: nextValue, folder_id: '' })}
            options={projects.map((project) => ({
              value: String(project.id),
              label: project.title_tr || project.slug,
            }))}
            placeholder="Proje seçin"
            buttonClassName={dropdownButtonClass}
          />
        </Field>
      )}
      <Field label="Klasör">
        <Dropdown
          value={String(value.folder_id || '')}
          onChange={(nextValue) => setField('folder_id', nextValue)}
          options={[
            { value: '', label: 'Ana dizin' },
            ...availableFolders.map((folder) => ({
              value: String(folder.id),
              label: folder.name,
            })),
          ]}
          buttonClassName={dropdownButtonClass}
        />
      </Field>
      <Field label="Etiketler" className="sm:col-span-2">
        <input value={value.tags} onChange={(event) => setField('tags', event.target.value)} className={inputClass} placeholder="tübitak, sözleşme, 2026 (virgülle ayırın)" />
      </Field>
      <Field label="Not" className="sm:col-span-2">
        <textarea value={value.note} onChange={(event) => setField('note', event.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Belgeyle ilgili iç not..." />
      </Field>
    </div>
  );
}

export default function DocumentsAdmin() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [trashMode, setTrashMode] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadMetadata, setUploadMetadata] = useState({ ...EMPTY_METADATA });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', scope_type: 'company', project_id: '' });
  const [folderSaving, setFolderSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareWorking, setShareWorking] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let current = true;
    Promise.all([api.getAdminProjects(), api.getDocumentFolders()])
      .then(([projectData, folderData]) => {
        if (!current) return;
        setProjects(projectData);
        setFolders(folderData);
      })
      .catch((error) => toast.error(error.message || 'Belge seçenekleri yüklenemedi'));
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const params = {
      page,
      limit: pageSize,
      deleted: trashMode,
    };
    if (!trashMode && scopeFilter !== 'all') params.scope_type = scopeFilter;
    if (!trashMode && projectFilter) params.project_id = projectFilter;
    if (!trashMode && folderFilter) params.folder_id = folderFilter;
    if (!trashMode && categoryFilter !== 'all') params.category = categoryFilter;
    if (deferredSearch.trim()) params.search = deferredSearch.trim();

    api.getDocuments(params)
      .then((data) => {
        if (!current) return;
        setDocuments(data.documents);
        setTotal(data.total);
        setTotalPages(Math.max(1, data.totalPages || 1));
      })
      .catch((error) => {
        if (current) toast.error(error.message || 'Belgeler yüklenemedi');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [page, pageSize, scopeFilter, projectFilter, folderFilter, categoryFilter, deferredSearch, trashMode]);

  const refreshDocuments = async () => {
    setLoading(true);
    const params = { page, limit: pageSize, deleted: trashMode };
    if (!trashMode && scopeFilter !== 'all') params.scope_type = scopeFilter;
    if (!trashMode && projectFilter) params.project_id = projectFilter;
    if (!trashMode && folderFilter) params.folder_id = folderFilter;
    if (!trashMode && categoryFilter !== 'all') params.category = categoryFilter;
    if (search.trim()) params.search = search.trim();
    try {
      const data = await api.getDocuments(params);
      setDocuments(data.documents);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } finally {
      setLoading(false);
    }
  };

  const refreshFolders = async () => {
    const data = await api.getDocumentFolders();
    setFolders(data);
  };

  const folderOptions = useMemo(() => folders.filter((folder) => {
    if (scopeFilter === 'company') return folder.scope_type === 'company';
    if (scopeFilter === 'project') {
      return folder.scope_type === 'project' && (!projectFilter || Number(folder.project_id) === Number(projectFilter));
    }
    return true;
  }), [folders, scopeFilter, projectFilter]);

  const setFilter = (setter, value) => {
    setLoading(true);
    setPage(1);
    setter(value);
  };

  const openUpload = () => {
    setUploadFiles([]);
    setUploadMetadata({
      ...EMPTY_METADATA,
      scope_type: scopeFilter === 'project' ? 'project' : 'company',
      project_id: scopeFilter === 'project' ? projectFilter : '',
      folder_id: folderFilter,
    });
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return toast.error('En az bir dosya seçin');
    if (uploadMetadata.scope_type === 'project' && !uploadMetadata.project_id) {
      return toast.error('Proje belgesi için proje seçin');
    }
    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(uploadMetadata).forEach(([key, value]) => {
          const finalValue = key === 'title' && uploadFiles.length > 1 ? '' : value;
          formData.append(key, finalValue);
        });
        await api.uploadDocument(formData);
        uploadedCount += 1;
      }
      toast.success(`${uploadedCount} belge yüklendi`);
      setUploadOpen(false);
      setPage(1);
      await refreshDocuments();
      await refreshFolders();
    } catch (error) {
      toast.error(`${uploadedCount} dosya yüklendi. ${error.message || 'Yükleme durdu.'}`);
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (document, download) => {
    const previewWindow = download ? null : window.open('about:blank', '_blank');
    try {
      const file = await api.fetchDocumentFile(document.id, download);
      const url = URL.createObjectURL(file.blob);
      if (download) {
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = file.filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } else {
        if (!previewWindow) throw new Error('Tarayıcı yeni pencereyi engelledi. Açılır pencerelere izin verip tekrar deneyin.');
        previewWindow.opener = null;
        previewWindow.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      previewWindow?.close();
      toast.error(error.message || 'Belge açılamadı');
    }
  };

  const openEdit = (document) => {
    setReplacementFile(null);
    setEditing({
      ...document,
      project_id: document.project_id || '',
      folder_id: document.folder_id || '',
      tags: (document.tags || []).join(', '),
    });
  };

  const saveEdit = async () => {
    if (!editing.title.trim()) return toast.error('Belge adı zorunludur');
    setSaving(true);
    try {
      await api.updateDocument(editing.id, editing);
      if (replacementFile) {
        await api.replaceDocumentFile(editing.id, replacementFile);
      }
      toast.success(replacementFile ? 'Belge bilgileri ve dosyası güncellendi' : 'Belge bilgileri güncellendi');
      setEditing(null);
      setReplacementFile(null);
      await refreshDocuments();
      await refreshFolders();
    } catch (error) {
      toast.error(error.message || 'Belge güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const createFolder = async () => {
    if (!newFolder.name.trim()) return toast.error('Klasör adı zorunludur');
    if (newFolder.scope_type === 'project' && !newFolder.project_id) return toast.error('Proje seçin');
    setFolderSaving(true);
    try {
      await api.createDocumentFolder(newFolder);
      toast.success('Klasör oluşturuldu');
      setNewFolder({ name: '', scope_type: 'company', project_id: '' });
      await refreshFolders();
    } catch (error) {
      toast.error(error.message || 'Klasör oluşturulamadı');
    } finally {
      setFolderSaving(false);
    }
  };

  const deleteFolder = async (folder) => {
    try {
      await api.deleteDocumentFolder(folder.id);
      toast.success('Klasör silindi');
      await refreshFolders();
    } catch (error) {
      toast.error(error.message || 'Klasör silinemedi');
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      if (target.action === 'trash') {
        await api.trashDocument(target.document.id);
        toast.success('Belge çöp kutusuna taşındı');
      } else {
        await api.permanentlyDeleteDocument(target.document.id);
        toast.success('Belge kalıcı olarak silindi');
      }
      await refreshDocuments();
      await refreshFolders();
    } catch (error) {
      toast.error(error.message || 'İşlem tamamlanamadı');
    }
  };

  const restoreDocument = async (document) => {
    try {
      await api.restoreDocument(document.id);
      toast.success('Belge geri yüklendi');
      await refreshDocuments();
      await refreshFolders();
    } catch (error) {
      toast.error(error.message || 'Belge geri yüklenemedi');
    }
  };

  const openShare = async (document) => {
    setShareTarget(document);
    setShareStatus(null);
    setShareLink('');
    setShareLoading(true);
    try {
      setShareStatus(await api.getDocumentShare(document.id));
    } catch (error) {
      toast.error(error.message || 'Paylaşım durumu alınamadı');
      setShareTarget(null);
    } finally {
      setShareLoading(false);
    }
  };

  const createShareLink = async () => {
    setShareWorking(true);
    try {
      const result = await api.createDocumentShare(shareTarget.id);
      const fullLink = result.shareUrl || `${window.location.origin}${result.sharePath}`;
      setShareLink(fullLink);
      setShareStatus({ active: true, share: result.share });
      await navigator.clipboard.writeText(fullLink);
      toast.success('Yeni paylaşım bağlantısı oluşturuldu ve kopyalandı');
    } catch (error) {
      toast.error(error.message || 'Paylaşım bağlantısı oluşturulamadı');
    } finally {
      setShareWorking(false);
    }
  };

  const revokeShareLink = async () => {
    setShareWorking(true);
    try {
      await api.revokeDocumentShare(shareTarget.id);
      setShareStatus({ active: false, share: null });
      setShareLink('');
      toast.success('Paylaşım bağlantısı iptal edildi');
    } catch (error) {
      toast.error(error.message || 'Paylaşım bağlantısı iptal edilemedi');
    } finally {
      setShareWorking(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Paylaşım bağlantısı kopyalandı');
    } catch {
      toast.error('Bağlantı kopyalanamadı');
    }
  };

  return (
    <div className="documents-admin-page mx-auto max-w-7xl pb-20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </span>
            <h1 className="text-xl font-bold text-white">Belge Yönetimi</h1>
          </div>
          <p className="text-sm text-gray-400">Şirket ve proje evraklarını güvenli şekilde yükleyin, sınıflandırın ve yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFolderManagerOpen(true)} className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white">
            Klasörler
          </button>
          <button onClick={openUpload} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-gray-950 hover:bg-cyan-400">
            + Belge Yükle
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1.5">
        {[
          { label: 'Tüm Belgeler', scope: 'all', trash: false },
          { label: 'Şirket', scope: 'company', trash: false },
          { label: 'Projeler', scope: 'project', trash: false },
          { label: 'Çöp Kutusu', scope: 'all', trash: true },
        ].map((tab) => {
          const active = trashMode === tab.trash && (tab.trash || scopeFilter === tab.scope);
          return (
            <button
              key={tab.label}
              onClick={() => {
                setLoading(true);
                setTrashMode(tab.trash);
                setScopeFilter(tab.scope);
                setProjectFilter('');
                setFolderFilter('');
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                active ? 'bg-cyan-500/15 text-cyan-300' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="documents-toolbar mb-4 grid gap-2 rounded-xl border border-gray-800 bg-gray-900 p-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px_160px]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-lg border border-gray-800 bg-gray-950/80 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-500/50"
            placeholder="Belge adı, etiket veya not ara..."
          />
        </div>
        {!trashMode && (
          <>
            <select
              value={projectFilter}
              onChange={(event) => {
                setFolderFilter('');
                setFilter(setProjectFilter, event.target.value);
              }}
              disabled={scopeFilter === 'company'}
              className="h-9 rounded-lg border border-gray-800 bg-gray-950/80 px-3 text-xs text-gray-300 outline-none disabled:opacity-40"
            >
              <option value="">Tüm projeler</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title_tr || project.slug}</option>)}
            </select>
            <select value={folderFilter} onChange={(event) => setFilter(setFolderFilter, event.target.value)} className="h-9 rounded-lg border border-gray-800 bg-gray-950/80 px-3 text-xs text-gray-300 outline-none">
              <option value="">Tüm klasörler</option>
              {folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(event) => setFilter(setCategoryFilter, event.target.value)} className="h-9 rounded-lg border border-gray-800 bg-gray-950/80 px-3 text-xs text-gray-300 outline-none">
              <option value="all">Tüm kategoriler</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/50 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-800 text-gray-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">{trashMode ? 'Çöp kutusu boş' : 'Henüz belge bulunmuyor'}</h2>
          {!trashMode && <button onClick={openUpload} className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300">İlk Belgeyi Yükle</button>}
        </div>
      ) : (
        <>
          <div className="documents-list overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {documents.map((document) => {
              const fileMissing = document.file_available === false;
              return (
              <div
                key={document.id}
                className={`document-row border-b px-3 py-2.5 last:border-b-0 ${
                  fileMissing
                    ? 'document-row-file-missing border-red-500/30 bg-red-500/[0.07] hover:bg-red-500/[0.11]'
                    : 'border-gray-800 hover:bg-white/[0.025]'
                }`}
              >
                <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.2fr)_minmax(190px,.8fr)_minmax(220px,1fr)_auto] xl:items-center">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileTypeIcon document={document} />
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h2 className="truncate text-xs font-semibold text-white">{document.title}</h2>
                        {fileMissing && (
                          <span className="document-file-missing-badge inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-red-300">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                            </svg>
                            Dosya bulunamadı
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="truncate">{document.original_name}</span>
                        <span>•</span>
                        <span>{formatBytes(document.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-1.5 py-0.5 ${document.scope_type === 'project' ? 'bg-purple-500/10 text-purple-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                        {document.scope_type === 'project' ? 'Proje' : 'Şirket'}
                      </span>
                      <span className="truncate text-gray-300">{document.project_name || document.folder_name || 'Ana dizin'}</span>
                    </div>
                    {document.folder_name && document.project_name && <div className="mt-1 truncate text-gray-500">Klasör: {document.folder_name}</div>}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">{document.category}</span>
                      {(document.tags || []).slice(0, 3).map((tag) => <span key={tag} className="text-[10px] text-cyan-400">#{tag}</span>)}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-gray-500">
                      {document.note || `Yükleyen: ${document.uploaded_by_email || 'Bilinmiyor'}`} · {new Date(document.updated_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 xl:justify-end">
                    {!trashMode ? (
                      <>
                        {fileMissing ? (
                          <button onClick={() => openEdit(document)} className="document-file-replace-button rounded-md border border-red-500/35 bg-red-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-red-200 hover:bg-red-500/25">
                            Dosyayı yenile
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openFile(document, false)} className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-[10px] font-bold text-gray-950 hover:bg-cyan-300">Aç</button>
                            <button onClick={() => openFile(document, true)} className="rounded-md border border-gray-700 px-2 py-1.5 text-[10px] text-gray-300 hover:bg-white/5">İndir</button>
                            <button onClick={() => openShare(document)} className="rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-1.5 text-[10px] text-blue-300 hover:bg-blue-500/20">Paylaş</button>
                            <button onClick={() => openEdit(document)} className="rounded-md border border-gray-700 px-2 py-1.5 text-[10px] text-gray-400 hover:text-white">Düzenle</button>
                          </>
                        )}
                        <button onClick={() => setDeleteTarget({ document, action: 'trash' })} className="rounded-md border border-red-500/20 px-2 py-1.5 text-[10px] text-red-300 hover:bg-red-500/10">Çöpe At</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => restoreDocument(document)} className="rounded-md border border-green-500/25 bg-green-500/10 px-2.5 py-1.5 text-[10px] font-medium text-green-300">Geri Yükle</button>
                        <button onClick={() => setDeleteTarget({ document, action: 'permanent' })} className="rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-medium text-red-300">Kalıcı Sil</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total} belge</span>
              <Dropdown
                value={pageSize}
                onChange={(value) => {
                  setLoading(true);
                  setPageSize(Number(value));
                  setPage(1);
                }}
                options={[10, 20, 50].map((value) => ({ value, label: `${value} kayıt` }))}
                buttonClassName="h-8 min-w-24 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-2.5 text-[11px] text-gray-400"
              />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setLoading(true); setPage(Math.max(1, page - 1)); }} disabled={page === 1} className="rounded-md border border-gray-800 px-3 py-1.5 text-[10px] text-gray-400 disabled:opacity-30">Önceki</button>
              <span className="rounded-md border border-gray-800 bg-gray-900 px-3 py-1.5 text-[10px] text-gray-300">{page} / {totalPages}</span>
              <button onClick={() => { setLoading(true); setPage(Math.min(totalPages, page + 1)); }} disabled={page >= totalPages} className="rounded-md border border-gray-800 px-3 py-1.5 text-[10px] text-gray-400 disabled:opacity-30">Sonraki</button>
            </div>
          </div>
        </>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="document-modal max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Belge Yükle</h2>
                <p className="mt-1 text-xs text-gray-500">PDF, Office, görsel ve arşiv dosyaları · en fazla 100 MB</p>
              </div>
              <button onClick={() => !uploading && setUploadOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>

            <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={(event) => setUploadFiles([...event.target.files])} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                setUploadFiles([...event.dataTransfer.files]);
              }}
              className={`mb-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
                dragOver ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-700 bg-gray-950/50 hover:border-cyan-500/40'
              }`}
            >
              <svg className="mb-2 h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
              </svg>
              <span className="text-sm font-medium text-white">{uploadFiles.length ? `${uploadFiles.length} dosya seçildi` : 'Dosyaları sürükleyin veya seçin'}</span>
              {uploadFiles.length > 0 && <span className="mt-1 max-w-full truncate text-xs text-gray-500">{uploadFiles.map((file) => file.name).join(', ')}</span>}
            </button>

            <MetadataFields value={uploadMetadata} onChange={setUploadMetadata} projects={projects} folders={folders} includeTitle={uploadFiles.length <= 1} />

            <div className="mt-5 flex justify-end gap-2 border-t border-gray-800 pt-4">
              <button onClick={() => setUploadOpen(false)} disabled={uploading} className="rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-300">Vazgeç</button>
              <button onClick={handleUpload} disabled={uploading || uploadFiles.length === 0} className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-gray-950 disabled:opacity-50">
                {uploading ? 'Yükleniyor...' : `${uploadFiles.length || ''} Belgeyi Yükle`}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !saving && setEditing(null)}>
          <div className="document-modal max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Belgeyi Düzenle</h2>
                <p className="mt-1 text-xs text-gray-500">{editing.original_name}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>
            <MetadataFields value={editing} onChange={setEditing} projects={projects} folders={folders} />
            <div className="document-file-replace mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
              <label className="document-file-replace-title block text-xs font-medium text-amber-200">Belge dosyasını yenile</label>
              <p className="document-file-replace-copy mt-1 text-[11px] leading-4 text-gray-500">
                Deploy sırasında kaybolan veya değiştirilmesi gereken dosyayı burada yeniden seçebilirsiniz. Mevcut paylaşım bağlantısı korunur.
              </p>
              <input
                type="file"
                accept={ACCEPTED_FILES}
                onChange={(event) => setReplacementFile(event.target.files?.[0] || null)}
                className="document-file-replace-input mt-3 block w-full text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-amber-200 hover:file:bg-amber-500/25"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-gray-800 pt-4">
              <button onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-300">Vazgeç</button>
              <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-gray-950 disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

      {folderManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setFolderManagerOpen(false)}>
          <div className="document-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Klasörleri Yönet</h2>
                <p className="mt-1 text-xs text-gray-500">Şirket veya proje alanı için klasör oluşturun.</p>
              </div>
              <button onClick={() => setFolderManagerOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>
            <div className="mb-4 grid gap-2 rounded-xl border border-gray-800 bg-gray-950/50 p-3 sm:grid-cols-[1fr_150px_1fr_auto]">
              <input value={newFolder.name} onChange={(event) => setNewFolder({ ...newFolder, name: event.target.value })} className={inputClass} placeholder="Klasör adı" />
              <select value={newFolder.scope_type} onChange={(event) => setNewFolder({ ...newFolder, scope_type: event.target.value, project_id: '' })} className={inputClass}>
                <option value="company">Şirket</option>
                <option value="project">Proje</option>
              </select>
              <select value={newFolder.project_id} onChange={(event) => setNewFolder({ ...newFolder, project_id: event.target.value })} disabled={newFolder.scope_type !== 'project'} className={`${inputClass} disabled:opacity-40`}>
                <option value="">Proje seçin</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title_tr || project.slug}</option>)}
              </select>
              <button onClick={createFolder} disabled={folderSaving} className="rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-gray-950 disabled:opacity-50">Ekle</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-800">
              {folders.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">Henüz klasör yok.</div>
              ) : folders.map((folder) => (
                <div key={folder.id} className="flex items-center gap-3 border-b border-gray-800 px-3 py-2.5 last:border-b-0">
                  <svg className="h-4 w-4 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-white">{folder.name}</div>
                    <div className="mt-0.5 text-[10px] text-gray-500">{folder.scope_type === 'project' ? folder.project_name : 'Şirket'} · {folder.document_count} belge</div>
                  </div>
                  <button onClick={() => deleteFolder(folder)} disabled={Number(folder.document_count) > 0} className="rounded-md border border-red-500/20 px-2 py-1 text-[10px] text-red-300 disabled:cursor-not-allowed disabled:opacity-25">Sil</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !shareWorking && setShareTarget(null)}>
          <div className="document-modal w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Belgeyi Link ile Paylaş</h2>
                <p className="mt-1 text-xs text-gray-500">{shareTarget.title}</p>
              </div>
              <button onClick={() => setShareTarget(null)} disabled={shareWorking} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>

            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-200/80">
              Bu bağlantıya sahip herkes giriş yapmadan belgeyi açabilir ve indirebilir. Bağlantıyı yalnızca güvendiğiniz kişilerle paylaşın.
            </div>

            {shareLoading ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
              </div>
            ) : (
              <>
                <div className={`mb-4 rounded-xl border px-3 py-3 ${
                  shareStatus?.active
                    ? 'border-green-500/20 bg-green-500/10'
                    : 'border-gray-800 bg-gray-950/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${shareStatus?.active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span className={`text-xs font-medium ${shareStatus?.active ? 'text-green-300' : 'text-gray-400'}`}>
                      {shareStatus?.active ? 'Herkese açık paylaşım aktif' : 'Aktif paylaşım bağlantısı yok'}
                    </span>
                  </div>
                  {shareStatus?.active && (
                    <div className="mt-2 text-[10px] leading-4 text-gray-500">
                      {shareStatus.share?.access_count || 0} kez açıldı
                      {shareStatus.share?.last_accessed_at && ` · Son erişim ${new Date(shareStatus.share.last_accessed_at).toLocaleString('tr-TR')}`}
                    </div>
                  )}
                </div>

                {shareLink ? (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Yeni Paylaşım Bağlantısı</label>
                    <div className="flex gap-2">
                      <input readOnly value={shareLink} className={`${inputClass} min-w-0 flex-1 font-mono text-xs`} />
                      <button onClick={copyShareLink} className="rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-gray-950 hover:bg-cyan-400">Kopyala</button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-500">Bu bağlantı güvenlik nedeniyle daha sonra tekrar gösterilemez. Şimdi kopyalayın.</p>
                  </div>
                ) : shareStatus?.active ? (
                  <p className="mb-4 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs leading-5 text-gray-500">
                    Mevcut bağlantı güvenlik nedeniyle tekrar görüntülenemez. Yeni bağlantı üretirseniz eski bağlantı otomatik olarak iptal edilir.
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {shareStatus?.active && (
                    <button onClick={revokeShareLink} disabled={shareWorking} className="rounded-lg border border-red-500/25 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                      Linki İptal Et
                    </button>
                  )}
                  <button onClick={createShareLink} disabled={shareWorking} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                    {shareWorking
                      ? 'İşleniyor...'
                      : shareStatus?.active
                        ? 'Yeni Link Üret'
                        : 'Paylaşım Linki Oluştur'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.action === 'permanent' ? 'Belgeyi kalıcı olarak sil' : 'Belgeyi çöp kutusuna taşı'}
        message={deleteTarget?.action === 'permanent'
          ? `${deleteTarget?.document.title} dosyası sunucu depolamasından kalıcı olarak silinecek. Bu işlem geri alınamaz.`
          : `${deleteTarget?.document.title} belgesi çöp kutusuna taşınacak ve daha sonra geri yüklenebilir.`}
        confirmText={deleteTarget?.action === 'permanent' ? 'Kalıcı Sil' : 'Çöpe Taşı'}
        variant={deleteTarget?.action === 'permanent' ? 'danger' : 'warning'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
