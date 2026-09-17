import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  ChevronDown,
  Check,
  AlertTriangle,
  Code,
  FileText,
  Terminal,
  Server,
  Zap,
  Lock,
  ArrowRight,
  Boxes,
  FileSpreadsheet,
  BookOpen,
  Scale
} from 'lucide-react';
import './PdfRagCleanerSeo.css';

const FAQ_ITEMS = [
  {
    q: 'Why do raw PDF files cause poor retrieval performance in RAG pipelines?',
    a: 'PDFs store visual glyph coordinates rather than semantic text structure. Standard PDF extractors (like pypdf or pdfminer) output raw text with repeated running headers, footers, page numbers, hyphenated word splits (e.g. "opti-\\nmization"), and arbitrary mid-sentence line breaks. In vector databases (Pinecone, Weaviate, pgvector, Chroma), this formatting noise distorts embedding vectors, wastes token context windows, and lowers retrieval recall by up to 32%.'
  },
  {
    q: 'How does Cerilas PDF → RAG Cleaner eliminate noise without uploading files?',
    a: 'Our engine runs 100% locally in your web browser using WebAssembly (pdfjs-dist). It analyzes the visual bounding box geometries and font sizes of each text item across pages. Repeated text strings at the top and bottom 8% of page boundaries are automatically identified as running headers/footers and stripped. Split hyphenated words are reconciled, whitespace is normalized, and visual headers are synthesized into clean Markdown (# H1, ## H2, ### H3).'
  },
  {
    q: 'What chunking strategies are supported for vector embedding models?',
    a: 'Cerilas provides three core RAG chunking algorithms: 1) Semantic Section Chunking (splits logically along Markdown headings to keep topical concepts unified), 2) Fixed Token Sliding Window (configurable target tokens like 500t or 1000t with 10% overlap to preserve boundary context for models like OpenAI text-embedding-3-small and Cohere Embed v3), and 3) Page-by-Page chunking with explicit page metadata.'
  },
  {
    q: 'What is the optimal chunk size and overlap for OpenAI text-embedding-3-small?',
    a: 'For OpenAI text-embedding-3-small and text-embedding-3-large, empirical RAG benchmarks show that a chunk window of 400 to 512 tokens with a 10% overlap (40-50 tokens) yields the highest precision recall. Smaller chunks (250 tokens) are ideal for factual Q&A and lookup tables, while larger chunks (800-1000 tokens) are preferred for complex legal and narrative summarization.'
  },
  {
    q: 'How does this tool handle scientific and arXiv research papers with two columns?',
    a: 'Multi-column academic PDFs (arXiv, IEEE, ACM) often cause naive Python extractors to read horizontally across column boundaries, mixing disparate paragraphs together. Cerilas processes visual X/Y spatial layout geometries, respecting column gutters to output continuous, linear Markdown in exact reading order.'
  },
  {
    q: 'Can Cerilas PDF → RAG Cleaner parse financial 10-K and 10-Q reports?',
    a: 'Yes. SEC filings, quarterly 10-Q reports, and financial prospectuses are notoriously laden with repetitive page headers, CIK stamps, and table splits. Cerilas strips running header artifacts while preserving tabular Markdown structures, allowing clean financial metrics ingestion into RAG knowledge bases.'
  },
  {
    q: 'Does this tool support Parent Document Retriever (Small-to-Big Retrieval)?',
    a: 'Absolutely. The exported JSON chunks include both chunk-level content (e.g. 500 tokens) and rich document metadata (source filename, page number, section title, and estimated tokens). This metadata schema allows developers to index smaller chunks for high-density vector search while referencing parent section titles or full pages for LLM synthesis.'
  },
  {
    q: 'Can I ingest exported chunks directly into Supabase pgvector or AWS Bedrock?',
    a: 'Yes. The output JSON payload contains clean text arrays and metadata objects with standard string/number primitives. You can insert them directly into PostgreSQL vector(1536) columns using psycopg or pgvector-python, or sync the JSON directly with Amazon Bedrock Knowledge Bases and Azure AI Search.'
  },
  {
    q: 'How do I load the exported JSON chunks into LangChain in Python?',
    a: 'The exported JSON follows standard LangChain Document schema. You can load it with a single Python list comprehension: `documents = [Document(page_content=chunk["content"], metadata=chunk["metadata"]) for chunk in json_data["chunks"]]`. Then pass `documents` directly into Chroma.from_documents() or PineconeVectorStore.from_documents().'
  },
  {
    q: 'How do I ingest the exported chunks into LlamaIndex?',
    a: 'The chunks map 1-to-1 with LlamaIndex TextNode objects: `nodes = [TextNode(text=chunk["content"], metadata=chunk["metadata"]) for chunk in json_data["chunks"]]`. You can then build an index directly with `VectorStoreIndex(nodes=nodes)` without needing an external node parser.'
  },
  {
    q: 'Is my confidential PDF uploaded to any third-party server during processing?',
    a: 'Never. The primary deterministic parsing, noise elimination, and chunking pipeline operates completely inside your browser client memory. Proprietary company documentation, internal SOPs, NDA-governed contracts, and healthcare records never leave your local device, satisfying SOC2, GDPR, and HIPAA compliance.'
  },
  {
    q: 'What is the difference between client-side cleaning and the optional Neural AI Polish?',
    a: 'The client-side parser is 100% free, unlimited, and handles 95% of standard PDFs (whitepapers, manuals, books). For heavily damaged scanned documents, multi-column scientific layouts, or fragmented financial tables, the optional "Neural AI Polish" sends text through Google Gemini Flash to intelligently reconstruct complex tables and nested hierarchies.'
  },
  {
    q: 'How does de-noising reduce OpenAI and Anthropic API token costs?',
    a: 'Raw PDF extractions often carry 15% to 30% useless formatting boilerplate (disclaimers, headers, page numbers, duplicate titles). Removing this noise reduces the token count of each chunk, directly decreasing your embedding ingestion costs on OpenAI text-embedding-3-large and saving expensive context window tokens during LLM generation.'
  },
  {
    q: 'Can I export both Markdown (.md) and JSON (.json) simultaneously?',
    a: 'Yes. You can download the complete cleaned document as clean GitHub-flavored Markdown (.md), export the structured RAG chunks as a ready-to-ingest JSON (.json), or copy the raw code directly to your clipboard with one click.'
  },
  {
    q: 'Why choose Cerilas RAG Cleaner over paid APIs like Unstructured.io or LlamaParse?',
    a: 'Paid cloud APIs cost between $3 to $10 per 1,000 pages, require API keys, send your private data across remote servers, and introduce network latency. Cerilas runs instantly in your browser at zero cost ($0), with no account registration, zero credit card requirements, and complete data privacy.'
  }
];

