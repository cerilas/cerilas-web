import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import Dropdown from '../../components/ui/Dropdown';

export default function MailSettings() {
  const [settings, setSettings] = useState({
    sender_id: '',
    newsletter_active: false,
    newsletter_recipients: '',
    contact_active: false,
    contact_recipients: '',
    job_active: false,
    job_recipients: ''
  });
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([api.getMailSettings(), api.getSenders()])
      .then(([settingsData, sendersData]) => {
        setSettings(settingsData);
        setSenders(sendersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateMailSettings(settings);
      setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-4">Platform Mail Ayarları</h1>
        <p className="text-gray-400">Sitede gerçekleşen olaylar için otomatik bildirim ayarlarını buradan yönetin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gönderici Seçimi */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Bildirim Göndericisi</h2>
          <div className="max-w-md">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Gönderici E-posta</label>
            <Dropdown
              value={settings.sender_id}
              onChange={(val) => setSettings({ ...settings, sender_id: val })}
              options={senders.map(s => ({ value: s.id, label: `${s.name} (${s.email})` }))}
              placeholder="Bir gönderici seçin..."
            />
            <p className="mt-2 text-xs text-gray-500 italic">* Bildirimlerin hangi mail üzerinden gönderileceğini seçin.</p>
          </div>
        </div>

        {/* Senaryolar */}
        <div className="grid grid-cols-1 gap-6">
          {/* Newsletter */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Newsletter Abone Bildirimi</h3>
                  <p className="text-xs text-gray-500">Yeni bir abone geldiğinde haber ver.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.newsletter_active}
                  onChange={(e) => setSettings({ ...settings, newsletter_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
            
            {settings.newsletter_active && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Bildirim Gidecek Adresler</label>
                <input
                  type="text"
                  placeholder="admin@cerilas.com, info@cerilas.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={settings.newsletter_recipients || ''}
                  onChange={(e) => setSettings({ ...settings, newsletter_recipients: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* İletişim Formu */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">İletişim Formu Bildirimi</h3>
                  <p className="text-xs text-gray-500">Yeni bir mesaj geldiğinde haber ver.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.contact_active}
                  onChange={(e) => setSettings({ ...settings, contact_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
            
            {settings.contact_active && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Bildirim Gidecek Adresler</label>
                <input
                  type="text"
                  placeholder="destek@cerilas.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={settings.contact_recipients || ''}
                  onChange={(e) => setSettings({ ...settings, contact_recipients: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* İş Başvurusu */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">İş Başvurusu Bildirimi</h3>
                  <p className="text-xs text-gray-500">Yeni bir başvuru yapıldığında haber ver.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.job_active}
                  onChange={(e) => setSettings({ ...settings, job_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
            
            {settings.job_active && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Bildirim Gidecek Adresler</label>
                <input
                  type="text"
                  placeholder="ik@cerilas.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={settings.job_recipients || ''}
                  onChange={(e) => setSettings({ ...settings, job_recipients: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div>
            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
