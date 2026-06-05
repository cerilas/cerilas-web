import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function SmsSettings() {
  const [settings, setSettings] = useState({
    netgsm_usercode: '',
    netgsm_password: '',
    netgsm_header: '',
    is_active: true
  });
  const [availableHeaders, setAvailableHeaders] = useState([]);
  const [fetchingHeaders, setFetchingHeaders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.getSmsSettings().then(data => {
      if (data && Object.keys(data).length > 0) {
        setSettings(data);
      }
    }).catch(err => console.error('Error fetching sms settings:', err));
  }, []);

  const handleFetchHeaders = async () => {
    if (!settings.netgsm_usercode || !settings.netgsm_password) {
      setStatus({ success: false, message: 'Önce Netgsm kullanıcı adı ve şifrenizi girmelisiniz.' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    setFetchingHeaders(true);
    setStatus(null);
    try {
      const res = await api.getSmsHeaders({ 
        netgsm_usercode: settings.netgsm_usercode, 
        netgsm_password: settings.netgsm_password 
      });
      if (res.headers && res.headers.length > 0) {
        setAvailableHeaders(res.headers);
        if (!res.headers.includes(settings.netgsm_header)) {
          setSettings({ ...settings, netgsm_header: res.headers[0] });
        }
        setStatus({ success: true, message: 'Başlıklar başarıyla çekildi!' });
      } else {
        setStatus({ success: false, message: 'Hesabınıza tanımlı bir başlık bulunamadı.' });
      }
    } catch (err) {
      setStatus({ success: false, message: err.message || 'Başlıklar çekilirken hata oluştu.' });
    } finally {
      setFetchingHeaders(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.updateSmsSettings(settings);
      setStatus({ success: true, message: 'Ayarlar başarıyla kaydedildi!' });
    } catch (err) {
      setStatus({ success: false, message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl pb-20">
      <h1 className="text-3xl font-bold text-white mb-4">SMS Ayarları</h1>
      <p className="text-gray-400 leading-relaxed mb-10">
        Netgsm API entegrasyonu için gerekli kullanıcı adı, şifre ve başlık bilgilerinizi buradan yapılandırın.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Netgsm Konfigürasyonu</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Netgsm Kullanıcı Adı (Usercode)</label>
              <input
                type="text"
                required
                value={settings.netgsm_usercode || ''}
                onChange={(e) => setSettings({ ...settings, netgsm_usercode: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Örn: 850xxxxxxx veya deniz@cerilas.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Netgsm Şifre</label>
              <input
                type="password"
                required
                value={settings.netgsm_password || ''}
                onChange={(e) => setSettings({ ...settings, netgsm_password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Şifreniz"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-400">Gönderici Başlığı (Mesaj Başlığı)</label>
              <button
                type="button"
                onClick={handleFetchHeaders}
                disabled={fetchingHeaders || !settings.netgsm_usercode || !settings.netgsm_password}
                className="text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded transition-all disabled:opacity-50"
              >
                {fetchingHeaders ? 'Sorgulanıyor...' : 'Başlıkları Netgsm\'den Getir'}
              </button>
            </div>
            
            {availableHeaders.length > 0 ? (
              <select
                required
                value={settings.netgsm_header || ''}
                onChange={(e) => setSettings({ ...settings, netgsm_header: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {availableHeaders.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={settings.netgsm_header || ''}
                onChange={(e) => setSettings({ ...settings, netgsm_header: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Örn: CERILAS AS (Veya yukarıdaki butonla otomatik getirin)"
                maxLength={11}
              />
            )}
            <p className="text-xs text-gray-500 mt-2">Netgsm panelinde tanımlı ve onaylı bir mesaj başlığı olmalıdır (Maksimum 11 karakter).</p>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-800 pt-6">
            <input
              type="checkbox"
              id="is_active"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-white">
              SMS Gönderimi Aktif
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-8">Pasif yapıldığında API üzerinden SMS gönderilemez.</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            {status && (
              <p className={`text-sm font-medium ${status.success ? 'text-green-400' : 'text-red-400'}`}>
                {status.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold rounded-lg transition-all"
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
