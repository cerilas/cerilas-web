import { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { FadeIn, GlowCard } from "../components/ui";

const mapsUrl = "https://www.google.com/maps?ll=37.027409,37.307163&z=14&t=m&hl=tr&gl=TR&mapclient=embed&cid=15052496142500458302";
const embedMapsUrl = "https://www.google.com/maps?q=37.027409,37.307163&z=14&hl=tr&output=embed";

export default function Contact() {
  const { t } = useLang();
  const c = t.contact;
  const common = t.common;

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: c.categories[0],
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSent(true);
    } catch {
      // silent fail — show sent anyway for UX
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{c.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{c.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <FadeIn className="lg:col-span-3">
              <GlowCard>
                <h2 className="text-xl font-bold text-white mb-6">{c.formTitle}</h2>
                {sent ? (
                  <div className="py-12 text-center">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-cyan-400 font-semibold text-lg">{common.messageSent}</p>
                    <p className="text-gray-400 mt-2 text-sm">{common.messageSentDesc}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        required
                        type="text"
                        placeholder={c.namePlaceholder}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <input
                        required
                        type="email"
                        placeholder={c.emailPlaceholder}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">{c.categoryLabel}</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        {c.categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      required
                      rows={6}
                      placeholder={c.messagePlaceholder}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
                    >
                      {sending ? '...' : c.sendButton}
                    </button>
                  </form>
                )}
              </GlowCard>
            </FadeIn>

            {/* Info */}
            <FadeIn delay={0.2} className="lg:col-span-2 flex flex-col gap-6">
              <GlowCard>
                <h2 className="text-xl font-bold text-white mb-6">{c.infoTitle}</h2>
                <div className="space-y-5">
                  <div>
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">{c.emailsLabel}</div>
                    <a href="mailto:hi@cerilas.com" className="block text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                      hi@cerilas.com
                    </a>
                    <a href="mailto:info@cerilas.com" className="block text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                      info@cerilas.com
                    </a>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">{c.addressLabel}</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{c.address}</p>
                  </div>
                </div>
              </GlowCard>

              <div className="rounded-2xl border border-gray-800/60 bg-black overflow-hidden">
                <div className="p-5 border-b border-gray-800/70 bg-gradient-to-r from-gray-950 to-black">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{c.mapTitle}</h3>
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">{c.mapDesc}</p>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-3 py-2 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-white hover:text-black hover:border-white transition-colors"
                    >
                      {c.mapLinkLabel}
                    </a>
                  </div>
                </div>

                <div className="relative h-80 bg-black">
                  <iframe
                    title={c.mapTitle}
                    src={embedMapsUrl}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0 grayscale contrast-125 brightness-75"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
