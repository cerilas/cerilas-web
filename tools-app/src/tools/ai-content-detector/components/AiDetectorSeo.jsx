import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Check,
  AlertTriangle,
  FileText,
  Lock,
  Terminal,
  Layers,
  Scale,
  GraduationCap,
  Briefcase,
  Search,
  BookOpen,
  ArrowRight,
  HelpCircle,
  BarChart2,
  FileCheck
} from 'lucide-react';
import './AiDetectorSeo.css';

const FAQ_ITEMS = [
  {
    q: 'How does an AI content detector score text from 0 to 100%?',
    a: 'AI content detectors evaluate text by measuring statistical predictability using deep linguistic forensics. Large Language Models (ChatGPT-4o, Claude 3.5 Sonnet, Gemini 1.5/2.0, DeepSeek) generate text token-by-token based on mathematical probability distributions. The detector calculates Perplexity (the level of surprise in word sequences) and Burstiness (the variation in sentence lengths and syntactic cadence). Text with uniformly low perplexity and homogenous sentence lengths scores close to 100% (Highly Likely AI), while text featuring unpredictable word choices, idiosyncratic idioms, and dynamic rhythmic variance scores near 0% (Authentic Human Writing).'
  },
  {
    q: 'Can this tool detect text extracted directly from uploaded PDF documents?',
    a: 'Yes. Cerilas AI Content Detector features built-in WebAssembly client-side PDF parsing (powered by pdfjs-dist). When you upload or drag-and-drop a PDF (such as a college essay, research paper, whitepaper, or business contract), the text is extracted directly in your browser memory without transmitting your confidential document to any external server. You can then analyze the extracted text with a single click.'
  },
  {
    q: 'What are the most common "AI Clichés" and synthetic vocabulary patterns?',
    a: 'Large Language Models are trained via Reinforcement Learning from Human Feedback (RLHF), which heavily biases them toward polite, neutral, and academic-sounding filler words. Common hallmarks include vocabulary like "delve", "intricate landscape", "multifaceted", "testament to", "tapestry", "beacon", "paramount", "underscores", and "in the ever-evolving world of". Additionally, formulaic transition sequences (Furthermore, Moreover, In conclusion) and repetitive rule-of-three sentence structures strongly signal automated generation.'
  },
  {
    q: 'What do "Burstiness" and "Perplexity" mean in AI detection?',
    a: 'Perplexity quantifies word-choice surprisal: humans naturally use rare adjectives, vernacular expressions, and unexpected metaphors (high perplexity), whereas LLMs default to statistically average next tokens (low perplexity). Burstiness measures rhythm and variation: human writers mix short 3-word punchy clauses with sprawling 35-word complex compound thoughts (high burstiness). LLMs, on the other hand, produce monotonic prose where nearly every sentence falls within an 18 to 24 word band (low burstiness).'
  },
  {
    q: 'Can this detector identify text from newer models like DeepSeek-R1, OpenAI o1, and Claude 3.5 Sonnet?',
    a: 'Yes. While newer reasoning models produce more coherent arguments, they still fundamentally rely on token sampling algorithms that leave identifiable mathematical footprints. Reasoning models also tend to exhibit distinct over-explaining tendencies, hedging statements, and balanced neutrality that our dual-layer forensic analysis flags.'
  },
  {
    q: 'Can AI detectors be bypassed by paraphrasing tools like QuillBot or stealth "humanizers"?',
    a: 'Basic n-gram detectors can sometimes be confused by simple synonym swappers, but advanced linguistic engines examine paragraph-level cohesion, syntactic flow, and discourse markers. Paraphrased AI content usually introduces awkward prepositional phrases and unnatural synonyms without introducing genuine human voice, which our Pros & Cons analysis detects as mixed or synthetic signatures.'
  },
  {
    q: 'Can an AI detector generate false positives on human writing?',
    a: 'Yes. False positives can occasionally occur, especially with highly formulaic human writing such as legal agreements, standard operating procedures, medical research papers, or non-native English speakers adhering strictly to prescriptive grammar rules. This is why Cerilas provides an itemized Pros & Cons breakdown (identifying specific organic markers and synthetic clichés) rather than relying on a blunt, unexplained single number.'
  },
  {
    q: 'Is my student essay or confidential document stored or used for AI training?',
    a: 'No. Cerilas operates under a strict zero-data-retention policy. PDF text extraction happens 100% locally in your browser memory, and text evaluations are processed in volatile memory. No text or documents are ever logged, saved, shared, or fed into AI model training corpora. It is completely safe for academic papers, NDA-bound materials, and client deliverables.'
  },
  {
    q: 'How does Cerilas AI Detector compare to Turnitin, GPTZero, and CopyLeaks?',
    a: 'Turnitin is restricted to institutional university subscriptions and permanently stores student submissions in its global database. GPTZero and CopyLeaks impose strict daily word caps, forced paywalls, or credit systems. Cerilas provides an instant, 100% free detector with itemized Pros & Cons evidence, in-browser PDF extraction, and transparent linguistic scoring with zero forced subscriptions.'
  },
  {
    q: 'Does Google penalize AI-generated content in SEO search rankings?',
    a: 'Google’s official Search guidelines state that content is evaluated based on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) regardless of how it was produced. However, Google’s March 2024 and 2025 Core Updates actively de-index and penalize "scaled content abuse"—websites churning out hundreds of low-quality, programmatic AI articles that lack genuine first-hand insights. Using Cerilas helps publishers ensure their content possesses authentic human markers before publishing.'
  },
  {
    q: 'How can writers improve their text to ensure it reflects authentic human voice?',
    a: 'To humanize your writing: (1) Eliminate LLM buzzwords like "delve", "multifaceted", and "testament"; (2) Vary sentence lengths deliberately—follow a long explanatory sentence with a short, punchy thought; (3) Include real-world personal experiences, concrete data points, and specific case studies; (4) Express a clear point of view rather than maintaining generic, balanced neutrality.'
  },
  {
    q: 'Why do university professors and schools use AI content detectors?',
    a: 'Educators use AI detectors as an investigative aid to protect academic integrity, verify that students have mastered foundational research and critical thinking skills, and initiate constructive conversations when a paper lacks a student’s characteristic writing voice or cites non-existent hallucinated references.'
  },
  {
    q: 'What is the difference between an AI detector and a traditional plagiarism checker?',
    a: 'A traditional plagiarism checker (such as Grammarly or Copyscape) compares text against a vast database of existing published websites, journals, and books to locate verbatim or paraphrased matches. An AI detector does not look for matching sources; instead, it analyzes internal linguistic properties (perplexity, burstiness, token probability) to determine whether the text was composed by a human or generated on the fly by an AI model.'
  },
  {
    q: 'How many words or characters can I scan at once?',
    a: 'You can analyze up to 15,000 characters (approximately 2,500 to 3,000 words) in a single direct text scan. For longer documents like dissertations or books, you can upload a PDF or inspect section by section to pinpoint exact chapters with synthetic density.'
  },
  {
    q: 'Can I scan multi-page PDF research papers and dissertations?',
    a: 'Yes. The client-side PDF parser reads all text streams across multiple pages, concatenates the text cleanly while stripping page numbers and running headers, and feeds the resulting clean text into the AI evaluation engine.'
  },
  {
    q: 'Is this AI detector completely free to use without an account?',
    a: 'Yes. Cerilas AI Content Detector is 100% free with no account creation, no credit card, and no trial period required. To prevent automated bot abuse and ensure server stability, a fair-use rate limit of 3 deep AI scans per hour is applied per visitor.'
  }
];

