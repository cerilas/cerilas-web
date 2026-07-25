import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import logoDarkMode from '../../assets/cerilas-logo-darkmode.png';
import logoLightMode from '../../assets/cerilas-logo-lightmode.png';
import logoCollapsed from '../../assets/Cerilas Logo-COLLAPSED2.png';
import { adminThemeOptions, useAdminTheme } from './adminTheme';

const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Projects: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  UseCases: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Media: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Contacts: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  JobListings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Applications: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Newsletter: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11l-2 2 2 2 4-4" />
    </svg>
  ),
  Docs: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Opportunities: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Pomodoro: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19V5m0 14h16M8 16V9m4 7V7m4 9v-4" />
    </svg>
  ),
  Expenses: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6" />
    </svg>
  ),
  Accounts: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a4 4 0 11-7.75 1.38L3 12.63V16h3v3h3v2h4l2.62-2.62A4 4 0 0015 7z" />
    </svg>
  ),
  Documents: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  Theme: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364-1.061 1.061M6.697 17.303l-1.061 1.061m12.728 0-1.061-1.061M6.697 6.697 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
};

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
  { path: '/admin/analytics', label: 'Site İstatistikleri', icon: <Icons.Analytics /> },
  { path: '/admin/pomodoro', label: 'Pomodoro', icon: <Icons.Pomodoro /> },
  { path: '/admin/opportunities', label: 'İhtimal Listesi', icon: <Icons.Opportunities /> },
  { path: '/admin/opportunity-tracking', label: 'Fırsat Takibi', icon: <Icons.Opportunities /> },
  { path: '/admin/expenses', label: 'Gider Takibi', icon: <Icons.Expenses /> },
  { path: '/admin/accounts', label: 'Şifre ve Hesaplar', icon: <Icons.Accounts /> },
  { path: '/admin/documents', label: 'Belge Yönetimi', icon: <Icons.Documents /> },
  { path: '/admin/projects', label: 'Projeler', icon: <Icons.Projects /> },
  { path: '/admin/use-cases', label: 'Use Case\'ler', icon: <Icons.UseCases /> },
  { path: '/admin/media', label: 'Görsel Paylaşım', icon: <Icons.Media /> },
  { path: '/admin/contacts', label: 'İletişim Formları', icon: <Icons.Contacts /> },
  { path: '/admin/job-listings', label: 'İş İlanları', icon: <Icons.JobListings /> },
  { path: '/admin/applications', label: 'İş Başvuruları', icon: <Icons.Applications /> },
  { path: '/admin/newsletter', label: 'Newsletter', icon: <Icons.Newsletter /> },
  { path: '/admin/users', label: 'Kullanıcılar', icon: <Icons.Users /> },
  { type: 'divider', label: 'EMAIL API PLATFORM' },
  { path: '/admin/mail-senders', label: 'Gönderici Ayarları', icon: <Icons.Mail /> },
  { path: '/admin/mail-settings', label: 'Platform Bildirimleri', icon: <Icons.Settings /> },
  { path: '/admin/mail-docs', label: 'Mail API Dokümanı', icon: <Icons.Docs /> },
  { type: 'divider', label: 'SMS API PLATFORM' },
  { path: '/admin/sms-settings', label: 'SMS Ayarları', icon: <Icons.Settings /> },
  { path: '/admin/sms-docs', label: 'SMS API Dokümanı', icon: <Icons.Docs /> },
];

function ThemeSwitcher({ theme, setTheme, compact = false }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          const currentIndex = adminThemeOptions.findIndex((option) => option.value === theme);
          const nextOption = adminThemeOptions[(currentIndex + 1) % adminThemeOptions.length];
          setTheme(nextOption.value);
        }}
        className="theme-switcher theme-switcher-compact flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 bg-gray-950/80 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        title={`Tema: ${adminThemeOptions.find((option) => option.value === theme)?.label}`}
      >
        <Icons.Theme />
      </button>
    );
  }

  return (
    <div className="theme-switcher mt-3 grid grid-cols-3 gap-0.5 rounded-lg bg-gray-950/70 p-0.5">
      {adminThemeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={`theme-option rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
            theme === option.value
              ? 'theme-option-active bg-cyan-500 text-white'
              : 'text-gray-500 hover:bg-white/5 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AdminLogo({ resolvedTheme, collapsed = false }) {
  const logoSrc = collapsed ? logoCollapsed : resolvedTheme === 'light' ? logoLightMode : logoDarkMode;
  return (
    <img
      src={logoSrc}
      alt="Cerilas"
      className={`admin-logo object-contain transition-all duration-200 ${collapsed ? 'h-[38px] w-[38px]' : 'h-10 w-auto max-w-[170px]'}`}
    />
  );
}

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useAdminTheme();
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
      <div className={`admin-theme-${resolvedTheme} min-h-screen bg-gray-950 flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`admin-theme-${resolvedTheme} min-h-screen bg-gray-950 flex flex-col md:flex-row overflow-hidden`}>
      {/* Mobile Top Header */}
      <div className="admin-brand-panel md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <AdminLogo resolvedTheme={resolvedTheme} />
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 transition-all duration-200
        ${sidebarOpen ? 'md:w-64' : 'md:w-20'} bg-gray-900 border-r border-gray-800 flex flex-col w-64 md:flex
      `}>
        <div className={`admin-brand-panel hidden md:flex border-b border-gray-800 bg-gray-900 ${
          sidebarOpen ? 'p-4 flex-col items-stretch' : 'px-3 py-4 flex-col items-center gap-3'
        }`}>
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <AdminLogo resolvedTheme={resolvedTheme} />
            ) : (
              <div className="h-[38px] w-[38px] flex items-center justify-center shrink-0 overflow-visible">
                <AdminLogo resolvedTheme={resolvedTheme} collapsed />
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white p-1 ml-2 transition-transform duration-200"
              >
                <svg className={`w-5 h-5 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          {sidebarOpen ? (
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ThemeSwitcher theme={theme} setTheme={setTheme} compact />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Menüyü genişlet"
              >
                <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Sidebar Brand */}
        <div className="admin-brand-panel md:hidden p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between">
            <AdminLogo resolvedTheme={resolvedTheme} />
            <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={`divider-${idx}`} className={`mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 ${sidebarOpen ? '' : 'justify-center'}`}>
                  {sidebarOpen ? item.label : <div className="h-px bg-gray-800 w-full" />}
                </div>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`shrink-0 transition-transform ${sidebarOpen ? '' : 'mx-auto'}`}>
                  {item.icon}
                </div>
                {(sidebarOpen || mobileSidebarOpen) && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
                {!sidebarOpen && !mobileSidebarOpen && (
                   <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                      {item.label}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {(sidebarOpen || mobileSidebarOpen) && (
            <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-2 truncate px-2 font-bold">{user?.email}</div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all mb-4`}
          >
            <div className="shrink-0"><Icons.Logout /></div>
            {(sidebarOpen || mobileSidebarOpen) && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
