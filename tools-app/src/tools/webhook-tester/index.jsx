import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Trash2,
  Copy,
  Check,
  Code,
  List,
  Terminal,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Shield,
  Repeat,
  Plus,
  Lock,
  Eye
} from 'lucide-react';
import ToolHeader from '../../components/ui/ToolHeader';
import Badge from '../../components/ui/Badge';
import AdSlot from '../../components/ui/AdSlot';
import Button from '../../components/ui/Button';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import WebhookTesterSeo from './components/WebhookTesterSeo';
import { webhookTesterManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import './webhook-tester.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');

// Webhook Presets
const WEBHOOK_PRESETS = {
  discord: {
    name: 'Discord Webhook',
    method: 'POST',
    urlPlaceholder: 'https://discord.com/api/webhooks/1234567890/abcdef...',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      username: 'Cerilas Webhook Bot',
      avatar_url: 'https://tools.cerilas.com/favicon.svg',
      content: 'Hello from Cerilas Webhook Tester! 🚀',
      embeds: [
        {
          title: 'Webhook Test Notification',
          description: 'This is a test webhook sent directly to your Discord channel.',
          color: 3870685,
          fields: [
            { name: 'Environment', value: 'Production', inline: true },
            { name: 'Status', value: 'Healthy ✅', inline: true },
            { name: 'Timestamp', value: '{{iso_date}}', inline: false }
          ],
          footer: { text: 'Sent via Cerilas Tools Webhook Tester' }
        }
      ]
    }, null, 2)
  },
  slack: {
    name: 'Slack Incoming Webhook',
    method: 'POST',
    urlPlaceholder: 'https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_SECRET_TOKEN',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      text: '🔔 New Alert: External webhook test dispatched successfully.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Cerilas Webhook Dispatcher*\nTested against Slack incoming webhooks API at `{{iso_date}}`.'
          }
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: 'Status: *200 OK* | ID: `{{uuid}}`' }
          ]
        }
      ]
    }, null, 2)
  },
  telegram: {
    name: 'Telegram Bot Webhook',
    method: 'POST',
    urlPlaceholder: 'https://api.telegram.org/bot<TOKEN>/sendMessage',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      chat_id: '123456789',
      text: '🚀 *Cerilas Webhook Tester*\n\nMessage dispatched to Telegram bot at `{{iso_date}}`.',
      parse_mode: 'Markdown'
    }, null, 2)
  },
  zapier: {
    name: 'Zapier / Make / n8n',
    method: 'POST',
    urlPlaceholder: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      event: 'lead.created',
      timestamp: '{{timestamp}}',
      user: {
        id: 'usr_{{random_id}}',
        email: 'developer@example.com',
        name: 'Alex Rivera',
        plan: 'Enterprise'
      },
      metadata: {
        source: 'Cerilas Webhook Tester',
        attempt: 1
      }
    }, null, 2)
  },
  stripe: {
    name: 'Stripe Simulator',
    method: 'POST',
    urlPlaceholder: 'https://your-api.com/api/webhooks/stripe',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Stripe-Signature', value: 't=1726590000,v1=test_sig_{{random_id}}', enabled: true }
    ],
    body: JSON.stringify({
      id: 'evt_3MvwE2LkdIwHu7ix0{{random_id}}',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_3MvwE2LkdIwHu7ix0YYYYYYYY',
          object: 'payment_intent',
          amount: 4900,
          amount_received: 4900,
          currency: 'usd',
          status: 'succeeded',
          customer: 'cus_N8x23901kL',
          description: 'Cerilas Pro Subscription'
        }
      },
      type: 'payment_intent.succeeded'
    }, null, 2)
  },
  custom: {
    name: 'Custom JSON Webhook',
    method: 'POST',
    urlPlaceholder: 'https://your-server.com/api/webhook-handler',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'User-Agent', value: 'Cerilas-Webhook-Tester/2.0', enabled: true }
    ],
    body: JSON.stringify({
      event: 'test.ping',
      timestamp: '{{timestamp}}',
      uuid: '{{uuid}}',
      message: 'Hello from Cerilas Webhook Tester!'
    }, null, 2)
  }
};