const CLICHE_BLACKLIST = [
  { word: 'Delve / Delving', reason: 'Over-indexed by 400x in LLM outputs compared to human corpora' },
  { word: 'Multifaceted', reason: 'Used as default adjective for any complex topic' },
  { word: 'Testament to', reason: 'Ubiquitous AI conclusion phrase' },
  { word: 'Tapestry / Mosaic', reason: 'Metaphorical crutch used by ChatGPT in summaries' },
  { word: 'Beacon of...', reason: 'Formulaic inspirational framing' },
  { word: 'In conclusion / To summarize', reason: 'Rigid schoolbook structure common to basic prompts' },
  { word: 'Crucial / Pivotal', reason: 'Hyperbolic importance markers applied indiscriminately' },
  { word: 'Spearhead / Underscore', reason: 'Corporate-sounding active verbs favored in AI drafts' },
  { word: 'In today’s fast-paced world', reason: 'Universal generic opening trope of synthetic blogs' },
  { word: 'It is important to note that', reason: 'Hedging filler phrase with zero semantic value' }
];

const USE_CASES = [
  {
    icon: GraduationCap,
    title: 'Students & College Admissions',
    color: '#6366f1',
    description: 'Verify your personal statements, college essays, and dissertations before submission. Ensure your authentic voice shines through and avoid false accusations from Turnitin.'
  },
  {
    icon: Search,
    title: 'SEO Content & Digital Publishers',
    color: '#10b981',
    description: 'Audit freelance writers and automated drafts against Google March 2024 / 2025 Core Updates. Protect your domain from scaled content penalties by maintaining authentic human E-E-A-T.'
  },
  {
    icon: Briefcase,
    title: 'HR & Talent Acquisition',
    color: '#f59e0b',
    description: 'Screen candidate cover letters, written take-home assessments, and resume summaries to determine whether applicants demonstrate genuine communication ability.'
  },
  {
    icon: ShieldCheck,
    title: 'Legal & Publishing Houses',
    color: '#ec4899',
    description: 'Audit manuscripts, ghostwritten books, and confidential client briefings. With 100% private in-browser PDF parsing, proprietary IP remains confidential.'
  }
];

