import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard, Badge } from "../components/ui";
import { useProjects } from "../hooks/useProjects";

export default function Projects() {
  const { t } = useLang();
  const p = t.projects;
  const projects = useProjects();

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
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{p.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{p.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* Project list */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj, i) => (
              <FadeIn key={proj.id} delay={i * 0.1}>
                <Link to={`/projects/${proj.id}`} className="block h-full">
                  <GlowCard className="h-full cursor-pointer flex flex-col">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {proj.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{proj.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{proj.shortDesc}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{proj.date}</span>
                      <span className="text-sm text-cyan-400 font-medium">{p.viewDetail} →</span>
                    </div>
                  </GlowCard>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
