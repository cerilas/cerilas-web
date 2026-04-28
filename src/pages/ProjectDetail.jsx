import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { FadeIn, GlowCard, Badge } from "../components/ui";
import { useProject } from "../hooks/useProjects";
import imgProject from "../assets/images/nicolas-thomas-CBydtQDjaJc-unsplash.jpg";

export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const p = t.projects;
  const common = t.common;
  const { loading, project } = useProject(id);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{common.projectNotFound}</h1>
          <Link to="/projects" className="mt-4 text-cyan-400 hover:text-cyan-300">
            {p.backToProjects}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-gray-950">
      {/* Header */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link to="/projects" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-8 inline-block">
              {p.backToProjects}
            </Link>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">{project.title}</h1>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed">{project.shortDesc}</p>
            <div className="mt-4 text-sm text-gray-500">{p.timeline}: {project.date}</div>
          </FadeIn>
        </div>
      </section>

      {/* Project Image */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <img src={project.imageUrl || imgProject} alt={project.title} className="w-full h-64 rounded-2xl border border-cyan-500/20 object-cover" loading="lazy" />
          </FadeIn>
        </div>
      </section>

      {/* Content grid */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <FadeIn>
            <GlowCard>
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">{p.challenge}</h2>
              <p className="text-gray-300 leading-relaxed">{project.challenge}</p>
            </GlowCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlowCard>
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">{p.solution}</h2>
              <p className="text-gray-300 leading-relaxed">{project.solution}</p>
            </GlowCard>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn delay={0.15}>
              <GlowCard className="h-full">
                <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">{p.technologies}</h2>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech}>{tech}</Badge>
                  ))}
                </div>
              </GlowCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlowCard className="h-full">
                <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">{p.impact}</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{project.impact}</p>
              </GlowCard>
            </FadeIn>
          </div>

          {/* Extra details for GISMO */}
          {project.grant && (
            <FadeIn delay={0.25}>
              <GlowCard>
                <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">{common.projectDetails}</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: common.grantFund, value: project.grant },
                    { label: common.universityPartner, value: project.university },
                    { label: common.academicStaff, value: project.academicStaff },
                    { label: common.industryPartner, value: project.partner },
                    { label: common.budget, value: project.budget },
                  ].map(({ label, value }) => value && (
                    <div key={label}>
                      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                      <dd className="text-sm text-gray-200">{value}</dd>
                    </div>
                  ))}
                </dl>
              </GlowCard>
            </FadeIn>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-xl font-semibold text-white mb-6">
              {common.projectCtaText}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              {common.getInTouch}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
