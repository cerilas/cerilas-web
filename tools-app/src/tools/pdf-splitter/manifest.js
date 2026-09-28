export const pdfSplitterManifest = {
  slug: 'pdf-splitter',
  title: 'PDF Splitter',
  shortDescription: 'Split PDF documents into custom page ranges, extract specific pages, or separate every page into individual files with 100% in-browser client-side privacy.',
  category: 'Document Utility',
  iconName: 'Scissors',
  badge: '100% Private',
  targetUrl: '#/tool/pdf-splitter',
  seoTitle: 'Split PDF Online Free – Extract Pages & Split into Custom Ranges | Cerilas Tools',
  seoDescription: 'Split PDF files online for free with 100% in-browser privacy. Extract specific pages, divide into custom page ranges, or separate every page into individual PDF files with zero server uploads.',
  features: [
    '100% Client-Side Privacy: Your PDF is split entirely inside your browser and never uploaded to remote servers',
    'Custom Range & Multi-Part Splitting: Divide into multiple custom parts with exact page ranges (e.g. Part 1: 1-3, Part 2: 4-6, 8)',
    'Visual Page Thumbnail Grid: Click and select individual pages directly with live high-resolution page previews',
    'Extract All Pages: Turn an N-page PDF into N separate 1-page PDF documents with 1-click ZIP bundle export',
    'Interval Splitting: Automatically split documents every N pages (e.g. every 2 pages, every 5 pages)',
    'Zero File Limits: No registration required, no daily caps, and no watermark added'
  ],
  seo: {
    title: "Free PDF Splitter – Extract & Split PDF Pages | Cerilas Tools",
    description: "Split PDF files into individual pages or custom page ranges for free. Preview pages visually and export individual PDFs or a ZIP archive with 100% privacy.",
    keywords: "pdf splitter, split pdf online free, extract pdf pages, separate pdf files, split pdf into single pages, private pdf splitter, pdf page extractor",
    ogImage: 'https://tools.cerilas.com/tool-icons/pdf-splitter.webp',
    ogImageAlt: "Free PDF Splitter – Extract & Split PDF Pages | Cerilas Tools",
    breadcrumbsName: "PDF Splitter",
    faq: [
        {
            "q": "Can I extract custom non-consecutive page ranges (e.g. 1, 4-6, 12)?",
            "a": "Yes. You can enter comma-separated ranges or simply click individual page thumbnails in the visual workspace to select pages for extraction."
        },
        {
            "q": "Can I split every page into its own individual PDF file?",
            "a": "Yes. Choose \"Split All Pages\" to generate individual single-page PDFs packaged inside a convenient downloadable ZIP file."
        },
        {
            "q": "Does extracting pages reduce visual quality or font sharpness?",
            "a": "No. The underlying vector graphics, embedded typography, and original resolutions remain identical to the source document."
        },
        {
            "q": "Is my document uploaded to a remote server during the split process?",
            "a": "No. The entire extraction and file generation process takes place locally inside your browser memory with complete privacy."
        }
    ]
  }
};
