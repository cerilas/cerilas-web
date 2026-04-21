import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { api } from '../../lib/api';

const PAGE_SIZE = 15;

export default function UseCasesAdmin() {
  const [filters, setFilters] = useState({ q: '', status: 'all', page: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState({ loadedKey: '', items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const { items, pagination } = state;

  const queryKey = JSON.stringify({ ...filters, limit: PAGE_SIZE, refreshKey });
  const loading = state.loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;

    api.getAdminUseCases({ ...filters, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setState({
          loadedKey: queryKey,
          items: data.items || [],
          pagination: { page: data.page || 1, totalPages: data.totalPages || 1, total: data.total || 0 },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loadedKey: queryKey, items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
      });

    return () => {
      cancelled = true;
    };
  }, [filters, queryKey]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteUseCase(deleteTarget.id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Use case silme hatası:', err.message);
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Use Case'ler</h1>
          <p className="text-sm text-gray-400 mt-1">SEO odaklı içerik setlerini yönetin.</p>
        </div>
        <Link
          to="/admin/use-cases/new"
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Yeni Use Case
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
        <input
          type="search"
          value={filters.q}
          onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
          placeholder="Başlık, slug veya problem metninde ara"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">Tüm durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Henüz use case yok</p>
          <p className="text-sm">Yeni bir SEO use-case kaydı oluşturarak başlayın.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-4">Toplam {pagination.total} kayıt</div>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-medium truncate">{item.title_tr}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'published'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {item.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 break-all">
                    <span className="font-mono text-xs">{item.slug}</span>
                    <span className="mx-2">·</span>
                    <span>{item.seo_title_tr || 'SEO başlığı yok'}</span>
                  </div>
                  {!!item.tags_tr?.length && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {item.tags_tr.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => window.open(`/use-cases/${item.slug}`, '_blank', 'noopener,noreferrer')}
                    className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Gör
                  </button>
                  <button
                    onClick={() => navigate(`/admin/use-cases/${item.id}`)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: item.id, title: item.title_tr })}
                    className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500"
              >
                Önceki
              </button>
              <span className="text-sm text-gray-500">Sayfa {pagination.page} / {pagination.totalPages}</span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500"
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Use Case Sil"
        message={`"${deleteTarget?.title || ''}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}