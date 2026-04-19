import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const loadProjects = () => {
    setLoading(true);
    api.getAdminProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleDelete = (id, title) => setDeleteTarget({ id, title });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProject(deleteTarget.id);
      loadProjects();
    } catch (err) {
      console.error('Silme hatası:', err.message);
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Projeler</h1>
        <Link
          to="/admin/projects/new"
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Yeni Proje
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Henüz proje yok</p>
          <p className="text-sm">Yeni bir proje ekleyerek başlayın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium truncate">{p.title_tr}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'active'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {p.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  <span className="font-mono text-xs">{p.slug}</span>
                  <span className="mx-2">·</span>
                  <span>{p.date_tr}</span>
                </div>
                {p.tags_tr?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {p.tags_tr.map((tag, i) => (
                      <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => navigate(`/admin/projects/${p.id}`)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.title_tr)}
                  className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Projeyi Sil"
        message={`"${deleteTarget?.title || ''}" projesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
