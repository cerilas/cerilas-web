import { useState, useEffect } from 'react';
import { 
  Binary, 
  Layers, 
  Coins, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  ArrowUpRight,
  Cpu,
  Globe
} from 'lucide-react';
import './TokenCounterSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is an LLM token and how is it calculated?',
    a: 'In Large Language Models (LLMs), a token is the fundamental atomic unit of text processed by the neural network. Tokens can be single characters, whole words, or sub-word fragments. For English text, 1 token is approximately 4 characters or 0.75 words. For code, numbers, and non-Latin languages, words are often split into multiple sub-word tokens depending on the model\'s Byte-Pair Encoding (BPE) or SentencePiece vocabulary.'
  },
  {
    q: 'Why do GPT-4o, Claude 3.5, and Gemini produce different token counts for the same text?',
    a: 'Each AI provider trains its model on a distinct tokenizer vocabulary. OpenAI\'s GPT-4o uses the o200k_base vocabulary containing ~200,000 tokens, which compresses non-English text and code significantly more efficiently than GPT-4\'s older cl100k_base (~100,000 tokens). Anthropic Claude and Google Gemini use their own customized vocabularies. As a result, the identical text will yield slightly different token counts across models.'
  },
  {
    q: 'Why do languages like Turkish, German, and Arabic use more tokens than English?',
    a: 'Most LLM tokenizers are pre-trained predominantly on English corpora. In agglutinative languages like Turkish, prefixes and suffixes attached to root words are frequently segmented into separate sub-word tokens. While modern vocabularies like o200k have improved multilingual compression by 20-30%, non-English prompts generally consume 1.3x to 2.2x more tokens per word than English.'
  },
  {
    q: 'Are my uploaded documents (PDF, Code, Text) sent to any external servers?',
    a: 'No. Universal Token Counter runs 100% client-side in your web browser. When you upload a PDF or source code file, text extraction (using WebAssembly pdfjs-dist) and token counting (via pure JavaScript BPE tokenizers) are executed locally on your machine. Zero prompt data or file contents ever leave your device.'
  },
  {
    q: 'How does context window usage affect API latency and output quality?',
    a: 'As your input prompt fills a higher percentage of the model\'s context window (e.g. 100k out of 128k tokens), time-to-first-token (TTFT) increases and the model may experience "needle-in-a-haystack" retrieval degradation. Keeping your context window usage under 60-70% through prompt optimization ensures faster responses, reduced costs, and higher factual accuracy.'
  },
  {
    q: 'How can I optimize my prompts to save 20-40% on AI API costs?',
    a: 'Use our 1-click Token Reducer to eliminate redundant whitespace, collapse multiple blank lines, and strip verbose code comments. In RAG pipelines, convert HTML to clean Markdown before embedding, and remove repetitive system instructions in multi-turn conversations through prompt caching.'
  },
  {
    q: 'What is the difference between o200k_base and cl100k_base tokenizers?',
    a: 'cl100k_base was introduced with GPT-4 and GPT-3.5 Turbo with a 100,000-token vocabulary. o200k_base was launched with GPT-4o and reasoning models (o1, o3-mini), expanding the vocabulary to 200,000 tokens. o200k offers superior token compression for non-English languages, emojis, and programming syntax, requiring ~10-25% fewer tokens for the same input.'
  }
];

const RELATED_TOOLS = [
  { name: 'HTML to LLM Markdown', desc: 'Convert web pages to token-efficient clean Markdown for LLMs.', href: '#/tool/html-to-llm-markdown' },
  { name: 'PDF → RAG Cleaner', desc: 'Extract and clean messy PDFs into structured vector chunks.', href: '#/tool/pdf-rag-cleaner' },
  { name: 'LLMs.txt Tools', desc: 'Generate and validate /llms.txt site guides for AI crawlers.', href: '#/tool/llms-txt' },
  { name: 'AI Link Hallucination Checker', desc: 'Audit AI generated drafts for broken or hallucinated URLs.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'AI Crawler Checker', desc: 'Verify if GPTBot, ClaudeBot, and Perplexity can access your site.', href: '#/tool/ai-crawler-checker' },
  { name: 'JSON Beautifier', desc: 'Format and inspect JSON payloads for AI API endpoints.', href: '#/tool/json-beautifier' }
];

export default function TokenCounterSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const faqStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    };

    let script = document.getElementById('token-counter-faq-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'token-counter-faq-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(faqStructuredData);

    return () => {
      const el = document.getElementById('token-counter-faq-jsonld');
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="tc-seo-container">
      {/* Intro Grid */}
      <div className="tc-seo-header">
        <h2 className="tc-seo-title">Why Accurate Multi-Model Token Counting Matters in 2026</h2>
        <p className="tc-seo-intro">
          Understanding token distribution across frontier AI models is essential for building cost-effective,
          high-performance AI agents and RAG applications. Cerilas Universal Token Counter provides real-time
          bilingual analytics, interactive token visualization, and 2026 API cost estimation without sending your data anywhere.
        </p>
      </div>

      <div className="tc-seo-grid">
        <div className="tc-seo-card">
          <div className="tc-seo-card-icon">
            <Binary size={20} />
          </div>
          <h3 className="tc-seo-card-title">Exact Token Boundaries</h3>
          <p className="tc-seo-card-desc">
            Visualize how tokenizers split your words, punctuation, whitespace, and code syntax into distinct token IDs with color-coded chips.
          </p>
        </div>

        <div className="tc-seo-card">
          <div className="tc-seo-card-icon">
            <Coins size={20} />
          </div>
          <h3 className="tc-seo-card-title">Real-Time Cost Audit</h3>
          <p className="tc-seo-card-desc">
            Compare API costs across 16+ frontier models including GPT-4o, Claude 3.7 Sonnet, Gemini 2.0 Flash, and DeepSeek-V3 instantly.
          </p>
        </div>

        <div className="tc-seo-card">
          <div className="tc-seo-card-icon">
            <ShieldCheck size={20} />
          </div>
          <h3 className="tc-seo-card-title">100% Client-Side Privacy</h3>
          <p className="tc-seo-card-desc">
            All text and PDF document parsing happens in your local web browser. Your private system prompts and proprietary datasets remain secure.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="tc-faq-section">
        <h2 className="tc-faq-title">Frequently Asked Questions</h2>
        <div className="tc-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="tc-faq-item">
                <button
                  type="button"
                  className="tc-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`tc-faq-icon ${isOpen ? 'open' : ''}`} />
                </button>
                {isOpen && (
                  <div className="tc-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Tools */}
      <div className="tc-related-section">
        <h3 className="tc-related-title">Explore Related AI & Developer Tools</h3>
        <div className="tc-related-grid">
          {RELATED_TOOLS.map((tool, idx) => (
            <a key={idx} href={tool.href} className="tc-related-card">
              <div>
                <div className="tc-related-name">
                  <span>{tool.name}</span>
                  <ArrowUpRight size={14} />
                </div>
                <p className="tc-related-desc">{tool.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
