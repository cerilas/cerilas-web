import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ email: '', password: '' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, password: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ email: '', password: '' });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg transition-colors text-sm"
        >
          Yeni Kullanıcı Ekle
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800/50 text-gray-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">E-posta</th>
              <th className="px-6 py-4">Oluşturulma Tarihi</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-white font-medium">{user.email}</td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(user.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">E-posta</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  {editingUser ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors"
                >
                  {editingUser ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
