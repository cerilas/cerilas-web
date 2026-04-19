import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { exportToExcel } from '../../lib/exportExcel';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function NewsletterAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.getSubscribers()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteSubscriber(deleteTarget);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToExcel(items, [
      { label: 'E-posta', key: 'email' },
      { label: 'Abone Tarihi', render: (r) => new Date(r.created_at).toLocaleString('tr-TR') },
    ], 'newsletter-aboneleri');
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
        <h1 className="text-2xl font-bold text-white">Newsletter Aboneleri</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Excel'e Aktar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400">Henüz abone yok.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">#</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">E-posta</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Tarih</th>
                <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-800/50 last:border-0">
                  <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm text-white">{item.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {new Date(item.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Aboneyi Sil"
        message="Bu aboneyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
