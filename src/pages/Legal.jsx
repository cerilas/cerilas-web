import { useParams, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { FadeIn } from "../components/ui";

const slugMap = {
  terms: { titleKey: "termsTitle" },
  privacy: { titleKey: "privacyTitle" },
  refund: { titleKey: "refundTitle" },
  accessibility: { titleKey: "accessTitle" },
};

export default function Legal() {
  const { slug } = useParams();
  const { t } = useLang();
  const l = t.legal;
  const common = t.common;
  const page = slugMap[slug];

  return (
    <div className="pt-16 min-h-screen bg-gray-950">
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link to="/" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-8 inline-block">
              ← {common.home}
            </Link>
            <h1 className="text-4xl font-bold text-white mb-8">
              {page ? l[page.titleKey] : common.legal}
            </h1>
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-8">
              <p className="text-gray-400 leading-relaxed">{l.placeholder}</p>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