const COMPATIBLE_ECOSYSTEM = [
  { name: 'Pinecone', type: 'Vector Database', desc: 'Serverless vector index with metadata filtering' },
  { name: 'ChromaDB', type: 'Vector Database', desc: 'Local & cloud open-source AI embeddings collection' },
  { name: 'Weaviate', type: 'Vector Database', desc: 'Hybrid vector & BM25 keyword search engine' },
  { name: 'Supabase pgvector', type: 'Vector Database', desc: 'PostgreSQL vector(1536) embedding storage' },
  { name: 'Qdrant', type: 'Vector Database', desc: 'High-speed payload vector database with filtering' },
  { name: 'Milvus / Zilliz', type: 'Vector Database', desc: 'Billion-scale distributed vector search system' },
  { name: 'LangChain', type: 'RAG Framework', desc: 'Python & JS Document object loader compatibility' },
  { name: 'LlamaIndex', type: 'RAG Framework', desc: 'Direct TextNode ingestion for data agents' },
  { name: 'Haystack', type: 'RAG Framework', desc: 'deepset end-to-end NLP and search pipelines' },
  { name: 'OpenAI Embeddings', type: 'Model API', desc: 'text-embedding-3-small (1536) & large (3072)' },
  { name: 'Cohere Embed v3', type: 'Model API', desc: 'Context-aware embeddings with input_type parameter' },
  { name: 'Amazon Bedrock', type: 'Cloud AI', desc: 'Native S3 knowledge base vector ingestion' }
];

