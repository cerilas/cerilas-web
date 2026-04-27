import { motion } from 'framer-motion';

export default function MailApiDocs() {
  const baseUrl = window.location.origin;

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
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">POST</span>
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
          <h2 className="text-xl font-semibold text-white mb-4">Kimlik Doğrulama</h2>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            API istekleri, Admin paneline giriş yaptığınızda kullanılan JWT token ile yetkilendirilmelidir. 
            İstek başlığına (header) aşağıdaki parametreyi ekleyin:
          </p>
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <code className="text-xs text-yellow-400">Authorization: Bearer YOUR_ADMIN_TOKEN</code>
          </div>
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
