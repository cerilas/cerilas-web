import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import CropModal from '../../components/ui/CropModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const FILE_TYPE_ICONS = {
  image: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  pdf: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H6.75A2.25 2.25 0 0 0 4.5 4.5v15A2.25 2.25 0 0 0 6.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25V14.25Z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H6.75A2.25 2.25 0 0 0 4.5 4.5v15A2.25 2.25 0 0 0 6.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25V14.25Z" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  ),
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const ITEMS_PER_PAGE = 30;

export default function MediaAdmin() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewFile, setViewFile] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Upload settings
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [format, setFormat] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Crop
  const [cropFile, setCropFile] = useState(null);
  const [cropQuality, setCropQuality] = useState(80);
  const [cropFormat, setCropFormat] = useState('');

  const fileRef = useRef(null);

  const load = (p = page, f = filter) => {
    api.getUploads(p, ITEMS_PER_PAGE, f === 'all' ? '' : f)
      .then((data) => {
        setFiles(data.files);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, filter); }, [filter]);

  const handleUpload = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of fileList) {
      try {
        const isImage = file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.type !== 'image/gif';
        await api.uploadImage(file, isImage ? {
          quality,
          maxWidth: maxWidth || undefined,
          maxHeight: maxHeight || undefined,
          format: format || undefined,
        } : {});
      } catch (err) {
        console.error('Upload error:', err.message);
      }
    }
    setUploading(false);
    load();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteUpload(deleteTarget);
    if (viewFile?.filename === deleteTarget) setViewFile(null);
    setDeleteTarget(null);
    load();
  };

  const copyUrl = (url) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCropConfirm = async (croppedArea) => {
    try {
      setUploading(true);
      await api.cropImage({
        filename: cropFile.filename,
        cropX: croppedArea.x,
        cropY: croppedArea.y,
        cropWidth: croppedArea.width,
        cropHeight: croppedArea.height,
        quality: cropQuality,
        format: cropFormat || undefined,
      });
      setCropFile(null);
      load();
    } catch (err) {
      console.error('Crop error:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const filters = [
    { key: 'all', label: 'Tümü' },
    { key: 'image', label: 'Görseller' },
    { key: 'video', label: 'Videolar' },
    { key: 'pdf', label: 'PDF' },
    { key: 'document', label: 'Dokümanlar' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Görsel Paylaşım</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            showSettings
              ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
              : 'border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          ⚙ Sıkıştırma Ayarları
        </button>
      </div>

      {/* Compression Settings */}
      {showSettings && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Yükleme Sıkıştırma Ayarları</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Kalite ({quality}%)</label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                <span>Küçük dosya</span>
                <span>Yüksek kalite</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Genişlik (px)</label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                placeholder="Sınırsız"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Yükseklik (px)</label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
                placeholder="Sınırsız"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Çıktı Formatı</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Orijinal</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="avif">AVIF</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver
            ? 'border-cyan-500 bg-cyan-500/5'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
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
              Dosyaları sürükleyin veya <span className="text-cyan-400">tıklayarak seçin</span>
            </p>
            <p className="text-xs text-gray-600">Görsel, Video, PDF, Doküman · Max 50MB</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        className="hidden"
        onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filter === f.key
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            {f.label}
            {filter === f.key ? ` (${total})` : ''}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {files.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Henüz dosya yüklenmedi.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.filename}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-700 transition-colors"
            >
              {/* Preview */}
              <div
                className="relative aspect-square bg-gray-950 flex items-center justify-center cursor-pointer"
                onClick={() => setViewFile(file)}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-600 flex flex-col items-center gap-2">
                    {FILE_TYPE_ICONS[file.type] || FILE_TYPE_ICONS.other}
                    <span className="text-xs uppercase font-medium">{file.ext}</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }}
                    className="text-xs text-white bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1.5 rounded-lg"
                  >
                    {copied === file.url ? '✓ Kopyalandı' : 'Link Kopyala'}
                  </button>
                  {file.type === 'image' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCropFile(file); }}
                      className="text-xs text-white bg-purple-600 hover:bg-purple-500 px-2.5 py-1.5 rounded-lg"
                    >
                      Kırp
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(file.filename); }}
                    className="text-xs text-white bg-red-600 hover:bg-red-500 px-2.5 py-1.5 rounded-lg"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs text-gray-300 truncate" title={file.filename}>{file.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">{formatBytes(file.size)}</span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(file.created).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p); }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`dot-${i}`} className="text-gray-600 text-xs px-1">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => { setPage(p); load(p); }}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                    p === page
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p); }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
          <span className="text-[10px] text-gray-600 ml-2">{total} dosya</span>
        </div>
      )}

      {/* View File Modal */}
      {viewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setViewFile(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview area */}
            {viewFile.type === 'image' ? (
              <div className="bg-gray-950 flex items-center justify-center max-h-[60vh] overflow-auto">
                <img src={viewFile.url} alt={viewFile.filename} className="max-w-full max-h-[60vh] object-contain" />
              </div>
            ) : viewFile.type === 'video' ? (
              <div className="bg-gray-950">
                <video src={viewFile.url} controls className="w-full max-h-[60vh]" />
              </div>
            ) : (
              <div className="bg-gray-950 py-16 flex flex-col items-center gap-3 text-gray-500">
                {FILE_TYPE_ICONS[viewFile.type] || FILE_TYPE_ICONS.other}
                <span className="text-sm">{viewFile.filename}</span>
              </div>
            )}

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm truncate flex-1 mr-4">{viewFile.filename}</h3>
                <button onClick={() => setViewFile(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{formatBytes(viewFile.size)}</span>
                <span>{viewFile.ext.toUpperCase()}</span>
                <span>{new Date(viewFile.created).toLocaleString('tr-TR')}</span>
              </div>

              {/* URL & copy */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${viewFile.url}`}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none"
                />
                <button
                  onClick={() => copyUrl(viewFile.url)}
                  className="px-3 py-2 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg shrink-0"
                >
                  {copied === viewFile.url ? '✓' : 'Kopyala'}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                {viewFile.type === 'image' && (
                  <button
                    onClick={() => { setViewFile(null); setCropFile(viewFile); }}
                    className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-lg px-4 py-2"
                  >
                    Kırp
                  </button>
                )}
                <a
                  href={viewFile.url}
                  download
                  className="text-xs text-gray-300 hover:text-white border border-gray-600 rounded-lg px-4 py-2"
                >
                  İndir
                </a>
                <button
                  onClick={() => { setViewFile(null); setDeleteTarget(viewFile.filename); }}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-4 py-2"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropFile && (
        <CropModal
          imageSrc={cropFile.url}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Dosyayı Sil"
        message="Bu dosyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
