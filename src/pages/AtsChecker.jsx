import { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { FadeIn, GlowCard } from "../components/ui";

export default function AtsChecker() {
  const { t } = useLang();
  
  // Minimal translations for the page
  const title = t.nav?.atsChecker || "ATS Resume Checker";
  const subtitle = "Check your resume against ATS algorithms and optimize for your dream job.";
  
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError("Please paste both your resume and the job description.");
      return;
    }
    
    setError(null);
    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/tools/ats/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resumeText })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
            <p className="text-gray-400 text-lg">{subtitle}</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FadeIn delay={0.1}>
            <div className="flex flex-col h-full">
              <label className="text-sm font-semibold text-gray-300 mb-2">Job Description</label>
              <textarea 
                className="w-full h-64 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div className="flex flex-col h-full">
              <label className="text-sm font-semibold text-gray-300 mb-2">Your Resume (Text)</label>
              <textarea 
                className="w-full h-64 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none"
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.3} className="flex justify-center mb-12">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-gray-950 font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <svg className="animate-spin h-5 w-5 text-gray-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : "Check Resume ATS Score"}
          </button>
        </FadeIn>

        {error && (
          <FadeIn>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center">
              {error}
            </div>
          </FadeIn>
        )}

        {result && (
          <FadeIn delay={0.4}>
            <div className="space-y-6">
              <GlowCard className="text-center p-8">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">ATS Match Score</div>
                <div className={`text-6xl font-bold ${result.score >= 80 ? 'text-green-400' : result.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.score}%
                </div>
              </GlowCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlowCard>
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Missing Keywords</h3>
                  {result.missingKeywords?.length > 0 ? (
                    <ul className="space-y-2">
                      {result.missingKeywords.map((kw, i) => (
                        <li key={i} className="text-red-400 flex items-start gap-2 text-sm">
                          <span className="shrink-0 mt-0.5">✖</span> <span>{kw}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">Great! No important keywords missing.</p>
                  )}
                </GlowCard>

                <GlowCard>
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Matching Keywords</h3>
                  {result.matchingKeywords?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.matchingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No matching keywords found.</p>
                  )}
                </GlowCard>
              </div>

              <GlowCard>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Formatting & Structure</h3>
                {result.formattingIssues?.length > 0 ? (
                  <ul className="space-y-2">
                    {result.formattingIssues.map((issue, i) => (
                      <li key={i} className="text-yellow-400 flex items-start gap-2 text-sm">
                        <span className="shrink-0 mt-0.5">⚠</span> <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="text-green-400">✔</span> No major formatting issues detected.
                  </p>
                )}
              </GlowCard>

              <GlowCard>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Suggestions for Improvement</h3>
                {result.suggestions?.length > 0 ? (
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-3 text-sm bg-gray-900/50 p-3 rounded-lg border border-gray-800/50">
                        <span className="text-cyan-400 font-bold">{i+1}.</span> 
                        <span className="leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">Your resume looks well-tailored for this position.</p>
                )}
              </GlowCard>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
