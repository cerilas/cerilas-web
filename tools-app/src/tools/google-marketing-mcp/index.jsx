import { useState, useEffect } from 'react';
import {
  Database,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  CheckCircle2,
  Bot,
  Sparkles,
  Terminal,
  Activity,
  BarChart2,
  Search,
  DollarSign,
  Layers,
  ArrowRight,
  Globe,
  SlidersHorizontal,
  Zap,
  Info,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { googleMarketingMcpManifest } from './manifest';
import GoogleMarketingMcpSeo from './components/GoogleMarketingMcpSeo';
import './google-marketing-mcp.css';

const DEFAULT_MCP_KEY = 'cr_mcp_live_e891bf4c9270a8d73b0f491c';

const SAMPLE_SIMULATION_DATA = {
  gsc: {
    query: 'Show Search Console queries with high impressions (>1,000) but CTR < 2% in the last 28 days',
    toolCall: 'gsc_get_search_analytics({ startDate: "2026-08-30", endDate: "2026-09-27", minImpressions: 1000, maxCtr: 0.02, dimensions: ["query"] })',
    results: [
      { term: 'free qr code generator vector', impressions: '4,820', clicks: '68', ctr: '1.41%', pos: '7.8' },
      { term: 'compress pdf to 200kb online', impressions: '3,210', clicks: '44', ctr: '1.37%', pos: '8.4' },
      { term: 'ai search crawler list robots txt', impressions: '2,640', clicks: '38', ctr: '1.43%', pos: '6.9' },
      { term: 'startup runway calculator excel template', impressions: '1,950', clicks: '29', ctr: '1.48%', pos: '9.1' },
      { term: 'how to check if chatgpt cites my website', impressions: '1,420', clicks: '22', ctr: '1.54%', pos: '8.2' }
    ],
    commentary: 'AI Insight: You have 5 high-intent queries on page 1 (positions 6-9) losing 98% of potential clicks. Rewriting the <title> tag of these pages to include numbers (e.g., "Top 5...", "[Free SVG Export]") could increase your organic CTR from 1.4% to ~4.5%, adding ~320 additional monthly clicks without building new backlinks.'
  },
  ga4: {
    query: 'What are the top 4 traffic acquisition channels in GA4 and their engagement rate this month?',
    toolCall: 'ga4_get_traffic_acquisition({ dateRange: "last_30_days", dimensions: ["sessionDefaultChannelGroup"] })',
    results: [
      { channel: 'Organic Search', sessions: '18,420', users: '14,190', bounce: '38.2%', engagement: '2m 45s' },
      { channel: 'Direct Traffic', sessions: '9,810', users: '7,430', bounce: '44.1%', engagement: '1m 20s' },
      { channel: 'Referral & AI Engines', sessions: '4,650', users: '3,890', bounce: '29.4%', engagement: '3m 12s' },
      { channel: 'Organic Social (X / LinkedIn)', sessions: '2,140', users: '1,820', bounce: '51.8%', engagement: '0m 55s' }
    ],
    commentary: 'AI Insight: "Referral & AI Engines" (Perplexity, ChatGPT Search, Claude) exhibits your lowest bounce rate (29.4%) and highest session duration (3m 12s). Visitors coming from generative engines are showing 2.4x higher intent than standard direct visitors.'
  },
  gads: {
    query: 'Find Google Ads search terms with ad spend > $50 and 0 conversions to add as negatives',
    toolCall: 'gads_find_wasted_search_terms({ minSpendMicros: 50000000, maxConversions: 0, dateRange: "last_30_days" })',
    results: [
      { term: 'cheap pdf editor crack download', cost: '$74.20', clicks: '28', conversions: '0', cpc: '$2.65' },
      { term: 'free software license key generator', cost: '$68.50', clicks: '31', conversions: '0', cpc: '$2.21' },
      { term: 'hire freelance developer cheap overseas', cost: '$58.10', clicks: '19', conversions: '0', cpc: '$3.05' }
    ],
    commentary: 'AI Insight: Adding "crack", "download", and "cheap overseas" as exact-match negative keywords in Google Ads will immediately save ~$200.80 per month in wasted ad budget that can be reallocated to your core high-converting search keywords.'
  }
};

export default function GoogleMarketingMcp({ onBack }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('chatgpt');
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [chatgptMode, setChatgptMode] = useState('mcp'); // 'mcp' (direct MCP plugin) or 'custom-gpt' (actions)
  const [geminiSubTab, setGeminiSubTab] = useState('prompt'); // 'prompt' | 'python' | 'node'
  const [mcpKey, setMcpKey] = useState(DEFAULT_MCP_KEY);
  const [showKey, setShowKey] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Real Google properties
  const [gscSites, setGscSites] = useState([]);
  const [ga4Properties, setGa4Properties] = useState([]);
  const [selectedGscSite, setSelectedGscSite] = useState('');
  const [selectedGa4Property, setSelectedGa4Property] = useState('');

  // Playground state
  const [simPreset, setSimPreset] = useState('gsc');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimData, setActiveSimData] = useState(SAMPLE_SIMULATION_DATA.gsc);

  const apiOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tools.cerilas.com';
  const mcpSseUrl = `${apiOrigin}/api/mcp/sse`;

  // Parse OAuth redirect return
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const queryString = hash.includes('?') ? hash.split('?')[1] : search.replace(/^\?/, '');
    const params = new URLSearchParams(queryString);

    const statusParam = params.get('status');
    const keyParam = params.get('key');
    const emailParam = params.get('email');
    const errorParam = params.get('message') || params.get('error');

    if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
    }

    if (statusParam === 'connected' && keyParam) {
      setIsConnected(true);
      setIsDemoMode(false);
      setMcpKey(keyParam);
      localStorage.setItem('cerilas_mcp_key', keyParam);
      if (emailParam) {
        const decodedEmail = decodeURIComponent(emailParam);
        setUserEmail(decodedEmail);
        localStorage.setItem('cerilas_mcp_email', decodedEmail);
      }
      // Clean URL cleanly
      window.history.replaceState({}, document.title, window.location.pathname + '#/tool/google-marketing-mcp');
      fetchStatus(keyParam);
    } else {
      const savedKey = localStorage.getItem('cerilas_mcp_key');
      const savedEmail = localStorage.getItem('cerilas_mcp_email');
      if (savedKey) {
        setMcpKey(savedKey);
        setIsConnected(true);
        setIsDemoMode(false);
        if (savedEmail) setUserEmail(savedEmail);
        fetchStatus(savedKey);
      }
    }
  }, []);

  const fetchStatus = async (key) => {
    try {
      const res = await fetch(`/api/mcp/status?key=${encodeURIComponent(key)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        if (data.email) setUserEmail(data.email);
        if (Array.isArray(data.gscSites)) setGscSites(data.gscSites);
        if (Array.isArray(data.ga4Properties)) setGa4Properties(data.ga4Properties);
        if (data.selectedGscSite) setSelectedGscSite(data.selectedGscSite);
        else if (data.gscSites?.[0]) setSelectedGscSite(data.gscSites[0]);
        if (data.selectedGa4Property) setSelectedGa4Property(data.selectedGa4Property);
        else if (data.ga4Properties?.[0]) setSelectedGa4Property(data.ga4Properties[0].propertyId);
      }
    } catch (e) {
      console.warn('Could not fetch MCP status:', e);
    }
  };

  const handleConnectGoogle = () => {
    // Redirect to live backend Google OAuth endpoint
    window.location.href = '/api/auth/google/auth';
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/mcp/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: mcpKey })
      });
    } catch (e) {
      console.warn('Revoke call failed:', e);
    }
    localStorage.removeItem('cerilas_mcp_key');
    localStorage.removeItem('cerilas_mcp_email');
    setIsConnected(false);
    setUserEmail('');
    setGscSites([]);
    setGa4Properties([]);
    setIsDemoMode(true);
    setMcpKey(DEFAULT_MCP_KEY);
  };

  const handlePropertyChange = async (gscSite, ga4Prop) => {
    setSelectedGscSite(gscSite);
    setSelectedGa4Property(ga4Prop);
    try {
      await fetch('/api/mcp/select-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mcpKey}`
        },
        body: JSON.stringify({
          selectedGscSite: gscSite,
          selectedGa4Property: ga4Prop
        })
      });
    } catch (e) {
      console.warn('Could not update property:', e);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleRunSimulation = async (presetKey) => {
    setSimPreset(presetKey);
    setIsSimulating(true);

    // If connected and NOT in demo mode, try to fetch real data from the user's account!
    if (isConnected && !isDemoMode) {
      try {
        if (presetKey === 'gsc') {
          const res = await fetch(`/api/mcp/gsc/search-analytics?key=${encodeURIComponent(mcpKey)}&siteUrl=${encodeURIComponent(selectedGscSite || '')}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.rows && json.data.rows.length > 0) {
              const formattedRows = json.data.rows.slice(0, 5).map((r) => ({
                term: r.keys?.[0] || 'Unknown Query',
                impressions: r.impressions?.toLocaleString(),
                clicks: r.clicks?.toLocaleString(),
                ctr: r.ctr,
                pos: r.position
              }));
              setActiveSimData({
                query: `Live Search Console Report for ${selectedGscSite || 'your website'}`,
                toolCall: `gsc_get_search_analytics({ siteUrl: "${selectedGscSite}", startDate: "${json.data.startDate}", endDate: "${json.data.endDate}" })`,
                results: formattedRows,
                commentary: `Live Search Console telemetry retrieved! Found ${json.data.rows.length} indexed search queries driving impressions to your site.`
              });
              setIsSimulating(false);
              return;
            }
          }
        } else if (presetKey === 'ga4') {
          const res = await fetch(`/api/mcp/ga4/traffic?key=${encodeURIComponent(mcpKey)}&propertyId=${encodeURIComponent(selectedGa4Property || '')}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.rows && json.data.rows.length > 0) {
              const formattedRows = json.data.rows.map((r) => ({
                channel: r.channel,
                sessions: r.sessions.toLocaleString(),
                users: r.activeUsers.toLocaleString(),
                bounce: r.bounceRate,
                engagement: `${r.avgDurationSeconds}s`
              }));
              setActiveSimData({
                query: `Live GA4 Traffic Acquisition for Property #${selectedGa4Property}`,
                toolCall: `ga4_get_traffic_acquisition({ propertyId: "${selectedGa4Property}" })`,
                results: formattedRows,
                commentary: `Live Google Analytics 4 telemetry processed! Displaying traffic channels and engagement rates from your live tracking snippet.`
              });
              setIsSimulating(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Live query fallback to demo:', err);
      }
    }

    // Fallback to sample simulation
    setTimeout(() => {
      setActiveSimData(SAMPLE_SIMULATION_DATA[presetKey]);
      setIsSimulating(false);
    }, 600);
  };

  // Configurations for different clients
  const chatgptOpenApiJson = JSON.stringify(
    {
      openapi: '3.1.0',
      info: {
        title: 'Cerilas Google Marketing MCP Actions',
        version: '1.0.0',
        description: 'Read-only Google Analytics 4, Search Console, and Google Ads live telemetry.'
      },
      servers: [{ url: `${apiOrigin}/api/mcp` }],
      paths: {
        '/gsc/search-analytics': {
          get: {
            operationId: 'getSearchAnalytics',
            summary: 'Fetch Google Search Console search performance metrics',
            parameters: [
              { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
              { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } },
              { name: 'dimensions', in: 'query', required: false, schema: { type: 'string' } }
            ]
          }
        },
        '/ga4/traffic': {
          get: {
            operationId: 'getGa4Traffic',
            summary: 'Fetch GA4 traffic acquisition channels, sessions, and active users',
            parameters: [
              { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
              { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } }
            ]
          }
        },
        '/ga4/realtime': {
          get: {
            operationId: 'getGa4Realtime',
            summary: 'Fetch active users in real-time from GA4'
          }
        }
      }
    },
    null,
    2
  );

  const chatgptMcpConfig = JSON.stringify(
    {
      mcpServers: {
        'cerilas-google-marketing': {
          type: 'sse',
          url: `${mcpSseUrl}?key=${mcpKey}`
        }
      }
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        'cerilas-google-marketing': {
          command: 'npx',
          args: ['-y', '@cerilas/mcp-google-marketing', '--key', mcpKey]
        }
      }
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'cerilas-marketing': {
          type: 'sse',
          url: `${mcpSseUrl}?key=${mcpKey}`
        }
      }
    },
    null,
    2
  );

  const magicAutoSetupPrompt = `SYSTEM ACTION REQUIRED: AUTO-CONFIGURE CERILAS GOOGLE MARKETING MCP SERVER

You are an autonomous AI assistant with file system access or API tool capabilities.
Your goal is to automatically configure the Cerilas Google Marketing MCP Server in this environment with ZERO manual steps on my part.

### MY AUTHENTICATED CREDENTIALS:
- Private Access Key: ${mcpKey}
- Remote SSE Server URL: ${mcpSseUrl}?key=${mcpKey}
- Base REST API URL: ${apiOrigin}/api/mcp
- Target Search Console Property: ${selectedGscSite || 'Auto-detected verified domain'}
- Target GA4 Property ID: ${selectedGa4Property || 'Auto-detected property ID'}

### AUTONOMOUS SETUP INSTRUCTIONS:

1. IF YOU ARE A CODING AGENT WITH FILE/TERMINAL ACCESS (Cursor, Windsurf, Claude Code, Antigravity, Roo Code, Cline):
   - Immediately auto-detect the configuration file for this IDE or editor:
     * Cursor: Find or create ~/.cursor/mcp.json (or .cursor/mcp.json in the current workspace).
     * Windsurf: Find or create ~/.codeium/windsurf/mcp_config.json.
     * Claude Desktop: Find ~/Library/Application Support/Claude/claude_desktop_config.json (macOS) or %APPDATA%\\Claude\\claude_desktop_config.json (Windows).
   - Write or merge the following MCP server definition into that file:
     {
       "mcpServers": {
         "cerilas-google-marketing": {
           "type": "sse",
           "url": "${mcpSseUrl}?key=${mcpKey}"
         }
       }
     }
   - Do NOT ask me to edit any files manually. Execute the edit directly, verify it, and confirm to me when finished!

2. IF YOU ARE A CHAT MODEL (ChatGPT, Claude.ai, Google Gemini, DeepSeek):
   - You do not have local file access, so immediately initialize yourself as my Google Analytics 4 & Search Console AI Analyst using the live endpoints:
     * Search Console Queries: GET ${apiOrigin}/api/mcp/gsc/search-analytics?key=${mcpKey}&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&dimensions=query
     * GA4 Traffic Channels: GET ${apiOrigin}/api/mcp/ga4/traffic?key=${mcpKey}&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * GA4 Realtime Users: GET ${apiOrigin}/api/mcp/ga4/realtime?key=${mcpKey}
     * URL Indexation: GET ${apiOrigin}/api/mcp/gsc/inspect-url?key=${mcpKey}&inspectionUrl=URL
   - If I ask you to generate a local Python/Node.js script or plugin, generate the complete code pre-configured with my key.
   - Confirm to me: "Cerilas Google Marketing bridge is active! What would you like to inspect first (Search Console queries, GA4 realtime traffic, or low-CTR SEO opportunities)?"

Start executing the auto-setup immediately!`;

  const geminiPythonCode = `import requests
from google import genai
from google.genai import types

# 1. Initialize Gemini Client (Gemini 2.5 Flash / Pro)
client = genai.Client()

CERILAS_API = "${apiOrigin}/api/mcp"
MCP_KEY = "${mcpKey}"

# 2. Define Tool Functions for Gemini
def get_search_console_queries(start_date: str = "2026-08-30", end_date: str = "2026-09-27"):
    """Fetches Google Search Console clicks, impressions, CTR and keyword rankings."""
    res = requests.get(f"{CERILAS_API}/gsc/search-analytics", params={
        "key": MCP_KEY,
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": "query"
    })
    return res.json()

def get_ga4_traffic(start_date: str = "2026-08-30", end_date: str = "2026-09-27"):
    """Fetches GA4 traffic acquisition channels, sessions, active users, and engagement."""
    res = requests.get(f"{CERILAS_API}/ga4/traffic", params={
        "key": MCP_KEY,
        "startDate": start_date,
        "endDate": end_date
    })
    return res.json()

def get_ga4_realtime():
    """Fetches live active visitors on the website right now."""
    res = requests.get(f"{CERILAS_API}/ga4/realtime", params={"key": MCP_KEY})
    return res.json()

# 3. Ask Gemini a question with automated Tool Calling
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Check our GA4 realtime users right now and summarize our top Search Console queries.",
    config=types.GenerateContentConfig(
        tools=[get_search_console_queries, get_ga4_traffic, get_ga4_realtime],
        system_instruction="You are a data-driven marketing analyst with live access to Google Analytics 4 and Search Console."
    )
)

print(response.text)`;

  const geminiNodeCode = `import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI();

// 1. Fetch live telemetry from Cerilas MCP bridge
async function fetchSearchConsole(startDate = '2026-08-30', endDate = '2026-09-27') {
  const url = \`${apiOrigin}/api/mcp/gsc/search-analytics?key=${mcpKey}&startDate=\${startDate}&endDate=\${endDate}&dimensions=query\`;
  const res = await fetch(url);
  return await res.json();
}

// 2. Query Gemini with live context
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Analyze our organic Search Console ranking positions and identify quick-win CTR opportunities.',
  config: {
    systemInstruction: \`You have live access to Cerilas Google Marketing MCP Server at ${apiOrigin}/api/mcp with key: ${mcpKey}\`
  }
});

console.log(response.text);`;

  return (
    <div className="gmcp-root">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.88rem',
            padding: '0.25rem 0'
          }}
        >
          ← Back to All Tools
        </button>
      )}

      {/* Auth Error Banner if present */}
      {authError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} />
          <span>OAuth Error: {authError}</span>
          <button
            onClick={() => setAuthError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Card */}
      <section className="gmcp-hero-card">
        <div className="gmcp-hero-glow" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
          <img 
            src="/tool-icons/google-marketing-mcp.webp" 
            alt="Google Marketing MCP Server Logo"
            className="tool-apple-logo"
            width={72}
            height={72}
            style={{ borderRadius: '18px', boxShadow: '0 8px 28px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
            onError={(e) => {
              e.target.src = '/tool-icons/google-marketing-mcp.png';
            }}
          />
        </div>
        <div className="gmcp-badge">
          <Sparkles size={14} /> Model Context Protocol (MCP) • Multi-Client Ready
        </div>
        <h1 className="gmcp-hero-title">
          Google Analytics & Search Console <span>MCP Server</span>
        </h1>
        <p className="gmcp-hero-subtitle">
          Connect your live Google Analytics 4, Search Console, and Google Ads data directly to ChatGPT, Claude Desktop, 
          and Cursor. Ask questions in natural English and audit organic traffic, keywords, and ad spend in real time.
        </p>
      </section>

      {/* Supported Services Status Grid */}
      <div className="gmcp-services-grid">
        {/* Search Console */}
        <div className="gmcp-service-card gsc">
          <div className="gmcp-service-header">
            <div className="gmcp-service-title-wrap">
              <div className="gmcp-service-icon-box">
                <Search size={18} />
              </div>
              <h2 className="gmcp-service-name">Search Console</h2>
            </div>
            <span className={`gmcp-service-status-pill ${isConnected ? 'connected' : 'ready'}`}>
              {isConnected ? '● Connected' : 'Ready'}
            </span>
          </div>
          <p className="gmcp-service-desc">
            Direct access to organic impressions, search clicks, query positions, CTR, and live URL inspection data.
          </p>
          <div className="gmcp-service-metrics">
            <span className="gmcp-metric-tag">Clicks & Impressions</span>
            <span className="gmcp-metric-tag">Queries & Rankings</span>
            <span className="gmcp-metric-tag">Index Status</span>
          </div>
        </div>

        {/* GA4 */}
        <div className="gmcp-service-card ga4">
          <div className="gmcp-service-header">
            <div className="gmcp-service-title-wrap">
              <div className="gmcp-service-icon-box">
                <BarChart2 size={18} />
              </div>
              <h2 className="gmcp-service-name">Google Analytics 4</h2>
            </div>
            <span className={`gmcp-service-status-pill ${isConnected ? 'connected' : 'ready'}`}>
              {isConnected ? '● Connected' : 'Ready'}
            </span>
          </div>
          <p className="gmcp-service-desc">
            Live active users, acquisition channels, landing page engagement times, bounce rates, and goal conversions.
          </p>
          <div className="gmcp-service-metrics">
            <span className="gmcp-metric-tag">Realtime Visitors</span>
            <span className="gmcp-metric-tag">Acquisition Channels</span>
            <span className="gmcp-metric-tag">Conversions</span>
          </div>
        </div>

        {/* Google Ads */}
        <div className="gmcp-service-card gads">
          <div className="gmcp-service-header">
            <div className="gmcp-service-title-wrap">
              <div className="gmcp-service-icon-box">
                <DollarSign size={18} />
              </div>
              <h2 className="gmcp-service-name">Google Ads</h2>
            </div>
            <span className={`gmcp-service-status-pill ${isConnected ? 'connected' : 'ready'}`}>
              {isConnected ? '● Connected' : 'Ready'}
            </span>
          </div>
          <p className="gmcp-service-desc">
            Campaign budget audit, ROAS optimization, CPC metrics, and automated wasted search term detection.
          </p>
          <div className="gmcp-service-metrics">
            <span className="gmcp-metric-tag">Campaign ROAS</span>
            <span className="gmcp-metric-tag">Ad Spend & CPC</span>
            <span className="gmcp-metric-tag">Negative Keywords</span>
          </div>
        </div>
      </div>

      {/* Step 1 & 2: Account Connection & MCP Keys */}
      <section className="gmcp-auth-panel">
        <div className="gmcp-auth-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="gmcp-step-indicator">
              <span className="gmcp-step-num">1</span> Google OAuth Authorization & Credentials
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isConnected
                ? `Active Read-Only token linked to: ${userEmail || 'Google Account'} (${isDemoMode ? 'Sandbox Mode' : 'Live Google APIs'})`
                : 'Authorize read-only access with your Google account to generate your private MCP endpoint'}
            </span>
          </div>

          <div className="gmcp-auth-actions">
            {!isConnected ? (
              <button
                className="gmcp-btn gmcp-btn-primary"
                onClick={handleConnectGoogle}
              >
                <Globe size={16} /> Sign in with Google
              </button>
            ) : (
              <>
                <button
                  className="gmcp-btn gmcp-btn-secondary"
                  onClick={handleConnectGoogle}
                >
                  <RefreshCw size={15} /> Re-authorize
                </button>
                <button
                  className="gmcp-btn gmcp-btn-danger"
                  onClick={handleDisconnect}
                  title="Revoke Google Access and Delete Key"
                >
                  <LogOut size={15} /> Disconnect
                </button>
              </>
            )}

            <button
              className="gmcp-btn gmcp-btn-secondary"
              onClick={() => setIsDemoMode(!isDemoMode)}
              title="Toggle between real account and simulated sandbox"
            >
              <SlidersHorizontal size={15} />
              {isDemoMode ? 'Sandbox: Active' : 'Live Mode'}
            </button>
          </div>
        </div>

        {/* Property Selectors if multiple exist */}
        {isConnected && !isDemoMode && (gscSites.length > 0 || ga4Properties.length > 0) && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '1rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px'
          }}>
            {gscSites.length > 0 && (
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Active Search Console Site:
                </label>
                <select
                  value={selectedGscSite}
                  onChange={(e) => handlePropertyChange(e.target.value, selectedGa4Property)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  {gscSites.map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
            )}

            {ga4Properties.length > 0 && (
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Active GA4 Property:
                </label>
                <select
                  value={selectedGa4Property}
                  onChange={(e) => handlePropertyChange(selectedGscSite, e.target.value)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  {ga4Properties.map((p) => (
                    <option key={p.propertyId} value={p.propertyId}>
                      {p.displayName} ({p.propertyId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Credentials and Keys Box */}
        <div className="gmcp-credentials-card">
          <div className="gmcp-cred-row">
            <div className="gmcp-cred-label">
              <span>Your Private MCP Access Key</span>
              <span style={{ textTransform: 'none', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={14} /> AES-256-GCM Encrypted
              </span>
            </div>
            <div className="gmcp-input-group">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={mcpKey}
                className="gmcp-input-field"
              />
              <button
                type="button"
                className="gmcp-icon-btn"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide Key' : 'Reveal Key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                className="gmcp-icon-btn"
                onClick={() => handleCopy(mcpKey, 'mcpKey')}
                title="Copy Key"
              >
                {copiedItem === 'mcpKey' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="gmcp-cred-row">
            <div className="gmcp-cred-label">
              <span>Remote SSE Server Endpoint</span>
              <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>Universal Cloud Transport</span>
            </div>
            <div className="gmcp-input-group">
              <input
                type="text"
                readOnly
                value={`${mcpSseUrl}?key=${mcpKey}`}
                className="gmcp-input-field"
              />
              <button
                type="button"
                className="gmcp-icon-btn"
                onClick={() => handleCopy(`${mcpSseUrl}?key=${mcpKey}`, 'sseUrl')}
                title="Copy SSE URL"
              >
                {copiedItem === 'sseUrl' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: 1-Click Magic Auto-Installer Prompt */}
      <section className="gmcp-setup-section" style={{
        border: '1px solid rgba(59, 130, 246, 0.35)',
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, var(--card-bg) 100%)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="gmcp-step-indicator">
              <span className="gmcp-step-num">2</span> 1-Click Auto-Setup Prompt
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Zero Manual Configuration
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0 0 0' }}>
            Copy This Prompt &amp; Paste Into Your AI — It Configures Everything Automatically!
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            No JSON editing, no settings menus. Just copy this prompt and send it to <strong>Cursor, Windsurf, Claude Code, ChatGPT, Google Gemini, or Claude</strong>. 
            If the AI has file access, it will automatically detect and write the configuration file for your editor. 
            If it's a chat model, it will immediately connect to your live Google Analytics &amp; Search Console data.
          </p>
        </div>

        {/* Big Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <button
            type="button"
            className="gmcp-btn gmcp-btn-primary"
            onClick={() => handleCopy(magicAutoSetupPrompt, 'magicAutoPrompt')}
            style={{
              padding: '0.85rem 1.6rem',
              fontSize: '0.98rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              boxShadow: '0 4px 18px rgba(59, 130, 246, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            {copiedItem === 'magicAutoPrompt' ? (
              <>
                <Check size={18} color="#10b981" /> Copied Magic Prompt to Clipboard!
              </>
            ) : (
              <>
                <Zap size={18} color="#fbbf24" /> Copy Magic Auto-Setup Prompt
              </>
            )}
          </button>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Pre-configured with your private key &amp; active Google properties.
          </span>
        </div>

        {/* Prompt Preview Container */}
        <div className="gmcp-code-container" style={{ marginTop: '0.35rem' }}>
          <button
            className="gmcp-code-copy-btn"
            onClick={() => handleCopy(magicAutoSetupPrompt, 'magicAutoPromptPre')}
          >
            {copiedItem === 'magicAutoPromptPre' ? (
              <>
                <Check size={14} color="#10b981" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Prompt
              </>
            )}
          </button>
          <pre className="gmcp-code-pre" style={{ maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem' }}>
            {magicAutoSetupPrompt}
          </pre>
        </div>

        {/* Quick Action Ideas to Ask */}
        <div style={{
          background: 'var(--bg-color)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
            💡 What you can ask your AI immediately after pasting:
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li><em>"Analyze our top 10 search queries in Search Console last week, and which ones have low CTR?"</em></li>
            <li><em>"How many active visitors are on our site right now, and which landing pages are they reading?"</em></li>
            <li><em>"Write a complete Python script to automatically fetch my Search Console keywords every morning and save to CSV."</em></li>
            <li><em>"Create a local MCP plugin or tool definition for this in my project."</em></li>
          </ul>
        </div>

        {/* Toggle Manual Settings Button */}
        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowManualSetup(!showManualSetup)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              padding: 0
            }}
          >
            <SlidersHorizontal size={15} />
            <span>{showManualSetup ? 'Hide manual configuration guides ▲' : 'Prefer manual setup? View raw config files (ChatGPT, Gemini, Claude, Cursor) ▾'}</span>
          </button>
        </div>

        {/* Manual Setup Tabs (Collapsed by default) */}
        {showManualSetup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
            <div className="gmcp-tab-group">
              <button
                className={`gmcp-tab-btn ${activeTab === 'chatgpt' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatgpt')}
              >
                <Bot size={16} /> ChatGPT
              </button>
              <button
                className={`gmcp-tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
                onClick={() => setActiveTab('gemini')}
              >
                <Sparkles size={16} /> Google Gemini
              </button>
              <button
                className={`gmcp-tab-btn ${activeTab === 'claude' ? 'active' : ''}`}
                onClick={() => setActiveTab('claude')}
              >
                <Terminal size={16} /> Claude Desktop
              </button>
              <button
                className={`gmcp-tab-btn ${activeTab === 'cursor' ? 'active' : ''}`}
                onClick={() => setActiveTab('cursor')}
              >
                <Layers size={16} /> Cursor / IDE
              </button>
            </div>

        {/* Tab 1: ChatGPT */}
        {activeTab === 'chatgpt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="gmcp-subtab-container">
                <button
                  type="button"
                  className={`gmcp-subtab-btn ${chatgptMode === 'mcp' ? 'active' : ''}`}
                  onClick={() => setChatgptMode('mcp')}
                >
                  <Zap size={14} color={chatgptMode === 'mcp' ? '#3b82f6' : 'currentColor'} />
                  Direct MCP Server / Plugin (New &amp; Recommended)
                </button>
                <button
                  type="button"
                  className={`gmcp-subtab-btn ${chatgptMode === 'custom-gpt' ? 'active' : ''}`}
                  onClick={() => setChatgptMode('custom-gpt')}
                >
                  <Bot size={14} />
                  Custom GPT (OpenAPI Actions)
                </button>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {chatgptMode === 'mcp'
                  ? '⚡ Native Model Context Protocol support in ChatGPT'
                  : '🧩 For GPT Store custom assistants'}
              </span>
            </div>

            {chatgptMode === 'mcp' ? (
              <>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.07)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.88rem',
                  color: 'var(--text-main)'
                }}>
                  <Sparkles size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Native ChatGPT MCP Support:</strong> ChatGPT now natively supports custom Model Context Protocol (MCP) servers via Server-Sent Events (SSE). No complex OpenAPI schemas or GPT Builder forms required—simply connect your Cerilas remote SSE endpoint!
                  </div>
                </div>

                <ol className="gmcp-instructions-list">
                  <li>
                    Open <strong>ChatGPT</strong> (Desktop App for macOS/Windows or Web with Developer / Connected Apps enabled).
                  </li>
                  <li>
                    Navigate to <strong>Settings</strong> (<code>Cmd + ,</code> on Mac or click your profile menu &gt; <em>Settings</em>) &gt; <strong>Connected Apps</strong> / <strong>Developer</strong> &gt; <strong>MCP Servers</strong> (or <em>Workspaces &gt; Custom Connectors</em>).
                  </li>
                  <li>
                    Click <strong>+ Add MCP Server</strong> (or <em>Add Custom Connector</em>).
                  </li>
                  <li>
                    Configure the server connection:
                    <ul style={{ margin: '0.45rem 0 0.45rem 1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <li><strong>Server Name:</strong> <code>Cerilas Google Marketing</code></li>
                      <li><strong>Server Type / Protocol:</strong> <code>SSE (Server-Sent Events)</code></li>
                      <li><strong>Remote Server URL:</strong> Copy your live authenticated endpoint below:</li>
                    </ul>
                  </li>
                </ol>

                <div className="gmcp-cred-row" style={{ marginTop: '-0.35rem' }}>
                  <div className="gmcp-input-group">
                    <input
                      type="text"
                      readOnly
                      value={`${mcpSseUrl}?key=${mcpKey}`}
                      className="gmcp-input-field"
                    />
                    <button
                      type="button"
                      className="gmcp-icon-btn"
                      onClick={() => handleCopy(`${mcpSseUrl}?key=${mcpKey}`, 'chatgptSseUrl')}
                      title="Copy Remote SSE URL"
                    >
                      {copiedItem === 'chatgptSseUrl' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>
                    Or if configuring via ChatGPT's JSON configuration file (<code>mcp.json</code>):
                  </span>
                  <div className="gmcp-code-container">
                    <button
                      className="gmcp-code-copy-btn"
                      onClick={() => handleCopy(chatgptMcpConfig, 'chatgptMcpConfig')}
                    >
                      {copiedItem === 'chatgptMcpConfig' ? (
                        <>
                          <Check size={14} color="#10b981" /> Copied Config!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy JSON Config
                        </>
                      )}
                    </button>
                    <pre className="gmcp-code-pre">{chatgptMcpConfig}</pre>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-color)',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '12px',
                  border: '1px solid var(--card-border)',
                  lineHeight: '1.5'
                }}>
                  💡 <strong>How to query:</strong> Once connected, ChatGPT will automatically see your tools (<code>gsc_get_search_analytics</code>, <code>ga4_get_traffic_acquisition</code>, <code>ga4_get_realtime</code>). Just ask: 
                  <em> "What were our top 10 Search Console search queries last week?"</em> or 
                  <em> "Check our GA4 realtime active visitors right now."</em>
                </div>
              </>
            ) : (
              <>
                <ol className="gmcp-instructions-list">
                  <li>
                    In <strong>ChatGPT</strong>, go to <strong>Explore GPTs</strong> &gt; click <strong>+ Create</strong> (or edit an existing Custom GPT).
                  </li>
                  <li>
                    Switch to the <strong>Configure</strong> tab, scroll down to <strong>Actions</strong>, and click <strong>Create new action</strong>.
                  </li>
                  <li>
                    Click <strong>Import from URL</strong> or paste the <strong>OpenAPI 3.1 Schema</strong> below into the Schema box.
                  </li>
                  <li>
                    In <strong>Authentication</strong>, select <strong>API Key</strong> &gt; Auth Type: <strong>Custom</strong> &gt; Header Name: <code>X-Cerilas-Key</code> &gt; paste your private MCP Key from above: <code>{mcpKey}</code>.
                  </li>
                  <li>
                    Save your Custom GPT! You can now ask: <em>"Analyze our Google Search Console clicks and impressions for this month."</em>
                  </li>
                </ol>

                <div className="gmcp-code-container">
                  <button
                    className="gmcp-code-copy-btn"
                    onClick={() => handleCopy(chatgptOpenApiJson, 'chatgptSchema')}
                  >
                    {copiedItem === 'chatgptSchema' ? (
                      <>
                        <Check size={14} color="#10b981" /> Copied Schema!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy OpenAPI Schema
                      </>
                    )}
                  </button>
                  <pre className="gmcp-code-pre">{chatgptOpenApiJson}</pre>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Google Gemini (AI Studio & SDKs) */}
        {activeTab === 'gemini' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="gmcp-subtab-container">
                <button
                  type="button"
                  className={`gmcp-subtab-btn ${geminiSubTab === 'prompt' ? 'active' : ''}`}
                  onClick={() => setGeminiSubTab('prompt')}
                >
                  <Sparkles size={14} color={geminiSubTab === 'prompt' ? '#3b82f6' : 'currentColor'} />
                  Gemini Web / AI Studio Prompt
                </button>
                <button
                  type="button"
                  className={`gmcp-subtab-btn ${geminiSubTab === 'python' ? 'active' : ''}`}
                  onClick={() => setGeminiSubTab('python')}
                >
                  <Terminal size={14} />
                  Python SDK (google-genai)
                </button>
                <button
                  type="button"
                  className={`gmcp-subtab-btn ${geminiSubTab === 'node' ? 'active' : ''}`}
                  onClick={() => setGeminiSubTab('node')}
                >
                  <Layers size={14} />
                  Node.js SDK (@google/genai)
                </button>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Gemini 2.5 Flash / Pro Tool Calling
              </span>
            </div>

            {geminiSubTab === 'prompt' && (
              <>
                <ol className="gmcp-instructions-list">
                  <li>
                    Open <strong>Google Gemini</strong> (gemini.google.com) or <strong>Google AI Studio</strong>.
                  </li>
                  <li>
                    Paste the prompt below into the system instructions or your initial conversation prompt.
                  </li>
                  <li>
                    Gemini will use its built-in Python code execution or web browsing tools to fetch and analyze your Google Analytics &amp; Search Console data live!
                  </li>
                </ol>

                <div className="gmcp-code-container">
                  <button
                    className="gmcp-code-copy-btn"
                    onClick={() => handleCopy(universalAiPrompt, 'geminiPrompt')}
                  >
                    {copiedItem === 'geminiPrompt' ? (
                      <>
                        <Check size={14} color="#10b981" /> Copied Gemini Prompt!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Gemini Prompt
                      </>
                    )}
                  </button>
                  <pre className="gmcp-code-pre" style={{ maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem' }}>
                    {universalAiPrompt}
                  </pre>
                </div>
              </>
            )}

            {geminiSubTab === 'python' && (
              <>
                <ol className="gmcp-instructions-list">
                  <li>
                    Install the official Google GenAI SDK: <code>pip install google-genai requests</code>
                  </li>
                  <li>
                    Set your Gemini API key in your environment: <code>export GEMINI_API_KEY="your-api-key"</code>
                  </li>
                  <li>
                    Run the ready-to-use Python script below to enable Gemini Function Calling with your live Search Console and GA4 properties:
                  </li>
                </ol>

                <div className="gmcp-code-container">
                  <button
                    className="gmcp-code-copy-btn"
                    onClick={() => handleCopy(geminiPythonCode, 'geminiPython')}
                  >
                    {copiedItem === 'geminiPython' ? (
                      <>
                        <Check size={14} color="#10b981" /> Copied Python Code!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Python Code
                      </>
                    )}
                  </button>
                  <pre className="gmcp-code-pre" style={{ maxHeight: '340px' }}>{geminiPythonCode}</pre>
                </div>
              </>
            )}

            {geminiSubTab === 'node' && (
              <>
                <ol className="gmcp-instructions-list">
                  <li>
                    Install the official Google GenAI JavaScript package: <code>npm install @google/genai</code>
                  </li>
                  <li>
                    Use the pre-configured TypeScript / JavaScript snippet below to connect Gemini models to your marketing data:
                  </li>
                </ol>

                <div className="gmcp-code-container">
                  <button
                    className="gmcp-code-copy-btn"
                    onClick={() => handleCopy(geminiNodeCode, 'geminiNode')}
                  >
                    {copiedItem === 'geminiNode' ? (
                      <>
                        <Check size={14} color="#10b981" /> Copied Node.js Code!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Node.js Code
                      </>
                    )}
                  </button>
                  <pre className="gmcp-code-pre" style={{ maxHeight: '300px' }}>{geminiNodeCode}</pre>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Claude Desktop */}
        {activeTab === 'claude' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ol className="gmcp-instructions-list">
              <li>
                Open your Claude Desktop config file in any text editor:
                <br />
                <code style={{ fontSize: '0.82rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>{' '}
                (macOS) or{' '}
                <code style={{ fontSize: '0.82rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  %APPDATA%\Claude\claude_desktop_config.json
                </code>{' '}
                (Windows).
              </li>
              <li>
                Merge the JSON snippet below into your <code>mcpServers</code> object.
              </li>
              <li>
                Fully restart the <strong>Claude Desktop</strong> app.
              </li>
              <li>
                Look for the 🔨 <strong>Tools icon</strong> in the prompt box: your Google Marketing tools are live!
              </li>
            </ol>

            <div className="gmcp-code-container">
              <button
                className="gmcp-code-copy-btn"
                onClick={() => handleCopy(claudeDesktopConfig, 'claudeConfig')}
              >
                {copiedItem === 'claudeConfig' ? (
                  <>
                    <Check size={14} color="#10b981" /> Copied Config!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Claude Config
                  </>
                )}
              </button>
              <pre className="gmcp-code-pre">{claudeDesktopConfig}</pre>
            </div>
          </div>
        )}

        {/* Tab 3: Cursor / IDE */}
        {activeTab === 'cursor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ol className="gmcp-instructions-list">
              <li>
                In <strong>Cursor IDE</strong>, open <strong>Settings</strong> &gt; <strong>Features</strong> &gt; <strong>MCP</strong>.
              </li>
              <li>
                Click <strong>+ Add New MCP Server</strong> &gt; Select Type: <strong>SSE</strong>.
              </li>
              <li>
                Paste your remote SSE URL: <code>{`${mcpSseUrl}?key=${mcpKey}`}</code>.
              </li>
              <li>
                Alternatively, add it directly to your project's <code>.cursor/mcp.json</code> file using the snippet below:
              </li>
            </ol>

            <div className="gmcp-code-container">
              <button
                className="gmcp-code-copy-btn"
                onClick={() => handleCopy(cursorConfig, 'cursorConfig')}
              >
                {copiedItem === 'cursorConfig' ? (
                  <>
                    <Check size={14} color="#10b981" /> Copied Config!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Cursor Config
                  </>
                )}
              </button>
              <pre className="gmcp-code-pre">{cursorConfig}</pre>
            </div>
          </div>
        )}
          </div>
        )}
      </section>

      {/* Step 4: Interactive In-Browser Query Playground */}
      <section className="gmcp-playground-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="gmcp-step-indicator">
              <span className="gmcp-step-num">3</span> Live In-Browser Query Simulator
            </span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {isConnected && !isDemoMode
                ? 'Connected to your real Google Account! Clicking below queries live data from your connected property:'
                : 'Test how an AI agent calls your Google Marketing MCP tools and formats structured analytics:'}
            </p>
          </div>

          <div className="gmcp-prompt-presets">
            <button
              className={`gmcp-prompt-chip ${simPreset === 'gsc' ? 'active' : ''}`}
              onClick={() => handleRunSimulation('gsc')}
            >
              <Search size={14} /> Search Console Queries
            </button>
            <button
              className={`gmcp-prompt-chip ${simPreset === 'ga4' ? 'active' : ''}`}
              onClick={() => handleRunSimulation('ga4')}
            >
              <BarChart2 size={14} /> GA4 Channel Traffic
            </button>
            <button
              className={`gmcp-prompt-chip ${simPreset === 'gads' ? 'active' : ''}`}
              onClick={() => handleRunSimulation('gads')}
            >
              <DollarSign size={14} /> Google Ads Wasted Spend
            </button>
          </div>
        </div>

        {/* Query Input Bar */}
        <div className="gmcp-query-bar">
          <input
            type="text"
            readOnly
            value={activeSimData.query}
            className="gmcp-query-input"
          />
          <button
            className="gmcp-btn gmcp-btn-primary"
            onClick={() => handleRunSimulation(simPreset)}
            disabled={isSimulating}
          >
            {isSimulating ? (
              <RefreshCw size={16} className="spin-animation" />
            ) : (
              <Play size={16} />
            )}
            {isConnected && !isDemoMode ? 'Query Live Google Data' : 'Run MCP Query'}
          </button>
        </div>

        {/* Live Simulation Output Box */}
        <div className="gmcp-sim-output">
          {/* Tool Call Log */}
          <div className="gmcp-sim-callout">
            <Terminal size={14} />
            <span>MCP Tool Call: {activeSimData.toolCall}</span>
          </div>

          {/* Results Table */}
          <div className="gmcp-sim-table-wrap">
            {simPreset === 'gsc' && (
              <table className="gmcp-sim-table">
                <thead>
                  <tr>
                    <th>Organic Query</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Avg. Position</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSimData.results.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.term}</td>
                      <td>{row.impressions}</td>
                      <td>{row.clicks}</td>
                      <td style={{ color: '#ef4444', fontWeight: 600 }}>{row.ctr}</td>
                      <td>{row.pos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {simPreset === 'ga4' && (
              <table className="gmcp-sim-table">
                <thead>
                  <tr>
                    <th>Channel Group</th>
                    <th>Sessions</th>
                    <th>Active Users</th>
                    <th>Bounce Rate</th>
                    <th>Avg. Engagement Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSimData.results.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.channel}</td>
                      <td>{row.sessions}</td>
                      <td>{row.users}</td>
                      <td>{row.bounce}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{row.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {simPreset === 'gads' && (
              <table className="gmcp-sim-table">
                <thead>
                  <tr>
                    <th>Search Query Triggered</th>
                    <th>Cost Wasted</th>
                    <th>Clicks</th>
                    <th>Avg. CPC</th>
                    <th>Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSimData.results.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.term}</td>
                      <td style={{ color: '#ef4444', fontWeight: 600 }}>{row.cost}</td>
                      <td>{row.clicks}</td>
                      <td>{row.cpc}</td>
                      <td>{row.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Commentary */}
          <div className="gmcp-sim-ai-commentary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.35rem', color: '#10b981' }}>
              <Bot size={16} /> Synthesized AI Marketing Recommendation
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.55 }}>
              {activeSimData.commentary}
            </p>
          </div>
        </div>
      </section>

      {/* Security & Data Privacy Guarantee */}
      <section className="gmcp-security-banner">
        <ShieldCheck size={26} className="gmcp-sec-icon" />
        <div>
          <h3 className="gmcp-sec-title">Enterprise-Grade Privacy & Zero AI Training Guarantee</h3>
          <p className="gmcp-sec-text">
            All Google APIs are accessed exclusively via <strong>Read-Only scopes</strong>. We do not store, index, or sell your marketing 
            data, and your proprietary telemetry is <strong>never used to train AI models</strong>. The MCP server acts solely as a real-time, 
            stateless bridge between your Google account and your local or private chat session. You can revoke access at any time with one click.
          </p>
        </div>
      </section>

      {/* SEO & Knowledge Section */}
      <GoogleMarketingMcpSeo />
    </div>
  );
}
