import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { exportToExcel } from '../../lib/exportExcel';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PREVIEW_LIMIT = 100;

export default function ContactAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    api.getContacts()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    await api.markContactRead(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
  };

  const handleDelete = (id) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteContact(deleteTarget);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    if (selected?.id === deleteTarget) setSelected(null);
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToExcel(items, [
      { label: 'Ad', key: 'name' },
      { label: 'E-posta', key: 'email' },
      { label: 'Kategori', key: 'category' },
      { label: 'Mesaj', key: 'message' },
      { label: 'Okundu', render: (r) => (r.is_read ? 'Evet' : 'Hayır') },
      { label: 'Tarih', render: (r) => new Date(r.created_at).toLocaleString('tr-TR') },
    ], 'iletisim-formlari');
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">İletişim Formları</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Excel'e Aktar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400">Henüz mesaj yok.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelected(item);
                if (!item.is_read) markRead(item.id);
              }}
              className={`bg-gray-900 border rounded-xl p-5 cursor-pointer hover:border-cyan-500/60 transition-colors ${
                item.is_read ? 'border-gray-800' : 'border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4 overflow-hidden">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-gray-500 text-sm break-all">{item.email}</span>
                    {item.category && (
                      <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                    {!item.is_read && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded">
                        Yeni
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm break-words" style={{ overflowWrap: 'anywhere' }}>
                    {item.message.length > PREVIEW_LIMIT
                      ? item.message.slice(0, PREVIEW_LIMIT) + '...'
                      : item.message}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    {new Date(item.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!item.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(item.id); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg px-3 py-1.5"
                    >
                      Okundu
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="text-sm text-cyan-400 hover:underline">
                    {selected.email}
                  </a>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-white text-xl leading-none p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selected.category && (
                    <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded">
                      {selected.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(selected.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="bg-gray-950 rounded-xl p-4 overflow-hidden">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                     style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {selected.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-4 py-2"
                >
                  Sil
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-gray-300 hover:text-white border border-gray-600 rounded-lg px-4 py-2"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Mesajı Sil"
        message="Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
