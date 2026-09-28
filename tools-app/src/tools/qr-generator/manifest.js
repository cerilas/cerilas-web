export const qrGeneratorManifest = {
  slug: 'qr-code-generator',
  title: 'QR Code Generator',
  shortDescription: 'Generate high-resolution custom QR codes for URLs, text, Wi-Fi, vCard, and email with sleek Apple styling.',
  category: 'Generator',
  icon: 'QrCode',
  version: '1.0.0',
  author: 'Cerilas High Tech',
  features: [
    '5 Data Formats (URL, Plain Text, Wi-Fi, vCard, Email)',
    'Curated Apple Color Palettes & Background Options',
    'High-Resolution PNG and Scalable Vector SVG Export',
    'Direct Clipboard Copy (Figma, Photoshop, Slack Ready)',
    'Error Correction Level (L/M/Q/H) & Margin Adjustments'
  ],
  seo: {
    title: "Free QR Code Generator That Never Expires | Cerilas Tools",
    description: "Free permanent QR code generator with no expiration and unlimited lifetime scans. Download print-ready vector SVG and HD PNG for URLs, Wi-Fi, and vCards.",
    keywords: "free qr code generator, qr code generator no sign up, permanent qr code, vector svg qr code, wifi qr code generator, vcard qr code, commercial qr code",
    ogImage: 'https://tools.cerilas.com/tool-icons/qr-code-generator.webp',
    ogImageAlt: "Free QR Code Generator That Never Expires | Cerilas Tools",
    breadcrumbsName: "QR Code Generator",
    faq: [
        {
            "q": "Will my generated QR code ever expire or require payment later?",
            "a": "No. Unlike predatory services that route scans through expiring redirect URLs, our tool generates pure static QR codes where destination data is encoded directly into the pattern. They work forever."
        },
        {
            "q": "Can I use the generated QR codes for commercial print products?",
            "a": "Yes. Download the vector SVG format for infinite lossless scaling at any print resolution (300+ DPI billboards, product packaging, book covers, restaurant menus)."
        },
        {
            "q": "Is my input data stored on your servers?",
            "a": "Zero data is sent to any server. All encoding and rendering takes place inside your local browser memory for complete personal and corporate privacy."
        },
        {
            "q": "What is the difference between static and dynamic QR codes?",
            "a": "Static QR codes embed information directly into the matrix, requiring no servers, no subscriptions, and never expiring. Dynamic codes route through a third-party server that can be shut down or billed monthly."
        }
    ]
  }
};