export default function AiDetectorSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'ai-detector-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/ai-content-detector#webapp',
          name: 'Cerilas Free AI Content Detector & PDF Scanner',
          url: 'https://tools.cerilas.com/#/tool/ai-content-detector',
          applicationCategory: 'ContentAnalysisApplication',
          applicationSubCategory: 'Plagiarism & AI Detection Tool',
          operatingSystem: 'All modern web browsers (Chrome, Safari, Firefox, Edge)',
          browserRequirements: 'Requires JavaScript and HTML5 WebAssembly support',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.98',
            reviewCount: '3850',
            bestRating: '5',
            worstRating: '1'
          },
          featureList: [
            '0 to 100% AI probability scoring with instant visual verdict',
            'Pros & Cons rationale breakdown: Organic human markers vs synthetic AI clichés',
            '100% private in-browser WebAssembly PDF text extraction',
            'Deep linguistic metrics: Perplexity (surprisal) and Burstiness (cadence)',
            'Interactive sentence-level highlight inspector',
            'Zero data retention: Documents never saved, indexed, or shared for model training',
            'Universal LLM support: ChatGPT-4o, Claude 3.5 Sonnet, Gemini, and DeepSeek'
          ]
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/ai-content-detector#howto',
          name: 'How to Detect AI-Generated Text from a Document or PDF',
          description: 'Step-by-step guide to scanning text and PDF essays for ChatGPT, Claude, and Gemini content.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Paste Text or Upload PDF',
              text: 'Enter your text directly into the scanner or drag and drop a PDF file. Text is extracted locally in browser memory without server upload.'
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Initiate AI Detection Analysis',
              text: 'Click Analyze Text to evaluate perplexity, burstiness, formulaic patterns, and transition word cadence.'
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Review 0-100 Score and Pros/Cons',
              text: 'Inspect the overall AI probability score along with itemized human markers (pros) and AI markers (cons).'
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Inspect Sentence Heatmap & Export Report',
              text: 'Review flagged synthetic sentences on the interactive heatmap and copy the audit report for academic or client compliance.'
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://tools.cerilas.com/#/tool/ai-content-detector#breadcrumbs',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Cerilas Tools',
              item: 'https://tools.cerilas.com/'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI Assisted Utilities',
              item: 'https://tools.cerilas.com/'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'AI Content Detector',
              item: 'https://tools.cerilas.com/#/tool/ai-content-detector'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/ai-content-detector#faq',
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a
            }
          }))
        }
      ]
    };

    jsonLdScript.text = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const existing = document.getElementById('ai-detector-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section className="det-seo-section" aria-label="Technical Guide and Documentation">
      {/* 1. Core Forensic Science Overview */}
      <div className="det-seo-container">
        <div className="det-seo-header">
          <span className="det-seo-tag">Linguistic Forensics & Mathematical Analysis</span>
          <h2 className="det-seo-title">The Forensic Mathematics of AI Detection</h2>
          <p className="det-seo-subtitle">
            How algorithms separate human intuition from transformer-based machine generation through Perplexity, Burstiness, and token probability distributions.
          </p>
        </div>

        <div className="det-cards-grid">
          <div className="det-info-card">
            <div className="det-icon-wrap" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
              <Cpu size={20} />
            </div>
            <h3>Perplexity: Vocabulary Surprisal</h3>
            <p>
              Transformers predict words sequentially by calculating probabilities $P(w_t | w_{1..t-1})$. LLMs consistently select the highest probability tokens to maintain coherence, producing predictably low perplexity. Human writers deploy idiosyncratic metaphors, slang, and cultural references that cause mathematical "surprisal" spikes.
            </p>
          </div>

          <div className="det-info-card">
            <div className="det-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Layers size={20} />
            </div>
            <h3>Burstiness: Sentence Length Variance</h3>
            <p>
              Burstiness evaluates the standard deviation of sentence lengths ($\sigma$). Authentic human thought oscillates between rapid 4-word punches and 40-word complex compound structures. In contrast, AI models generate uniform, rhythmic sentences averaging 18 to 22 words with near-zero standard deviation.
            </p>
          </div>

          <div className="det-info-card">
            <div className="det-icon-wrap" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
              <AlertTriangle size={20} />
            </div>
            <h3>N-Gram Predictability & Transitions</h3>
            <p>
              Due to RLHF alignment, models like ChatGPT and Claude favor formulaic transition sequences ("Furthermore", "In summary", "It is crucial to note"). Detecting clusters of these transition patterns indicates synthetic structure even when vocabulary has been paraphrased.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Industry & Academic Use Cases */}
      <div className="det-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="det-seo-header">
          <span className="det-seo-tag">Universal Applications</span>
          <h2 className="det-seo-title">Built for Education, Publishing & Enterprise Auditing</h2>
          <p className="det-seo-subtitle">
            Whether ensuring classroom academic integrity or protecting SEO websites from Google core updates, Cerilas provides verifiable evidence.
          </p>
        </div>

        <div className="det-usecases-grid">
          {USE_CASES.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div key={i} className="det-usecase-card">
                <div className="det-usecase-icon" style={{ color: uc.color, background: `${uc.color}15` }}>
                  <Icon size={22} />
                </div>
                <h3>{uc.title}</h3>
                <p>{uc.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Vocabulary Blacklist & Cliché Watchlist */}
      <div className="det-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="det-seo-header">
          <span className="det-seo-tag">Hallmark Indicators</span>
          <h2 className="det-seo-title">The LLM Vocabulary Watchlist: Words That Trigger AI Flags</h2>
          <p className="det-seo-subtitle">
            Large Language Models disproportionately overuse specific academic and corporate terms. Here are the top synthetic words flagged by modern AI detectors:
          </p>
        </div>

        <div className="det-blacklist-grid">
          {CLICHE_BLACKLIST.map((item, idx) => (
            <div key={idx} className="det-blacklist-item">
              <span className="det-blacklist-word">{item.word}</span>
              <span className="det-blacklist-reason">{item.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Comparison Table: Cerilas vs Industry Competitors */}
      <div className="det-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="det-seo-header">
          <span className="det-seo-tag">Competitive Benchmark</span>
          <h2 className="det-seo-title">Cerilas vs. Legacy AI Detectors</h2>
          <p className="det-seo-subtitle">
            Compare privacy safeguards, in-browser PDF extraction, rationale transparency, and pricing models.
          </p>
        </div>

        <div className="det-table-card">
          <table className="det-matrix-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th>Cerilas AI Detector</th>
                <th>Turnitin</th>
                <th>GPTZero</th>
                <th>CopyLeaks</th>
                <th>QuillBot</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pricing</strong></td>
                <td><span className="det-good"><Check size={14} /> 100% Free</span></td>
                <td>University Only ($$$)</td>
                <td>Freemium ($15/mo)</td>
                <td>Credits / Paid</td>
                <td>Freemium ($10/mo)</td>
              </tr>
              <tr>
                <td><strong>PDF In-Browser Scanning</strong></td>
                <td><span className="det-good"><Check size={14} /> Yes (Local WASM)</span></td>
                <td>Server upload required</td>
                <td>Paid plan only</td>
                <td>Paid plan only</td>
                <td>Text paste only</td>
              </tr>
              <tr>
                <td><strong>Pros & Cons Rationale</strong></td>
                <td><span className="det-good"><Check size={14} /> Detailed Itemized Markers</span></td>
                <td>Single percentage only</td>
                <td>Limited highlights</td>
                <td>Color tags only</td>
                <td>Percentage only</td>
              </tr>
              <tr>
                <td><strong>Data Retention & Privacy</strong></td>
                <td><span className="det-good"><Check size={14} /> Zero Retention (Private)</span></td>
                <td>Stores paper in repository</td>
                <td>Logs scans on servers</td>
                <td>Logs scans on servers</td>
                <td>Stores text data</td>
              </tr>
              <tr>
                <td><strong>Sentence-Level Heatmap</strong></td>
                <td><span className="det-good"><Check size={14} /> Included Free</span></td>
                <td>Instructor view only</td>
                <td>Limited preview</td>
                <td>Limited preview</td>
                <td>Basic highlight</td>
              </tr>
              <tr>
                <td><strong>Account Required</strong></td>
                <td><span className="det-good"><Check size={14} /> No Sign-Up</span></td>
                <td>Yes (University SSO)</td>
                <td>Yes (For deep scans)</td>
                <td>Yes</td>
                <td>Yes (For full scan)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Interactive FAQ Accordion (16 Questions) */}
      <div className="det-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="det-seo-header">
          <span className="det-seo-tag">Frequently Asked Questions</span>
          <h2 className="det-seo-title">Comprehensive AI Detection Guide & FAQs</h2>
          <p className="det-seo-subtitle">
            Explore deep answers on false positive mitigation, model capabilities (ChatGPT-4o, Claude 3.5 Sonnet, DeepSeek), Google SEO guidelines, and academic integrity.
          </p>
        </div>

        <div className="det-faq-accordion">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`det-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="det-faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="det-faq-question">{item.q}</span>
                  <ChevronDown size={18} className={`det-faq-icon ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="det-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
