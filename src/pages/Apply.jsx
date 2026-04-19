import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard } from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

export default function Apply() {
  const { t } = useLang();
  const a = t.application;
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("position") || "";

  const [positions, setPositions] = useState([]);

  useEffect(() => {
    api.getJobListings().then(setPositions).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: preselected,
    coverLetter: "",
  });
  const [cv, setCv] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();
  const dropdownRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedPosition = positions.find((p) => p.title === form.position);

  const selectPosition = useCallback((pos) => {
    setForm((prev) => ({ ...prev, position: pos.title }));
    if (errors.position) setErrors((prev) => ({ ...prev, position: undefined }));
    setDropdownOpen(false);
  }, [errors.position]);

  const typeBadgeColor = (type) => {
    if (type?.includes("Staj")) return "bg-purple-500/15 text-purple-400 border-purple-500/25";
    if (type?.includes("Yarı")) return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    if (type?.includes("Sözleşmeli")) return "bg-orange-500/15 text-orange-400 border-orange-500/25";
    return "bg-cyan-500/15 text-cyan-400 border-cyan-500/25";
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = a.requiredField;
    if (!form.lastName.trim()) errs.lastName = a.requiredField;
    if (!form.email.trim()) errs.email = a.requiredField;
    if (!form.position) errs.position = a.requiredField;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName.trim());
      formData.append("lastName", form.lastName.trim());
      formData.append("email", form.email.trim());
      if (form.phone.trim()) formData.append("phone", form.phone.trim());
      formData.append("position", form.position);
      if (form.coverLetter.trim()) formData.append("coverLetter", form.coverLetter.trim());
      if (cv) formData.append("cv", cv);
      await api.submitApplication(formData);
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setCv(file);
  };

  if (success) {
    return (
      <div className="pt-16">
        <section className="py-32 bg-gray-950">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <FadeIn>
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{a.successTitle}</h1>
              <p className="mt-4 text-gray-400 text-lg">{a.successDesc}</p>
              <Link
                to="/careers"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 transition-colors"
              >
                {a.backToCareers}
              </Link>
            </FadeIn>
          </div>
        </section>
      </div>
    );
  }

  const inputCls = (field) =>
    `w-full bg-gray-900 border ${
      errors[field] ? "border-red-500/60" : "border-gray-700"
    } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 transition-colors`;

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{a.title}</h1>
            <p className="mt-4 text-xl text-gray-400">{a.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* Form */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <GlowCard>
              <form onSubmit={handleSubmit} className="space-y-6 p-2">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{a.firstName} *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={handleChange("firstName")}
                      className={inputCls("firstName")}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{a.lastName} *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={handleChange("lastName")}
                      className={inputCls("lastName")}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{a.email} *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      className={inputCls("email")}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{a.phone}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      className={inputCls("phone")}
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{a.position} *</label>
                  <div className="relative" ref={dropdownRef}>
                    {/* Trigger */}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((v) => !v)}
                      className={`w-full text-left bg-gray-900 border ${
                        errors.position ? "border-red-500/60" : dropdownOpen ? "border-cyan-500/60" : "border-gray-700"
                      } rounded-xl px-4 py-3 transition-colors flex items-center justify-between gap-3`}
                    >
                      {selectedPosition ? (
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-white truncate">{selectedPosition.title}</span>
                          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${typeBadgeColor(selectedPosition.type)}`}>
                            {selectedPosition.type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">{a.selectPosition}</span>
                      )}
                      <svg
                        className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown list */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
                        >
                          <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
                            {positions.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-gray-500">
                                {t.careers?.noPositions || "Açık pozisyon bulunmuyor"}
                              </div>
                            ) : (
                              positions.map((pos) => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => selectPosition(pos)}
                                  className={`w-full text-left px-4 py-3 transition-colors ${
                                    form.position === pos.title
                                      ? "bg-cyan-500/10"
                                      : "hover:bg-gray-800/60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`font-medium truncate ${form.position === pos.title ? "text-cyan-400" : "text-white"}`}>
                                      {pos.title}
                                    </span>
                                    <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${typeBadgeColor(pos.type)}`}>
                                      {pos.type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-xs text-gray-500">{pos.location}</span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.position && <p className="mt-1 text-xs text-red-400">{errors.position}</p>}
                </div>

                {/* CV Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{a.cvUpload}</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/40 transition-colors"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {cv ? (
                      <div className="text-sm">
                        <span className="text-cyan-400">{a.cvSelected}</span>{" "}
                        <span className="text-white">{cv.name}</span>
                        <span className="text-gray-500 ml-2">({(cv.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl text-gray-500">📄</span>
                        <p className="mt-2 text-sm text-gray-400">{a.cvHint}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{a.coverLetter}</label>
                  <textarea
                    value={form.coverLetter}
                    onChange={handleChange("coverLetter")}
                    rows={5}
                    placeholder={a.coverLetterPlaceholder}
                    className={inputCls("coverLetter")}
                  />
                </div>

                {/* Error */}
                {errors.submit && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    {errors.submit}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-semibold rounded-xl text-sm transition-colors"
                >
                  {submitting ? a.submitting : a.submitButton}
                </button>
              </form>
            </GlowCard>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
