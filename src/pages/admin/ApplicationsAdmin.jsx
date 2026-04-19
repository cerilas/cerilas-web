import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { exportToExcel } from '../../lib/exportExcel';
import ConfirmModal from '../../components/ui/ConfirmModal';

const STATUS_LABELS = {
  new: { label: 'Yeni', cls: 'bg-yellow-500/10 text-yellow-400' },
  reviewed: { label: 'İncelendi', cls: 'bg-blue-500/10 text-blue-400' },
  shortlisted: { label: 'Ön Eleme', cls: 'bg-green-500/10 text-green-400' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-500/10 text-red-400' },
};

export default function ApplicationsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = () => {
    api.getApplications()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id, status) => {
    await api.updateApplicationStatus(id, status);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, status }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteApplication(deleteTarget);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    if (selected?.id === deleteTarget) setSelected(null);
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToExcel(items, [
      { label: 'Ad', key: 'first_name' },
      { label: 'Soyad', key: 'last_name' },
      { label: 'E-posta', key: 'email' },
      { label: 'Telefon', key: 'phone' },
      { label: 'Pozisyon', key: 'position' },
      { label: 'Ön Yazı', key: 'cover_letter' },
      { label: 'CV', key: 'cv_original_name' },
      { label: 'Durum', render: (r) => STATUS_LABELS[r.status]?.label || r.status },
      { label: 'Tarih', render: (r) => new Date(r.created_at).toLocaleString('tr-TR') },
    ], 'is-basvurulari');
  };

  const filtered = filterStatus === 'all' ? items : items.filter((i) => i.status === filterStatus);

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
        <h1 className="text-2xl font-bold text-white">İş Başvuruları</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Excel'e Aktar
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: `Tümü (${items.length})` },
          ...Object.entries(STATUS_LABELS).map(([value, { label }]) => ({
            value,
            label: `${label} (${items.filter((i) => i.status === value).length})`,
          })),
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filterStatus === f.value
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400">Başvuru bulunamadı.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const st = STATUS_LABELS[item.status] || STATUS_LABELS.new;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className={`bg-gray-900 border rounded-xl p-5 cursor-pointer hover:border-cyan-500/60 transition-colors ${
                  item.status === 'new' ? 'border-cyan-500/40' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-white font-medium">
                        {item.first_name} {item.last_name}
                      </span>
                      <span className="text-gray-500 text-sm break-all">{item.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-cyan-400/80">{item.position}</p>
                    {item.cover_letter && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.cover_letter}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>{new Date(item.created_at).toLocaleString('tr-TR')}</span>
                      {item.cv_original_name && (
                        <span className="text-gray-500">📎 {item.cv_original_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {item.cv_filename && (
                      <button
                        onClick={(e) => { e.stopPropagation(); api.downloadCV(item.id); }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg px-3 py-1.5"
                      >
                        CV İndir
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id); }}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.first_name} {selected.last_name}</h2>
                <p className="text-sm text-gray-400 mt-1">{selected.position}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">E-posta</span>
                  <p className="text-white mt-0.5">{selected.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefon</span>
                  <p className="text-white mt-0.5">{selected.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">CV</span>
                  <p className="text-white mt-0.5">
                    {selected.cv_filename ? (
                      <button
                        onClick={() => api.downloadCV(selected.id)}
                        className="text-cyan-400 hover:underline"
                      >
                        📎 {selected.cv_original_name}
                      </button>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Tarih</span>
                  <p className="text-white mt-0.5">{new Date(selected.created_at).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {selected.cover_letter && (
                <div>
                  <span className="text-gray-500 text-sm">Ön Yazı</span>
                  <p className="text-gray-300 text-sm mt-1 leading-relaxed whitespace-pre-wrap">{selected.cover_letter}</p>
                </div>
              )}

              {/* Status change */}
              <div>
                <span className="text-gray-500 text-sm block mb-2">Durum Değiştir</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_LABELS).map(([value, { label, cls }]) => (
                    <button
                      key={value}
                      onClick={() => updateStatus(selected.id, value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selected.status === value
                          ? `${cls} border-current`
                          : 'border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Başvuruyu Sil"
        message="Bu başvuruyu ve CV dosyasını silmek istediğinize emin misiniz?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
