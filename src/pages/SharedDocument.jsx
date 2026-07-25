import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import logo from '../assets/cerilas-logo-darkmode.png';

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function SharedDocument() {
  const { token } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    let current = true;
    api.getPublicDocument(token)
      .then((data) => {
        if (current) setDocument(data);
      })
      .catch((requestError) => {
        if (current) {
          setError(
            requestError.code === 'SHARE_LINK_INVALID'
              ? 'Bu paylaşım bağlantısı artık geçerli değil. Belgeyi paylaşan Cerilas yetkilisinden yeni bir bağlantı göndermesini isteyin.'
              : requestError.message || 'Paylaşılan belge açılamadı.'
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [token]);

  const openFile = async (download) => {
    setFileLoading(true);
    try {
      const file = await api.fetchPublicDocumentFile(token, download);
      const url = URL.createObjectURL(file.blob);
      if (download) {
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = file.filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (requestError) {
      setError(requestError.message || 'Belge artık açılamıyor.');
      setDocument(null);
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071019] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Cerilas" className="h-11 w-auto object-contain" />
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          </div>
        ) : error ? (
          <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-7 text-center shadow-2xl shadow-black/20">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 9v4m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold">Bağlantı kullanılamıyor</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{error}</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 bg-gradient-to-br from-cyan-400/[0.08] to-blue-500/[0.03] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8m-6-6 6 6m-6-6v6h6" />
                </svg>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300/70">Cerilas Belge Paylaşımı</p>
              <h1 className="mt-2 break-words text-xl font-semibold">{document.title}</h1>
              <p className="mt-1 break-all text-xs text-slate-500">{document.original_name}</p>
            </div>

            <div className="p-6">
              <dl className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2.5">
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Kategori</dt>
                  <dd className="mt-1 text-xs text-slate-200">{document.category || 'Diğer'}</dd>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2.5">
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Dosya Boyutu</dt>
                  <dd className="mt-1 text-xs text-slate-200">{formatBytes(document.file_size)}</dd>
                </div>
              </dl>

              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={() => openFile(false)} disabled={fileLoading} className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-50">
                  {fileLoading ? 'Hazırlanıyor...' : 'Belgeyi Aç'}
                </button>
                <button onClick={() => openFile(true)} disabled={fileLoading} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06] disabled:opacity-50">
                  İndir
                </button>
              </div>

              <p className="mt-5 text-center text-[10px] leading-4 text-slate-600">
                Bu belge size Cerilas yetkilisi tarafından özel bir bağlantıyla paylaşılmıştır.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
