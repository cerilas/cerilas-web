import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/admin/projects', label: 'Projeler', icon: '◈' },
  { path: '/admin/media', label: 'Görsel Paylaşım', icon: '⬡' },
  { path: '/admin/contacts', label: 'İletişim Formları', icon: '✉' },
  { path: '/admin/newsletter', label: 'Newsletter', icon: '◎' },
];

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('admin_token');
        navigate('/admin');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && <span className="text-lg font-bold text-white">Cerilas</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1"
          >
            {sidebarOpen ? '◁' : '▷'}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 mb-2 truncate">{user?.email}</div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            {sidebarOpen ? 'Çıkış Yap' : '⏻'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
