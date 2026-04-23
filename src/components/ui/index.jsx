import { motion } from "framer-motion";

export function SectionTitle({ title, subtitle, center = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-14 ${center ? "text-center" : ""}`}
    >
      <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-gray-400 max-w-2xl leading-relaxed mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );
}

export function FadeIn({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlowCard({ children, className = "" }) {
  return (
    <div
      className={`relative bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 hover:border-cyan-500/40 hover:bg-gray-900/80 transition-all duration-300 group ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
      {children}
    </span>
  );
}

export { default as ConfirmModal } from './ConfirmModal';
export { default as Dropdown } from './Dropdown';
