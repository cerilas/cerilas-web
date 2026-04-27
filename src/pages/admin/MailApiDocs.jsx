import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export default function MailApiDocs() {
  const baseUrl = window.location.origin;
  const [senders, setSenders] = useState([]);
  const [testForm, setTestForm] = useState({ senderId: '', to: '', subject: 'Test Email', html: '<p>Bu bir test e-postasıdır.</p>' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.getSenders().then(setSenders).catch(() => {});
  }, []);

  const handleTestSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      await api.sendMail(testForm);
      setStatus({ success: true, message: 'Test e-postası başarıyla gönderildi!' });
    } catch (err) {
      setStatus({ success: false, message: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-4">Mail API Dokümantasyonu</h1>
        <p className="text-gray-400 leading-relaxed">
          Cerilas Mail API, sisteminizdeki tanımlı göndericiler üzerinden programatik olarak e-posta göndermenizi sağlar. 
          API, HTML içerik, ek dosyalar (attachments), CC ve BCC gibi gelişmiş özellikleri destekler.
        </p>
      </div>

      <div className="space-y-12">
        {/* Endpoint */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold">01</span>
            <code>/api/mail/send</code>
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            E-posta gönderimi yapmak için bu uç noktayı kullanın.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Request Body (JSON)</span>
            </div>
            <pre className="p-4 text-xs text-cyan-300 overflow-x-auto leading-relaxed">
{`{
  "senderId": 1,           // Sistemdeki göndericinin ID'si
  "to": "alici@mail.com",   // String veya Array ["a@m.com", "b@m.com"]
  "subject": "API Test",
  "html": "<h1>Merhaba</h1>", // HTML içeriği (opsiyonel)
  "text": "Merhaba...",      // Düz metin içeriği (opsiyonel)
  "cc": ["cc@mail.com"],    // Opsiyonel
  "bcc": ["bcc@mail.com"],  // Opsiyonel
  "attachments": [          // Opsiyonel
    {
      "filename": "belge.pdf",
      "content": "base64_string_here...",
      "encoding": "base64"
    }
  ]
}`}
            </pre>
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
             <span className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm font-bold">02</span>
             Kimlik Doğrulama
          </h2>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            API istekleri, Admin paneline giriş yaptığınızda kullanılan JWT token ile yetkilendirilmelidir. 
            İstek başlığına (header) aşağıdaki parametreyi ekleyin:
          </p>
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <code className="text-xs text-yellow-400">Authorization: Bearer YOUR_ADMIN_TOKEN</code>
          </div>
        </section>

        {/* Test API Section */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">03</span>
            API'yi Test Et
          </h2>
          
          <form onSubmit={handleTestSend} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Gönderici Seçin</label>
                <select
                  required
                  value={testForm.senderId}
                  onChange={(e) => setTestForm({ ...testForm, senderId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                >
                  <option value="">Gönderici Seçin...</option>
                  {senders.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Alıcı Email</label>
                <input
                  type="email"
                  required
                  value={testForm.to}
                  onChange={(e) => setTestForm({ ...testForm, to: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="alici@example.com"
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={sending || !testForm.senderId}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gönderiliyor...
                  </>
                ) : 'Test Maili Gönder'}
              </button>
              
              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 p-4 rounded-xl text-xs font-medium ${status.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                  >
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </section>

        {/* Example usage */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Örnek Kullanım (JavaScript)</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <pre className="p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed">
{`fetch('${baseUrl}/api/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    senderId: 1,
    to: 'deniz@example.com',
    subject: 'Proje Güncellemesi',
    html: '<p>Projeniz başarıyla güncellendi.</p>'
  })
})
.then(res => res.json())
.then(data => console.log(data));`}
            </pre>
          </div>
        </section>

        {/* Notes */}
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-cyan-400 font-semibold mb-2">Önemli Notlar</h3>
          <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
            <li>Gmail kullanıyorsanız "Uygulama Şifresi" (App Password) oluşturmanız önerilir.</li>
            <li>Attachments boyut sınırı sunucu konfigürasyonuna bağlıdır (Varsayılan: 10MB).</li>
            <li>Toplu gönderimlerde (bulk mail) göndericinin günlük limitlerini aşmamaya dikkat edin.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
