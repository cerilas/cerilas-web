export const pdfCompressorManifest = {
  slug: 'pdf-compressor',
  title: 'PDF Compressor',
  shortDescription: 'Compress PDF files locally in your browser with zero server uploads. Multi-level compression presets, instant visual thumbnail previews, and batch ZIP export.',
  category: 'Document Utility',
  iconName: 'FileText',
  badge: '100% Private',
  targetUrl: '#/tool/pdf-compressor',
  seoTitle: 'Compress PDF Online Free – Reduce PDF Size in MB & KB (100KB, 200KB, 1MB) | Cerilas Tools',
  seoDescription: 'Compress PDF files online with 100% in-browser privacy. Reduce PDF size in MB & KB to meet strict email, job portal, and government limits (under 200KB, 500KB, 1MB) with zero server uploads.',
  features: [
    '100% Client-Side Privacy: Files never leave your device or touch any cloud server',
    'Multiple Compression Presets: Extreme (<1MB/200KB), Balanced, High Quality, and Structural Lossless',
    'Instant Page 1 Thumbnail: Visual document preview before and after compression',
    'Batch Processing: Compress multiple PDFs simultaneously with 1-click ZIP export',
    'Zero File Limits: No registration, no daily quota, and zero file size restrictions'
  ],
  seo: {
    title: "Free PDF Compressor Online (100% In-Browser) | Cerilas Tools",
    description: "Compress PDF documents locally in your browser with zero server uploads. Reduce file size for email and portals while keeping text sharp and readable.",
    keywords: "pdf compressor, compress pdf online, reduce pdf size, shrink pdf for email, compress pdf to 200kb, private pdf compressor, client side pdf compression",
    ogImage: 'https://tools.cerilas.com/tool-icons/pdf-compressor.webp',
    ogImageAlt: "Free PDF Compressor Online (100% In-Browser) | Cerilas Tools",
    breadcrumbsName: "PDF Compressor",
    faq: [
        {
            "q": "Is it safe to compress confidential legal or tax PDFs here?",
            "a": "Yes. Processing occurs 100% locally in your browser memory via WebAssembly and PDF.js. We never receive, upload, or store your documents."
        },
        {
            "q": "Will vector text and typography become blurry after compression?",
            "a": "No. True vector text, fonts, and form fields remain intact and mathematically sharp; only oversized embedded raster photographs are optimized."
        },
        {
            "q": "What compression presets are available?",
            "a": "Choose between Maximum Compression (ideal for strict 2MB email limits), Balanced (recommended for digital reading), and High Quality (for crisp printing)."
        },
        {
            "q": "Is there a document page count or file size restriction?",
            "a": "There are no arbitrary cloud limits. You can compress multi-hundred-page documents as long as your device has sufficient RAM."
        }
    ]
  }
};
