import { useState } from 'react';
import { api } from '../../lib/api';
import logoDark from '../../assets/cerilas-logo-darkmode.png';
import logoLight from '../../assets/cerilas-logo-lightmode.png';
import { adminThemeOptions, useAdminTheme } from './adminTheme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, setTheme, resolvedTheme } = useAdminTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('admin_token', data.token);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        message === 'Invalid credentials' || message === 'Unauthorized'
          ? 'Geçersiz e-posta veya şifre'
          : 'API sunucusuna bağlanılamadı. Local backend çalışıyor mu kontrol edin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-theme-${resolvedTheme} min-h-screen bg-gray-950 flex items-center justify-center px-4`}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src={resolvedTheme === 'light' ? logoLight : logoDark}
            alt="Cerilas"
            className="h-12 w-auto mx-auto mb-4"
          />
          <p className="text-gray-400">Yönetim paneline giriş yapın</p>
        </div>
        <div className="mb-4 flex justify-center">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1">
            {adminThemeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  theme === option.value
                    ? 'bg-cyan-500 text-gray-950'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="admin@cerilas.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
