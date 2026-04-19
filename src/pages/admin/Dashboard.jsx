import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, contacts: 0, unread: 0, subscribers: 0 });

  useEffect(() => {
    Promise.all([
      api.getAdminProjects(),
      api.getContacts(),
      api.getSubscribers(),
    ]).then(([projects, contacts, subscribers]) => {
      setStats({
        projects: projects.length,
        contacts: contacts.length,
        unread: contacts.filter((c) => !c.is_read).length,
        subscribers: subscribers.length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Projeler" value={stats.projects} color="cyan" />
        <StatCard title="İletişim Mesajları" value={stats.contacts} color="blue" />
        <StatCard title="Okunmamış" value={stats.unread} color="green" />
        <StatCard title="Newsletter Aboneleri" value={stats.subscribers} color="cyan" />
      </div>
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction href="/admin/projects" title="Projeleri Yönet" desc="Proje ekle, düzenle veya sil" />
          <QuickAction href="/admin/contacts" title="İletişim Formları" desc="Gelen mesajları görüntüle" />
          <QuickAction href="/admin/newsletter" title="Newsletter" desc="Aboneleri görüntüle ve export et" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = {
    cyan: 'border-cyan-500/30 text-cyan-400',
    blue: 'border-blue-500/30 text-blue-400',
    green: 'border-green-500/30 text-green-400',
  };
  return (
    <div className={`bg-gray-900 border ${colors[color]} rounded-xl p-6`}>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className={`text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value}</div>
    </div>
  );
}

function QuickAction({ href, title, desc }) {
  return (
    <a
      href={href}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
    >
      <div className="text-white font-medium">{title}</div>
      <div className="text-sm text-gray-400 mt-1">{desc}</div>
    </a>
  );
}
