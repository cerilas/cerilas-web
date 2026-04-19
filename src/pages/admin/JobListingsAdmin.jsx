import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import ConfirmModal from '../../components/ui/ConfirmModal';

const EMPTY = { title: '', type: 'Tam zamanlı', location: '', description: '', is_active: true };

const TYPE_OPTIONS = ['Tam zamanlı', 'Yarı zamanlı', 'Tam / Yarı zamanlı', 'Staj', 'Sözleşmeli'];

export default function JobListingsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null = closed, object = form
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getAdminJobListings()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => setEditing({ ...EMPTY });
  const openEdit = (item) => setEditing({ ...item });
  const closeForm = () => setEditing(null);

  const handleSave = async () => {
    if (!editing.title.trim() || !editing.type.trim() || !editing.location.trim()) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await api.updateJobListing(editing.id, editing);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await api.createJobListing(editing);
        setItems((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await api.toggleJobListing(id);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteJobListing(deleteTarget);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    setDeleteTarget(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">İş İlanları</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-semibold rounded-lg transition-colors"
        >
          + Yeni İlan
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-400">Toplam:</span>{' '}
          <span className="text-white font-medium">{items.length}</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-400">Aktif:</span>{' '}
          <span className="text-green-400 font-medium">{items.filter((i) => i.is_active).length}</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-400">Pasif:</span>{' '}
          <span className="text-gray-500 font-medium">{items.filter((i) => !i.is_active).length}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Henüz ilan eklenmemiş.</p>
          <button
            onClick={openNew}
            className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors"
          >
            İlk İlanı Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
                item.is_active ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.is_active
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-700/50 text-gray-500'
                    }`}>
                      {item.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    <span>{item.type}</span>
                    <span className="text-gray-600">·</span>
                    <span>{item.location}</span>
                  </div>
                  {item.description && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-2">
                    {new Date(item.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
                      item.is_active
                        ? 'text-yellow-400 hover:text-yellow-300 border-yellow-500/30'
                        : 'text-green-400 hover:text-green-300 border-green-500/30'
                    }`}
                  >
                    {item.is_active ? 'Pasife Al' : 'Aktif Et'}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg px-3 py-1.5"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item.id)}
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

      {/* Create / Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeForm}>
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-6">
              {editing.id ? 'İlanı Düzenle' : 'Yeni İlan'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Pozisyon Adı *</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="ör: AI / ML Engineer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Çalışma Tipi *</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/60"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Lokasyon *</label>
                  <input
                    type="text"
                    value={editing.location}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    placeholder="ör: Gaziantep / Remote"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Açıklama (opsiyonel)</label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  placeholder="İlan hakkında kısa açıklama..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/30"
                />
                <span className="text-sm text-gray-300">Aktif (sitede görünsün)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.title.trim() || !editing.type.trim() || !editing.location.trim()}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="İlanı Sil"
        message="Bu ilanı silmek istediğinize emin misiniz? Mevcut başvurular etkilenmez."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
