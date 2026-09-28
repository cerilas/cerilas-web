export const jsonBeautifierManifest = {
  slug: 'json-beautifier',
  title: 'JSON Beautifier & Formatter',
  short_description: 'Format, beautify, validate, minify, and repair JSON in your browser. Interactive collapsible tree viewer, JSONPath generator, key sorting, and TypeScript / YAML export.',
  shortDescription: 'Format, beautify, validate, minify, and repair JSON in your browser. Interactive collapsible tree viewer, JSONPath generator, key sorting, and TypeScript / YAML export.',
  description: '100% free online JSON Beautifier, Formatter, Validator and Minifier. Instant syntax auto-repair for broken JSON, recursive key sorting, interactive tree inspector with click-to-copy JSONPath, and 1-click conversion to TypeScript interfaces, YAML, and CSV.',
  category: 'Developer Tool',
  icon_name: 'Braces',
  iconName: 'Braces',
  badge: 'Formatter & Tree',
  targetUrl: '#/tool/json-beautifier',
  seoTitle: 'Free Online JSON Beautifier, Formatter & Validator (2026) | Cerilas Tools',
  seoDescription: 'Format, beautify, minify, and validate JSON online for free. Auto-repair malformed JSON, interactive tree viewer, copy JSONPath, sort keys, and convert JSON to TypeScript, YAML, or CSV with 100% in-browser privacy.',
  features: [
    'Prettify & Beautify: Configurable indentation with 2 spaces, 4 spaces, or Tabs',
    'Minify & Compact: Strip all whitespace and line breaks for maximum payload compression',
    'Smart Auto-Repair: Fix unquoted keys, single quotes, trailing commas, and Python literals',
    'Sort Object Keys: Alphabetically order object keys (A-Z) for clean diffs and determinism',
    'Interactive Tree Inspector: Collapsible nodes, type indicators, and click-to-copy JSONPath',
    'Multi-Format Conversion: 1-click export to TypeScript Interfaces, YAML, and CSV',
    'Detailed Statistics: Live byte count, compression percentage, max nesting depth, and node count',
    '100% Private & In-Browser: Files and payloads never touch external servers (GDPR safe)'
  ],
  keywords: [
    'json beautifier',
    'json formatter',
    'json validator',
    'json minifier',
    'repair broken json',
    'json to typescript',
    'json to yaml',
    'json tree viewer',
    'pretty print json online'
  ],
  seo: {
    title: "Free JSON Beautifier, Formatter & Validator | Cerilas Tools",
    description: "Format, beautify, validate, minify, and repair JSON in your browser. Features collapsible tree viewer, JSONPath generator, and instant TypeScript export.",
    keywords: "json beautifier, json formatter, validate json, json to typescript, format json online, json tree viewer, json repair online, jsonpath tester",
    ogImage: 'https://tools.cerilas.com/tool-icons/json-beautifier.webp',
    ogImageAlt: "Free JSON Beautifier, Formatter & Validator | Cerilas Tools",
    breadcrumbsName: "JSON Beautifier",
    faq: [
        {
            "q": "Can this tool repair malformed JSON with missing quotes or trailing commas?",
            "a": "Yes. The built-in JSON repair engine automatically fixes common syntax mistakes like unquoted keys, single quotes, trailing commas, and escaped characters."
        },
        {
            "q": "How does the TypeScript interface generator work?",
            "a": "It recursively inspects JSON objects and primitive arrays to infer strong TypeScript type definitions, marking nullable fields and optional properties."
        },
        {
            "q": "Can I query deeply nested objects using JSONPath?",
            "a": "Yes. Use the interactive JSONPath search bar to filter, slice, and extract specific nested attributes across complex JSON payloads."
        },
        {
            "q": "Are large JSON payloads processed locally in my browser?",
            "a": "Yes. All parsing, validation, and tree rendering takes place 100% locally in your browser memory for complete data privacy."
        }
    ]
  }
};
