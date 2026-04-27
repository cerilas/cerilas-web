import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ConfirmModal } from '../../components/ui';

const EMPTY_SENDER = {
  name: '',
  email: '',
  provider: 'smtp',
  host: '',
  port: 587,
  auth_user: '',
  auth_pass: '',
  secure: false,
};

export default function SendersAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_SENDER);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getSenders()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleEdit = (item) => {
    setEditing(item.id);
    setForm(item);
    setError('');
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(EMPTY_SENDER);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing && editing !== 'new') {
        await api.updateSender(editing, form);
      } else {
        await api.createSender(form);
      }
      handleCancel();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteSender(deleteTarget);
      setDeleteTarget(null);
      load();
    } catch (err) {
      alert(err.message);
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">E-posta Göndericileri</h1>
        <button
          onClick={() => { setEditing('new'); setForm(EMPTY_SENDER); }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Yeni Gönderici Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-400 italic">Henüz gönderici eklenmemiş.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase font-bold">
                        {item.host}:{item.port}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {item.is_active ? 'AKTİF' : 'PASİF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form */}
        {(editing) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">
              {editing === 'new' ? 'Yeni Gönderici' : 'Göndericiyi Düzenle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded text-xs">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Görünen Ad</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Cerilas Sistem"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Email Adresi</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="hi@cerilas.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">SMTP Host</label>
                  <input
                    type="text"
                    required
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Port</label>
                  <input
                    type="number"
                    required
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                  <input
                    type="text"
                    required
                    value={form.auth_user}
                    onChange={(e) => setForm({ ...form, auth_user: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Şifre / App Password</label>
                  <input
                    type="password"
                    required
                    value={form.auth_pass}
                    onChange={(e) => setForm({ ...form, auth_pass: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.secure}
                    onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-gray-300">SSL/TLS</span>
                </label>
                {editing !== 'new' && (
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-300">Aktif</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Kaydediliyor...' : editing === 'new' ? 'Göndericiyi Ekle' : 'Güncelle'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Göndericiyi Sil"
        message="Bu göndericiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
