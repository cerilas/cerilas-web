import { useParams, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { FadeIn } from "../components/ui";

const slugMap = {
  terms: { titleKey: "termsTitle", contentKey: "termsContent" },
  privacy: { titleKey: "privacyTitle", contentKey: "privacyContent" },
  refund: { titleKey: "refundTitle", contentKey: "refundContent" },
  accessibility: { titleKey: "accessTitle", contentKey: "accessContent" },
};

export default function Legal() {
  const { slug } = useParams();
  const { t } = useLang();
  const l = t.legal;
  const common = t.common;
  const page = slugMap[slug];
  const sections = page ? l[page.contentKey] : [];

  return (
    <div className="pt-16 min-h-screen bg-gray-950">
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link to="/" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-8 inline-block">
              ← {common.home}
            </Link>
            <h1 className="text-4xl font-bold text-white mb-4">
              {page ? l[page.titleKey] : common.legal}
            </h1>
            <p className="text-sm text-gray-500 mb-10">{l.lastUpdated}</p>

            <div className="space-y-8">
              {sections.map((section, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-white mb-3">{section.heading}</h2>
                  {section.items ? (
                    <ul className="space-y-2">
                      {section.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed">
                          <span className="text-cyan-500 mt-1 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{section.body}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-600">{l.contactNote}</p>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
