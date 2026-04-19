import { useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { SectionTitle, FadeIn, GlowCard } from "../components/ui";
import { api } from "../lib/api";

export default function Apply() {
  const { t } = useLang();
  const a = t.application;
  const c = t.careers;
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("position") || "";

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
                  <select
                    value={form.position}
                    onChange={handleChange("position")}
                    className={inputCls("position")}
                  >
                    <option value="">{a.selectPosition}</option>
                    {c.positions.map((pos) => (
                      <option key={pos.title} value={pos.title}>
                        {pos.title}
                      </option>
                    ))}
                  </select>
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
