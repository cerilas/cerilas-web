export const backgroundRemoverManifest = {
  slug: 'background-remover',
  title: 'Background Remover',
  shortDescription: '100% free in-browser AI background remover. Cut out portraits, products, and logos instantly with zero server uploads and transparent HD PNG export.',
  category: 'Optimizer',
  iconName: 'Sparkles',
  badge: 'AI Powered',
  isAi: true,
  targetUrl: '#/tool/background-remover',
  features: [
    '100% Client-Side Neural AI: Segmentation executes locally in browser memory without sending files to any server',
    'High-Precision Edge Detection: Preserves delicate hair strands, product silhouettes, and transparent boundaries',
    'Interactive Split Slider: Compare original and cutout states in real-time',
    'Custom Background Replacements: Switch instantly between Transparent, Pure White (#FFF), Studio Gradients, or Custom Images',
    'E-Commerce Optimized: Instantly produce marketplace-ready white backgrounds for Amazon, eBay, Shopify, and Etsy',
    'Lossless HD PNG & WebP Export: One-click download with zero compression artifacts or forced watermarks',
    'Direct Clipboard Copy: Paste transparent cutouts straight into Figma, Photoshop, Canva, or Slack'
  ],
  seo: {
    title: "Free AI Background Remover (HD Transparent PNG) | Cerilas Tools",
    description: "Remove image backgrounds online with zero server uploads. 100% private in-browser AI cutout for portraits, e-commerce products, and graphics. Instant PNG.",
    keywords: "background remover, remove bg free, transparent png maker, in-browser ai cutout, product background remover, portrait cutout, remove photo background",
    ogImage: 'https://tools.cerilas.com/tool-icons/background-remover.webp',
    ogImageAlt: "Free AI Background Remover (HD Transparent PNG) | Cerilas Tools",
    breadcrumbsName: "AI Background Remover",
    faq: [
        {
            "q": "Why is client-side background removal safer than cloud services?",
            "a": "Complete confidentiality: private personal photos and proprietary product prototypes remain strictly on your machine, with zero risk of cloud leaks or training usage."
        },
        {
            "q": "Can I export transparent PNGs in full original resolution?",
            "a": "Yes, downloads retain original image dimensions and aspect ratios without forced downscaling or annoying watermarks."
        },
        {
            "q": "Does the AI model accurately preserve fine hair and complex borders?",
            "a": "Yes. The segmentation model uses sub-pixel edge feathering and alpha matte prediction to isolate fine hair, fur, and intricate product edges cleanly."
        },
        {
            "q": "Is this tool completely free to use without subscriptions?",
            "a": "Yes. Because processing runs on your own device hardware rather than expensive cloud GPUs, there are no subscriptions or paywalls."
        }
    ]
  }
};
