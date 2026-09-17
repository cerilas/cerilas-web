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
    title: 'Free PDF to RAG Cleaner & Markdown Converter (2026) – Clean Chunks for LangChain, LlamaIndex & Vector DBs | Cerilas Tools',
    description: 'Convert messy PDFs into clean Markdown and structured RAG JSON chunks with metadata for LLM vector embeddings. Strips headers/footers, repairs hyphenation, and estimates tokens 100% in-browser with zero uploads.',
    keywords: 'pdf to rag cleaner, pdf to rag converter, clean pdf for rag, pdf to markdown rag, pdf chunking for rag, langchain pdf cleaner, llamaindex pdf parser, clean pdf for embeddings, pdf to json chunks, vector database pdf converter, private pdf rag extractor, text embedding 3 small chunker, pinecone pdf chunking, pgvector document ingestion, weaviate pdf loader, chroma vector store pdf, financial 10k pdf rag cleaner, arxiv pdf to markdown rag, parent document retriever pdf, strip headers footers pdf rag, llama parse alternative free, unstructured io alternative free, haystack pdf converter, dify pdf knowledge base, auto gen knowledge ingestion',
    ogImage: 'https://tools.cerilas.com/og-image.svg',
    ogImageAlt: 'Cerilas Free PDF to RAG Cleaner & Markdown Converter',
    breadcrumbsName: 'PDF to RAG Cleaner'
  }
};
