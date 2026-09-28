export const googleMarketingMcpManifest = {
  slug: 'google-marketing-mcp',
  title: 'Connect ChatGPT to Google Analytics & Search Console (MCP Server)',
  shortDescription: 'Connect your ChatGPT, Claude Desktop, or Cursor directly to Google Analytics 4 (GA4), Search Console, and Google Ads via Model Context Protocol (MCP). Talk to your traffic, queries, conversions, and ad spend in plain English with 100% read-only OAuth.',
  category: 'AI Assisted',
  iconName: 'Database',
  badge: 'AI / MCP Server',
  isAi: true,
  targetUrl: '#/tool/google-marketing-mcp',
  features: [
    'Connect Your ChatGPT to Google Analytics & Search Console: Ask ChatGPT questions about real-time traffic, top landing pages, and search queries with 0 CSV exports',
    'Universal Model Context Protocol (MCP) Bridge: Seamless connection to Claude Desktop, Cursor, Windsurf, Antigravity, and custom agentic runtimes',
    'ChatGPT Native MCP & Custom Actions: Connect via ChatGPT Developer / Connected Apps (SSE) or import the OpenAPI 3.1 schema for GPT Store assistants',
    'Google Search Console Real-Time Telemetry: Inspect query clicks, impressions, CTR, average position, and URL indexing status without exporting CSVs',
    'Google Analytics 4 (GA4) Query Engine: Access real-time active users, acquisition channels, page conversions, and engagement metrics via conversational AI',
    'Google Ads Intelligence: Audit wasted search term budgets, campaign ROAS, cost-per-click (CPC), and keyword performance inside your chat prompt',
    '100% Read-Only OAuth Security: Strict read-only API scopes with AES-256 encrypted refresh tokens and instant one-click credential revocation',
    'Remote SSE & Local NPX Transport: Supports both serverless cloud SSE streaming (no local runtime needed) and local `npx` stdio execution',
    'Interactive In-Browser Query Playground: Test real-time MCP prompts and view live simulated tool calls and structured analytical reports'
  ],
  seo: {
    title: "Connect ChatGPT to Google Analytics & Console | Cerilas Tools",
    description: "Connect ChatGPT to Google Analytics 4 and Search Console in 60s via MCP. Query real-time traffic, keywords, and conversions with 100% read-only OAuth.",
    keywords: "connect your chatgpt to google analytics, connect chatgpt to google analytics, chatgpt google analytics 4 integration, connect chatgpt to google search console, google analytics mcp server, model context protocol marketing",
    ogImage: 'https://tools.cerilas.com/tool-icons/google-marketing-mcp.webp',
    ogImageAlt: "Connect ChatGPT to Google Analytics & Console | Cerilas Tools",
    breadcrumbsName: "Connect ChatGPT to Google Analytics & Search Console",
    faq: [
        {
            "q": "How do I connect my ChatGPT to Google Analytics and Search Console?",
            "a": "Sign in with your Google account on Cerilas Tools, copy the generated MCP prompt, and paste it into ChatGPT, Claude Desktop, or Cursor. The AI connects automatically."
        },
        {
            "q": "Can ChatGPT analyze both GA4 and Search Console together?",
            "a": "Yes. It cross-references impressions and CTR from Search Console with user sessions and conversion events from Google Analytics 4 in a single conversation."
        },
        {
            "q": "How is this different from uploading CSV exports to ChatGPT?",
            "a": "Unlike static CSVs, the MCP connection queries live, real-time Google APIs on demand with zero manual file downloading or token limits."
        },
        {
            "q": "Is my Google Analytics data used to train public AI models?",
            "a": "No. Queries run through your private read-only API credentials and are never retained for model training by Cerilas."
        },
        {
            "q": "Can ChatGPT accidentally edit or delete my analytics data?",
            "a": "No. The connection utilizes strictly read-only OAuth scopes (analytics.readonly and webmasters.readonly), making accidental modifications impossible."
        },
        {
            "q": "Which AI assistants support Model Context Protocol (MCP)?",
            "a": "Claude Desktop, Cursor IDE, Windsurf, ChatGPT (via Custom Actions or MCP bridges), and local open-source LLM agents."
        }
    ]
  }
};