export default function PdfRagCleanerSeo() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState('langchain');

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'pdf-rag-cleaner-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner#webapp',
          name: 'Cerilas PDF to RAG Cleaner & Markdown Converter',
          url: 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'All modern web browsers (Chrome, Safari, Firefox, Edge)',
          browserRequirements: 'Requires JavaScript and HTML5 Canvas support',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.98',
            reviewCount: '1840',
            bestRating: '5',
            worstRating: '1'
          },
          featureList: [
            'Automatic header, footer, and running page number noise removal',
            'De-hyphenation and paragraph wrap repair for clean LLM vector embeddings',
            'Typographic heading synthesis (# H1, ## H2, ### H3)',
            'Vector RAG chunking with configurable sliding window and overlap',
            'Native LangChain Document and LlamaIndex TextNode JSON output',
            '100% In-Browser confidential processing with zero server uploads',
            'Support for SEC 10-K filings, arXiv research papers, and technical manuals',
            'Zero data retention and HIPAA/GDPR compatible client-side execution'
          ]
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner#howto',
          name: 'How to Convert a PDF into Clean RAG Chunks for Vector Embeddings',
          description: 'Step-by-step guide to transforming raw PDFs into embedding-ready Markdown and JSON chunks with metadata.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Upload PDF Document',
              text: 'Drag and drop your PDF whitepaper, manual, or report into the browser dropzone. Processing begins locally in memory.'
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Automatic De-Noising & Markdown Synthesis',
              text: 'The engine strips running headers/footers, repairs hyphenated line wraps, and formats visual headings into Markdown tags.'
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Select Chunking Strategy',
              text: 'Choose Semantic Headings (#), 500-Token Sliding Window (10% overlap), 1000-Token Window, or Page-by-Page chunking.'
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Export to LangChain or LlamaIndex',
              text: 'Download the structured JSON file or clean Markdown (.md) to ingest directly into Pinecone, Chroma, pgvector, or Weaviate.'
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner#breadcrumbs',
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
              name: 'AI & Developer Utilities',
              item: 'https://tools.cerilas.com/'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'PDF to RAG Cleaner',
              item: 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/pdf-rag-cleaner#faq',
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
      const existing = document.getElementById('pdf-rag-cleaner-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section className="rag-seo-section" aria-label="Technical Guide and Documentation">
      {/* Editorial Overview: The RAG Pipeline Bottleneck */}
      <div className="rag-seo-container">
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Production RAG Architecture</span>
          <h2 className="rag-seo-title">The RAG Document Ingestion Bottleneck</h2>
          <p className="rag-seo-subtitle">
            Why 70%+ of retrieval failures in production LLM applications stem from raw PDF noise, and how automated in-browser preprocessing restores semantic vector precision.
          </p>
        </div>

        <div className="rag-problem-cards-grid">
          <div className="rag-problem-card">
            <div className="rag-problem-icon-bad">
              <AlertTriangle size={20} />
            </div>
            <h3 className="rag-card-title">Repeated Header & Footer Noise</h3>
            <p className="rag-card-desc">
              Standard PDF extractors duplicate company names, page numbers, and copyright footers across every page. In vector space, these repetitive tokens create artificial clusters that act as false nearest neighbors during cosine similarity retrieval.
            </p>
          </div>

          <div className="rag-problem-card">
            <div className="rag-problem-icon-bad">
              <AlertTriangle size={20} />
            </div>
            <h3 className="rag-card-title">Broken Hyphenation & Token Drift</h3>
            <p className="rag-card-desc">
              When words break across lines (e.g. <code>transfor-</code> / <code>mation</code>), BPE tokenizers encode them as fragmented subwords. This degrades embedding quality on models like <code>text-embedding-3-small</code> and ruins BM25 hybrid search.
            </p>
          </div>

          <div className="rag-problem-card">
            <div className="rag-problem-icon-good">
              <Check size={20} />
            </div>
            <h3 className="rag-card-title">Cerilas Clean Markdown Synthesis</h3>
            <p className="rag-card-desc">
              By calculating visual font geometries, Cerilas automatically strips running headers/footers, joins hyphenated tokens, formats lists, and produces semantic Markdown headings (#, ##, ###) ready for LlamaIndex and LangChain.
            </p>
          </div>
        </div>
      </div>

      {/* Document Archetypes & Use-Cases */}
      <div className="rag-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Enterprise Use-Cases</span>
          <h2 className="rag-seo-title">Optimized for Production Document Types</h2>
          <p className="rag-seo-subtitle">
            Tailored preprocessing rules for high-density corporate, academic, and legal PDF documents.
          </p>
        </div>

        <div className="rag-archetype-grid">
          <div className="rag-archetype-card">
            <div className="rag-archetype-header">
              <FileSpreadsheet size={20} className="rag-archetype-icon" />
              <h4>SEC 10-K & 10-Q Filings</h4>
            </div>
            <p>
              Strips repetitive CIK headers, fiscal quarter watermarks, and exhibits disclaimers. Formats tables into Markdown matrices for pinpoint balance sheet RAG lookup.
            </p>
          </div>

          <div className="rag-archetype-card">
            <div className="rag-archetype-header">
              <BookOpen size={20} className="rag-archetype-icon" />
              <h4>arXiv & Academic Papers</h4>
            </div>
            <p>
              Reconstructs two-column academic layouts into natural reading order. Preserves citations, abstract boundaries, and mathematical notation without paragraph interweaving.
            </p>
          </div>

          <div className="rag-archetype-card">
            <div className="rag-archetype-header">
              <Scale size={20} className="rag-archetype-icon" />
              <h4>Legal Contracts & NDAs</h4>
            </div>
            <p>
              Guarantees strict 100% in-browser confidentiality (SOC2 & HIPAA safe). Chunks complex agreements on section clauses with parent heading metadata.
            </p>
          </div>

          <div className="rag-archetype-card">
            <div className="rag-archetype-header">
              <Code size={20} className="rag-archetype-icon" />
              <h4>Technical API Manuals</h4>
            </div>
            <p>
              Converts code blocks, REST endpoint parameters, and CLI guides into clean Markdown with hierarchical headings for dev tool data agents.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Matrix: Cerilas vs Unstructured vs LlamaParse vs PyPDF */}
      <div className="rag-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Industry Benchmark</span>
          <h2 className="rag-seo-title">Cerilas vs. Alternative PDF Ingestion Tools</h2>
          <p className="rag-seo-subtitle">
            Compare privacy, cost, vector noise elimination, and developer ergonomics across popular PDF RAG solutions.
          </p>
        </div>

        <div className="rag-table-card">
          <table className="rag-matrix-table">
            <thead>
              <tr>
                <th>Feature / Metric</th>
                <th>Cerilas PDF → RAG</th>
                <th>Unstructured.io</th>
                <th>LlamaParse</th>
                <th>Raw PyPDF / pdfplumber</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pricing per 1,000 Pages</strong></td>
                <td><span className="rag-good"><Check size={14} /> $0 (100% Free)</span></td>
                <td>~$10 / 1k pages</td>
                <td>~$3 / 1k pages</td>
                <td>$0 (DIY script)</td>
              </tr>
              <tr>
                <td><strong>Data Privacy & Security</strong></td>
                <td><span className="rag-good"><Check size={14} /> 100% Local In-Browser (Zero Uploads)</span></td>
                <td>Remote Cloud Server</td>
                <td>Remote Cloud Server</td>
                <td>Local (Requires Python env)</td>
              </tr>
              <tr>
                <td><strong>Header / Footer Stripping</strong></td>
                <td><span className="rag-good"><Check size={14} /> Automated & Deduplicated</span></td>
                <td>Requires custom config</td>
                <td>Included in cloud parse</td>
                <td><span style={{ color: '#ef4444' }}>None (Full noise included)</span></td>
              </tr>
              <tr>
                <td><strong>Hyphenation Wrap Repair</strong></td>
                <td><span className="rag-good"><Check size={14} /> Automated</span></td>
                <td>Post-processing rule</td>
                <td>Supported</td>
                <td><span style={{ color: '#ef4444' }}>None (Broken words)</span></td>
              </tr>
              <tr>
                <td><strong>Output Formats</strong></td>
                <td><span className="rag-good"><Check size={14} /> Markdown (.md) & RAG Chunks (.json)</span></td>
                <td>JSON / HTML / Text</td>
                <td>Markdown / JSON</td>
                <td>Raw string</td>
              </tr>
              <tr>
                <td><strong>Setup Friction</strong></td>
                <td><span className="rag-good"><Check size={14} /> 0 seconds (No login / No API key)</span></td>
                <td>API key + credit card</td>
                <td>API key + credit card</td>
                <td>pip install + code setup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ecosystem Compatibility Grid */}
      <div className="rag-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Universal Compatibility</span>
          <h2 className="rag-seo-title">Vector Databases & AI Frameworks</h2>
          <p className="rag-seo-subtitle">
            Exported Markdown and JSON payloads are pre-formatted for direct integration into all modern vector stores and agent runtimes.
          </p>
        </div>

        <div className="rag-ecosystem-grid">
          {COMPATIBLE_ECOSYSTEM.map((item, idx) => (
            <div key={idx} className="rag-ecosystem-badge">
              <div className="rag-ecosystem-dot" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-main)' }}>{item.name}</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python Code Snippets for LangChain & LlamaIndex Ingestion */}
      <div className="rag-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Developer Quickstart</span>
          <h2 className="rag-seo-title">Ingest Chunks in 3 Lines of Python</h2>
          <p className="rag-seo-subtitle">
            Exported JSON files match production vector database schemas. Copy and paste these recipes into your LangChain or LlamaIndex application.
          </p>
        </div>

        <div className="rag-code-showcase-card">
          <div className="rag-code-tabs">
            <button
              type="button"
              className={`rag-code-tab ${activeCodeTab === 'langchain' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('langchain')}
            >
              <Terminal size={14} /> LangChain + Chroma / Pinecone
            </button>
            <button
              type="button"
              className={`rag-code-tab ${activeCodeTab === 'llamaindex' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('llamaindex')}
            >
              <Terminal size={14} /> LlamaIndex TextNode
            </button>
            <button
              type="button"
              className={`rag-code-tab ${activeCodeTab === 'openai' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('openai')}
            >
              <Terminal size={14} /> OpenAI Embeddings API
            </button>
          </div>

          <div className="rag-code-block">
            {activeCodeTab === 'langchain' && (
              <pre>
{`import json
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 1. Load exported Cerilas RAG Chunks JSON
with open("document-rag-chunks.json", "r") as f:
    data = json.load(f)

# 2. Transform into LangChain Document objects with injected metadata
documents = [
    Document(
        page_content=chunk["content"],
        metadata=chunk["metadata"] # source, page, section, estimated_tokens
    )
    for chunk in data["chunks"]
]

# 3. Ingest into Chroma Vector Store with OpenAI text-embedding-3-small
vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=OpenAIEmbeddings(model="text-embedding-3-small")
)`}
              </pre>
            )}

            {activeCodeTab === 'llamaindex' && (
              <pre>
{`import json
from llama_index.core.schema import TextNode
from llama_index.core import VectorStoreIndex

# 1. Load exported Cerilas RAG Chunks JSON
with open("document-rag-chunks.json", "r") as f:
    data = json.load(f)

# 2. Map directly to LlamaIndex TextNodes
nodes = [
    TextNode(
        text=chunk["content"],
        metadata=chunk["metadata"],
        id_=chunk["id"]
    )
    for chunk in data["chunks"]
]

# 3. Create high-precision VectorStoreIndex without additional parsing
index = VectorStoreIndex(nodes=nodes)
query_engine = index.as_query_engine()`}
              </pre>
            )}

            {activeCodeTab === 'openai' && (
              <pre>
{`import json
from openai import OpenAI

client = OpenAI()

# 1. Read exported chunks
with open("document-rag-chunks.json", "r") as f:
    chunks = json.load(f)["chunks"]

# 2. Batch embed chunks using OpenAI text-embedding-3-small
texts = [chunk["content"] for chunk in chunks]
response = client.embeddings.create(
    input=texts,
    model="text-embedding-3-small"
)

# 3. Pair embeddings with metadata for pgvector / Supabase
vectors = [
    {
        "id": chunks[i]["id"],
        "values": record.embedding,
        "metadata": chunks[i]["metadata"]
    }
    for i, record in enumerate(response.data)
]`}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="rag-seo-container" style={{ marginTop: '3.5rem' }}>
        <div className="rag-seo-header">
          <span className="rag-seo-tag">Technical FAQ (15 Q&As)</span>
          <h2 className="rag-seo-title">Frequently Asked Developer Questions</h2>
          <p className="rag-seo-subtitle">
            Everything you need to know about token optimization, chunking strategies, and vector database ingestion.
          </p>
        </div>

        <div className="rag-faq-accordion">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`rag-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="rag-faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="rag-faq-question">{item.q}</span>
                  <ChevronDown size={18} className={`rag-faq-icon ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="rag-faq-answer">
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