// Calculate HMAC SHA-256 via browser Web Crypto API
async function calculateHmacSha256(secret, message) {
  try {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('HMAC calculation error:', err);
    return '';
  }
}

// Replace dynamic placeholders in text
function replacePlaceholders(text) {
  const genUuid = () => {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  return text
    .replace(/\{\{timestamp\}\}/g, Date.now())
    .replace(/\{\{iso_date\}\}/g, new Date().toISOString())
    .replace(/\{\{uuid\}\}/g, genUuid())
    .replace(/\{\{random_id\}\}/g, Math.floor(100000 + Math.random() * 900000));
}

export default function WebhookTester({ onBack, toolMeta: initialToolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    webhookTesterManifest.slug,
    initialToolMeta || webhookTesterManifest
  );
  const [toolMeta] = useState(initialToolMeta || webhookTesterManifest);
  // Target Request Builder State
  const [targetUrl, setTargetUrl] = useState('');
  const [urlError, setUrlError] = useState(null);
  const [httpMethod, setHttpMethod] = useState('POST');
  const [activePreset, setActivePreset] = useState('discord');
  const [activeTab, setActiveTab] = useState('body'); // body, headers, hmac, repeat, curl
  const [payloadText, setPayloadText] = useState(WEBHOOK_PRESETS.discord.body);
  const [headers, setHeaders] = useState(WEBHOOK_PRESETS.discord.headers);
  const [jsonError, setJsonError] = useState(null);

  // HMAC Signature State
  const [enableHmac, setEnableHmac] = useState(false);
  const [hmacSecret, setHmacSecret] = useState('');
  const [hmacHeader, setHmacHeader] = useState('X-Signature-SHA256');
  const [hmacPrefix, setHmacPrefix] = useState('sha256=');
  const [previewHmac, setPreviewHmac] = useState('');

  // Repeat / Stress Test State
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatDelay, setRepeatDelay] = useState(300); // ms
  const [repeatProgress, setRepeatProgress] = useState(null); // { current, total }

  // Execution & Response State
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [responseTab, setResponseTab] = useState('body'); // body, headers, raw
  const [isCopiedResponse, setIsCopiedResponse] = useState(false);
  const [isCopiedCurl, setIsCopiedCurl] = useState(false);

  // Dispatched History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cerilas_wh_history');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Optional Receiver Drawer
  const [showReceiverDrawer, setShowReceiverDrawer] = useState(false);
  const [receiverSessionId, setReceiverSessionId] = useState('');
  const [isCopiedReceiverUrl, setIsCopiedReceiverUrl] = useState(false);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cerilas_wh_history', JSON.stringify(history.slice(0, 30)));
    } catch (_) {}
  }, [history]);

  // Compute live HMAC signature when payload or secret changes
  useEffect(() => {
    if (!enableHmac || !hmacSecret.trim()) {
      setPreviewHmac('');
      return;
    }
    const compute = async () => {
      const sig = await calculateHmacSha256(hmacSecret, payloadText);
      setPreviewHmac(`${hmacPrefix}${sig}`);
    };
    compute();
  }, [enableHmac, hmacSecret, hmacPrefix, payloadText]);

  // Validate JSON on payload edit
  const handlePayloadChange = (text) => {
    setPayloadText(text);
    if (!text.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  // Format / Beautify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadText);
      setPayloadText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setJsonError('Cannot format: ' + err.message);
    }
  };

  // Select Preset Template
  const handleSelectPreset = (key) => {
    const p = WEBHOOK_PRESETS[key];
    if (!p) return;
    setActivePreset(key);
    setHttpMethod(p.method);
    if (!targetUrl || targetUrl === WEBHOOK_PRESETS[activePreset]?.urlPlaceholder) {
      setTargetUrl(p.urlPlaceholder);
    }
    setHeaders(JSON.parse(JSON.stringify(p.headers)));
    setPayloadText(p.body);
    setJsonError(null);
  };

  // Headers Table helpers
  const handleHeaderChange = (index, field, value) => {
    setHeaders((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddHeader = (key = '', value = '') => {
    setHeaders((prev) => [...prev, { key, value, enabled: true }]);
  };

  const handleRemoveHeader = (index) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate cURL command
  const generatedCurl = useMemo(() => {
    const url = targetUrl.trim() || 'https://your-webhook-url.com';
    const activeHeaders = headers.filter((h) => h.enabled && h.key.trim());

    if (enableHmac && previewHmac) {
      activeHeaders.push({ key: hmacHeader, value: previewHmac, enabled: true });
    }

    const headersStr = activeHeaders
      .map((h) => `-H "${h.key}: ${h.value}"`)
      .join(' \\\n  ');

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(httpMethod) && payloadText.trim()) {
      return `curl -X ${httpMethod} "${url}" \\\n  ${headersStr} \\\n  -d '${payloadText.replace(/'/g, "'\\''")}'`;
    }

    return `curl -X ${httpMethod} "${url}" \\\n  ${headersStr}`;
  }, [httpMethod, targetUrl, headers, enableHmac, previewHmac, hmacHeader, payloadText]);

  // Execute Webhook Request (Single or Repeated)
  const handleSendWebhook = async () => {
    if (!targetUrl.trim()) {
      setUrlError('Please enter a destination Webhook URL to dispatch this request.');
      return;
    }
    setUrlError(null);

    setIsSending(true);
    setLastResponse(null);

    const totalRuns = Math.max(1, Math.min(repeatCount, 20));

    for (let i = 0; i < totalRuns; i++) {
      if (totalRuns > 1) {
        setRepeatProgress({ current: i + 1, total: totalRuns });
      }

      // 1. Process dynamic variables
      const processedBody = replacePlaceholders(payloadText);

      // 2. Build headers object
      const reqHeaders = {};
      headers.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          reqHeaders[h.key.trim()] = replacePlaceholders(h.value);
        }
      });

      // 3. Compute HMAC if enabled
      if (enableHmac && hmacSecret.trim()) {
        const sig = await calculateHmacSha256(hmacSecret, processedBody);
        reqHeaders[hmacHeader] = `${hmacPrefix}${sig}`;
      }

      const startTime = Date.now();

      try {
        // We dispatch through backend proxy to bypass browser CORS restrictions
        const res = await fetch(`${API_BASE}/api/webhook-test/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl.trim(),
            method: httpMethod,
            headers: reqHeaders,
            body: processedBody
          })
        });

        const data = await res.json();
        const duration = Date.now() - startTime;

        const responseObj = {
          id: 'res_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          targetUrl: targetUrl.trim(),
          method: httpMethod,
          status: data.status || 502,
          statusText: data.statusText || (data.success ? 'OK' : 'Dispatch Failed'),
          duration: data.duration || duration,
          headers: data.headers || {},
          body: data.body || data.error || 'No response body',
          rawSent: {
            url: targetUrl.trim(),
            method: httpMethod,
            headers: reqHeaders,
            body: processedBody
          }
        };

        setLastResponse(responseObj);

        // Add to history
        setHistory((prev) => [responseObj, ...prev.slice(0, 29)]);
        trackAction('use', { method: httpMethod });
      } catch (err) {
        const duration = Date.now() - startTime;
        const errObj = {
          id: 'res_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          targetUrl: targetUrl.trim(),
          method: httpMethod,
          status: 0,
          statusText: 'Network / Connection Error',
          duration,
          headers: {},
          body: err.message,
          rawSent: {
            url: targetUrl.trim(),
            method: httpMethod,
            headers: reqHeaders,
            body: processedBody
          }
        };
        setLastResponse(errObj);
        setHistory((prev) => [errObj, ...prev.slice(0, 29)]);
      }

      // Delay between iterations if multiple
      if (i < totalRuns - 1 && repeatDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, repeatDelay));
      }
    }

    setIsSending(false);
    setRepeatProgress(null);
  };

  // Keyboard shortcut: Cmd+Enter / Ctrl+Enter to send
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendWebhook();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetUrl, httpMethod, headers, payloadText, enableHmac, hmacSecret, hmacHeader, hmacPrefix, repeatCount, repeatDelay]);

  // Load history item into editor
  const handleLoadHistory = (item) => {
    if (!item?.rawSent) return;
    setTargetUrl(item.rawSent.url || item.targetUrl);
    setHttpMethod(item.rawSent.method || 'POST');
    if (item.rawSent.body) {
      setPayloadText(typeof item.rawSent.body === 'object' ? JSON.stringify(item.rawSent.body, null, 2) : String(item.rawSent.body));
    }
    if (item.rawSent.headers) {
      setHeaders(Object.entries(item.rawSent.headers).map(([key, value]) => ({ key, value: String(value), enabled: true })));
    }
    setLastResponse(item);
  };

  // Generate / Load Receiver URL for testing
  const receiverUrl = useMemo(() => {
    if (!receiverSessionId) return '';
    return `${API_BASE}/api/webhook-test/${receiverSessionId}`;
  }, [receiverSessionId]);

  const handleInitReceiver = async () => {
    setShowReceiverDrawer(true);
    if (!receiverSessionId) {
      try {
        const res = await fetch(`${API_BASE}/api/webhook-test/session`, { method: 'POST' });
        const data = await res.json();
        if (data?.sessionId) setReceiverSessionId(data.sessionId);
      } catch (_) {
        setReceiverSessionId('wh_' + Math.random().toString(36).substring(2, 9));
      }
    }
  };

  return (
    <div className="c-tool-page-container wt-page-container">
      <ToolHeader
        title={toolMeta.title || 'Webhook Tester & Sender'}
        subtitle={toolMeta.shortDescription || toolMeta.short_description || 'Send, test, and debug HTTP requests to external webhooks with custom headers, HMAC signatures, and live response telemetry.'}
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              CORS-Free Proxy
            </Badge>
            <Badge variant="blue" icon={<Send size={12} strokeWidth={2} />}>
              External Dispatcher
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Top Banner: Webhook Sender Controller */}
      <div className="wt-control-card">
        {/* Preset Templates Quick Selector */}
        <div className="wt-presets-bar">
          <span className="wt-presets-label">
            <Sparkles size={14} /> Quick Templates:
          </span>
          <div className="wt-presets-list">
            {Object.entries(WEBHOOK_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                className={`wt-preset-chip ${activePreset === key ? 'active' : ''}`}
                onClick={() => handleSelectPreset(key)}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className="wt-receiver-toggle-btn"
              onClick={handleInitReceiver}
            >
              <Terminal size={13} /> Need a Test Receiver URL?
            </button>
          </div>
        </div>

        {/* Target Webhook URL Bar */}
        <div className="wt-url-bar-main">
          <select
            value={httpMethod}
            onChange={(e) => setHttpMethod(e.target.value)}
            className={`wt-method-select wt-method-${httpMethod}`}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="GET">GET</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="url"
            className={`wt-url-main-input ${urlError ? 'has-error' : ''}`}
            placeholder="Enter destination Webhook URL (e.g. Discord, Slack, Zapier, or API endpoint)..."
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
          />

          <Button
            variant="primary"
            size="md"
            icon={<Send size={16} />}
            onClick={handleSendWebhook}
            isLoading={isSending}
          >
            {isSending ? (repeatProgress ? `Sending (${repeatProgress.current}/${repeatProgress.total})...` : 'Sending...') : 'Send Webhook'}
          </Button>
        </div>

        {urlError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.75rem',
            padding: '0.6rem 0.9rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            fontSize: '0.82rem'
          }}>
            <AlertCircle size={15} />
            <span>{urlError}</span>
          </div>
        )}

        {/* Collapsible Local Receiver Drawer (If developer wants to test incoming webhook) */}
        {showReceiverDrawer && (
          <div className="wt-receiver-drawer">
            <div className="wt-receiver-drawer-header">
              <span className="wt-receiver-drawer-title">
                <CheckCircle2 size={14} color="#10b981" /> Temporary Test Receiver Endpoint
              </span>
              <button className="wt-modal-close-btn" onClick={() => setShowReceiverDrawer(false)}>
                <X size={14} />
              </button>
            </div>
            <p className="wt-receiver-drawer-desc">
              If you don't have an external webhook yet and want to inspect requests, use this temporary Cerilas endpoint:
            </p>
            <div className="wt-receiver-url-box">
              <code>{receiverUrl || 'Generating endpoint...'}</code>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={isCopiedReceiverUrl ? <Check size={12} /> : <Copy size={12} />}
                  onClick={() => {
                    navigator.clipboard.writeText(receiverUrl);
                    setIsCopiedReceiverUrl(true);
                    setTimeout(() => setIsCopiedReceiverUrl(false), 2000);
                  }}
                >
                  {isCopiedReceiverUrl ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTargetUrl(receiverUrl)}
                >
                  Use as Target
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Workspace */}
      <div className="wt-workspace-grid">
        {/* Left Column: Request Builder */}
        <div className="wt-builder-panel">
          {/* Builder Navigation Tabs */}
          <div className="wt-tabs-bar">
            <button
              type="button"
              className={`wt-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              <Code size={14} />
              Payload Body
              {jsonError && <span className="wt-tab-alert" title={jsonError}>!</span>}
            </button>
            <button
              type="button"
              className={`wt-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              <List size={14} />
              Headers
              <span className="wt-tab-badge">
                {headers.filter((h) => h.enabled).length}
              </span>
            </button>
            <button
              type="button"
              className={`wt-tab-btn ${activeTab === 'hmac' ? 'active' : ''}`}
              onClick={() => setActiveTab('hmac')}
            >
              <Shield size={14} />
              HMAC Signature
              {enableHmac && <span className="wt-tab-active-dot" />}
            </button>
            <button
              type="button"
              className={`wt-tab-btn ${activeTab === 'repeat' ? 'active' : ''}`}
              onClick={() => setActiveTab('repeat')}
            >
              <Repeat size={14} />
              Repeat ({repeatCount}x)
            </button>
            <button
              type="button"
              className={`wt-tab-btn ${activeTab === 'curl' ? 'active' : ''}`}
              onClick={() => setActiveTab('curl')}
            >
              <Terminal size={14} />
              cURL
            </button>
          </div>

          {/* Tab 1: Payload Body */}
          {activeTab === 'body' && (
            <div className="wt-tab-body">
              <div className="wt-editor-toolbar">
                <div className="wt-editor-vars">
                  <span className="wt-vars-label">Variables:</span>
                  <button type="button" className="wt-var-pill" onClick={() => setPayloadText((p) => p + '{{timestamp}}')}>
                    + timestamp
                  </button>
                  <button type="button" className="wt-var-pill" onClick={() => setPayloadText((p) => p + '{{iso_date}}')}>
                    + iso_date
                  </button>
                  <button type="button" className="wt-var-pill" onClick={() => setPayloadText((p) => p + '{{uuid}}')}>
                    + uuid
                  </button>
                </div>

                <div className="wt-editor-actions">
                  <Button variant="ghost" size="sm" onClick={handleFormatJson}>
                    Format JSON
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPayloadText('{\n  \n}')}>
                    Clear
                  </Button>
                </div>
              </div>

              <textarea
                className="wt-code-textarea"
                value={payloadText}
                onChange={(e) => handlePayloadChange(e.target.value)}
                placeholder="Enter JSON payload or raw text to send..."
                spellCheck={false}
              />

              {jsonError ? (
                <div className="wt-json-status error">
                  <AlertCircle size={14} />
                  <span>Invalid JSON Syntax: {jsonError}</span>
                </div>
              ) : (
                <div className="wt-json-status valid">
                  <CheckCircle2 size={14} />
                  <span>Valid JSON • Dynamic variables will be replaced on send</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom Headers */}
          {activeTab === 'headers' && (
            <div className="wt-tab-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Configure HTTP headers sent to the external webhook endpoint:
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => handleAddHeader('', '')}
                >
                  Add Header
                </Button>
              </div>

              <div className="wt-headers-list">
                {headers.map((h, idx) => (
                  <div key={idx} className="wt-header-row">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) => handleHeaderChange(idx, 'enabled', e.target.checked)}
                      className="wt-header-check"
                    />
                    <input
                      type="text"
                      placeholder="Header name (e.g. Authorization)"
                      value={h.key}
                      onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                      className="wt-header-input key"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Bearer my-secret-token)"
                      value={h.value}
                      onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                      className="wt-header-input val"
                    />
                    <button
                      type="button"
                      className="wt-row-delete-btn"
                      onClick={() => handleRemoveHeader(idx)}
                      title="Remove header"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Add Presets */}
              <div className="wt-headers-quick">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Add:</span>
                <button type="button" className="wt-var-pill" onClick={() => handleAddHeader('Authorization', 'Bearer <YOUR_TOKEN>')}>
                  + Bearer Auth
                </button>
                <button type="button" className="wt-var-pill" onClick={() => handleAddHeader('X-API-Key', 'sec_key_12345')}>
                  + API Key
                </button>
                <button type="button" className="wt-var-pill" onClick={() => handleAddHeader('X-Webhook-Secret', 'secret_token')}>
                  + Webhook Secret
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: HMAC Signature */}
          {activeTab === 'hmac' && (
            <div className="wt-tab-body">
              <div className="wt-hmac-card">
                <div className="wt-hmac-toggle-row">
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                      HMAC SHA-256 Signature Authentication
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Automatically hash your payload with a secret key and attach the signature header on dispatch.
                    </p>
                  </div>
                  <label className="wt-switch">
                    <input
                      type="checkbox"
                      checked={enableHmac}
                      onChange={(e) => setEnableHmac(e.target.checked)}
                    />
                    <span className="wt-slider" />
                  </label>
                </div>

                {enableHmac && (
                  <div className="wt-hmac-fields">
                    <div className="wt-form-group">
                      <label className="wt-form-label">Secret Key / Signing Token</label>
                      <input
                        type="password"
                        className="wt-form-input"
                        placeholder="Enter webhook secret key (e.g. whsec_...)"
                        value={hmacSecret}
                        onChange={(e) => setHmacSecret(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem' }}>
                      <div className="wt-form-group">
                        <label className="wt-form-label">Header Name</label>
                        <input
                          type="text"
                          className="wt-form-input"
                          placeholder="e.g. X-Hub-Signature-256 or Stripe-Signature"
                          value={hmacHeader}
                          onChange={(e) => setHmacHeader(e.target.value)}
                        />
                      </div>
                      <div className="wt-form-group">
                        <label className="wt-form-label">Prefix</label>
                        <input
                          type="text"
                          className="wt-form-input"
                          placeholder="sha256="
                          value={hmacPrefix}
                          onChange={(e) => setHmacPrefix(e.target.value)}
                        />
                      </div>
                    </div>

                    {previewHmac && (
                      <div className="wt-hmac-preview">
                        <span className="wt-hmac-preview-label">Live Computed Header:</span>
                        <code>{hmacHeader}: {previewHmac}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Repeat & Stress Test */}
          {activeTab === 'repeat' && (
            <div className="wt-tab-body">
              <div className="wt-repeat-card">
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                  Repeat / Load Testing
                </h4>
                <p style={{ margin: '0.35rem 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Fire multiple sequential webhook calls to test queuing, concurrency, deduplication, and rate limits.
                </p>

                <div className="wt-form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="wt-form-label">Total Webhook Calls: {repeatCount}x</label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>1 (Single)</span>
                    <span>5 (Queue test)</span>
                    <span>10 (Concurrency)</span>
                    <span>20 (Stress)</span>
                  </div>
                </div>

                <div className="wt-form-group">
                  <label className="wt-form-label">Delay Between Requests: {repeatDelay}ms</label>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={repeatDelay}
                    onChange={(e) => setRepeatDelay(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: cURL */}
          {activeTab === 'curl' && (
            <div className="wt-tab-body">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={isCopiedCurl ? <Check size={13} /> : <Copy size={13} />}
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCurl);
                    setIsCopiedCurl(true);
                    setTimeout(() => setIsCopiedCurl(false), 2000);
                  }}
                >
                  {isCopiedCurl ? 'Copied cURL' : 'Copy cURL'}
                </Button>
              </div>
              <pre className="wt-code-block">{generatedCurl}</pre>
            </div>
          )}
        </div>

        {/* Right Column: Live Response & Telemetry */}
        <div className="wt-response-panel">
          {lastResponse ? (
            <>
              {/* Response Header Status Bar */}
              <div className="wt-response-header">
                <div className="wt-response-status-left">
                  <span className={`wt-status-pill status-${String(lastResponse.status)[0]}xx`}>
                    HTTP {lastResponse.status} {lastResponse.statusText}
                  </span>
                  <span className="wt-meta-chip">
                    ⚡ {lastResponse.duration}ms
                  </span>
                  <span className="wt-meta-chip">
                    {new Date(lastResponse.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={isCopiedResponse ? <Check size={13} /> : <Copy size={13} />}
                  onClick={() => {
                    const str = typeof lastResponse.body === 'object'
                      ? JSON.stringify(lastResponse.body, null, 2)
                      : String(lastResponse.body);
                    navigator.clipboard.writeText(str);
                    setIsCopiedResponse(true);
                    setTimeout(() => setIsCopiedResponse(false), 2000);
                  }}
                >
                  {isCopiedResponse ? 'Copied' : 'Copy Response'}
                </Button>
              </div>

              {/* Response Navigation Tabs */}
              <div className="wt-tabs-bar">
                <button
                  type="button"
                  className={`wt-tab-btn ${responseTab === 'body' ? 'active' : ''}`}
                  onClick={() => setResponseTab('body')}
                >
                  <Code size={13} />
                  Response Body
                </button>
                <button
                  type="button"
                  className={`wt-tab-btn ${responseTab === 'headers' ? 'active' : ''}`}
                  onClick={() => setResponseTab('headers')}
                >
                  <List size={13} />
                  Response Headers ({Object.keys(lastResponse.headers || {}).length})
                </button>
                <button
                  type="button"
                  className={`wt-tab-btn ${responseTab === 'raw' ? 'active' : ''}`}
                  onClick={() => setResponseTab('raw')}
                >
                  <Terminal size={13} />
                  Sent Payload
                </button>
              </div>

              {/* Response Body Tab */}
              {responseTab === 'body' && (
                <div className="wt-response-body-pane">
                  <pre className="wt-code-block">
                    {typeof lastResponse.body === 'object'
                      ? JSON.stringify(lastResponse.body, null, 2)
                      : lastResponse.body || '// Empty response body (HTTP 204 No Content)'}
                  </pre>
                </div>
              )}

              {/* Response Headers Tab */}
              {responseTab === 'headers' && (
                <div className="wt-response-body-pane">
                  {Object.keys(lastResponse.headers || {}).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No headers returned.</p>
                  ) : (
                    <table className="wt-kv-table">
                      <thead>
                        <tr>
                          <th>Header</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(lastResponse.headers).map(([k, v]) => (
                          <tr key={k}>
                            <td className="wt-kv-key">{k}</td>
                            <td className="wt-kv-val">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Sent Payload Tab */}
              {responseTab === 'raw' && (
                <div className="wt-response-body-pane">
                  <pre className="wt-code-block">
                    {JSON.stringify(lastResponse.rawSent, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="wt-response-empty">
              <div className="wt-feed-empty-icon">
                <Send size={28} />
              </div>
              <h4>Ready to Test External Webhooks</h4>
              <p>
                Select a template above (Discord, Slack, Zapier, Stripe), enter your target endpoint URL, and click <strong>Send Webhook</strong>.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tip: Press <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(150,150,150,0.1)' }}>Cmd+Enter</kbd> to dispatch instantly.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatched History Panel */}
      {history.length > 0 && (
        <div className="wt-history-card">
          <div className="wt-history-header">
            <span style={{ fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={15} /> Dispatched History ({history.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => setHistory([])}
            >
              Clear History
            </Button>
          </div>

          <div className="wt-history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className="wt-history-item"
                onClick={() => handleLoadHistory(item)}
              >
                <span className={`wt-method-badge wt-method-${item.method}`}>
                  {item.method}
                </span>
                <span className={`wt-status-pill-small status-${String(item.status)[0]}xx`}>
                  {item.status}
                </span>
                <span className="wt-history-url" title={item.targetUrl}>
                  {item.targetUrl}
                </span>
                <span className="wt-history-duration">
                  ⚡ {item.duration}ms
                </span>
                <span className="wt-history-time">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Divider */}
      <ToolSeoDivider title="Everything You Need to Know About Webhook Testing &amp; Dispatching" />

      {/* Educational & SEO Guide */}
      <WebhookTesterSeo />
    </div>
  );
}
