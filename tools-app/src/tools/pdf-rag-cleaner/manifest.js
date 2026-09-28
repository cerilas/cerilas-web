export const pdfRagCleanerManifest = {
  slug: 'pdf-rag-cleaner',
  title: 'PDF → RAG Cleaner',
  shortDescription: 'Transform raw, messy PDFs into clean Markdown, structured JSON chunks, and rich metadata ready for LangChain, LlamaIndex, OpenAI, and vector database embeddings.',
  category: 'AI Assisted',
  iconName: 'Database',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/pdf-rag-cleaner',
  features: [
    'Header & Footer Elimination: Automatically strips running page headers, footers, and page numbers across pages',
    'Hyphenation & Wrap Repair: Fixes line-split words (e.g. transfor- mation) and awkward PDF line breaks',
    'Semantic Markdown Synthesis: Detects headings (#, ##, ###) and lists from visual font sizing',
    'Configurable RAG Chunking: Split by Semantic Headings, Token Sliding Window (250t, 500t, 1000t), or Page-by-Page',
    'Rich Vector Metadata: Injects page numbers, section titles, character counts, and estimated LLM tokens into each JSON chunk',
    '100% In-Browser Deterministic Engine: Process confidential documents privately on your device without server uploads',
    'Optional Neural AI Deep Clean: 1-click Gemini Flash model polish for heavily corrupted multi-column research papers and tables',
    'Developer-Ready Export: Download clean .md (Markdown), .json (LangChain / LlamaIndex format), or copy directly to clipboard'
  ],
  seo: {
    title: "PDF to Clean Markdown & RAG Chunks Generator | Cerilas Tools",
    description: "Convert messy PDFs into clean Markdown and semantic RAG chunks for LangChain, LlamaIndex, and vector databases. Strips headers, footers, and page numbers.",
    keywords: "pdf to rag cleaner, rag chunking tool, pdf to markdown for llm, clean pdf for vector database, langchain pdf cleaner, llamaindex chunker, embedding preprocessor",
    ogImage: 'https://tools.cerilas.com/tool-icons/pdf-rag-cleaner.webp',
    ogImageAlt: "PDF to Clean Markdown & RAG Chunks Generator | Cerilas Tools",
    breadcrumbsName: "PDF to RAG Cleaner",
    faq: [
        {
            "q": "Why should I clean PDFs before generating vector embeddings for RAG?",
            "a": "Raw PDFs contain repeated running headers, footers, hyphenated broken words, and page numbers that pollute vector embeddings and cause hallucinations during retrieval."
        },
        {
            "q": "What chunking strategies and token overlaps are available?",
            "a": "Select from Token-based sliding window (128-1024 tokens), recursive character chunking, or semantic header splitting with customizable token overlap."
        },
        {
            "q": "Which vector databases and frameworks are directly supported?",
            "a": "Exports clean JSON, JSONL, and Markdown compatible with LangChain, LlamaIndex, Pinecone, Chroma, Qdrant, Weaviate, and Milvus."
        },
        {
            "q": "Does this tool preserve Markdown tables and code snippets?",
            "a": "Yes. Table structures are extracted and formatted as standard GitHub-flavored Markdown tables, maintaining column relationships for retrieval."
        }
    ]
  }
};
