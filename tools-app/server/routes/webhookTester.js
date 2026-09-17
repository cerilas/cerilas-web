import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// In-memory session store
// sessionId -> { id, createdAt, lastActivity, config, requests: [], sseClients: Set }
const sessions = new Map();

// Helper to get or create session
function getOrCreateSession(sessionId) {
  if (!sessionId) {
    sessionId = 'wh_' + crypto.randomBytes(8).toString('hex');
  }
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: Date.now(),
      config: {
        statusCode: 200,
        delayMs: 0,
        contentType: 'application/json',
        responseBody: JSON.stringify({ success: true, message: 'Webhook received by Cerilas Webhook Tester' }, null, 2)
      },
      requests: [],
      sseClients: new Set()
    });
  } else {
    sessions.get(sessionId).lastActivity = Date.now();
  }
  return sessions.get(sessionId);
}

// Cleanup inactive sessions every hour (TTL 24 hours)
setInterval(() => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > ONE_DAY) {
      session.sseClients.forEach((client) => {
        try { client.end(); } catch (_) {}
      });
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

// Broadcast event to connected SSE clients
function broadcastToSession(session, eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of session.sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      session.sseClients.delete(client);
    }
  }
}

// 1. Create or get new session
router.post('/session', (req, res) => {
  const { sessionId: requestedId } = req.body || {};
  const session = getOrCreateSession(requestedId);
  res.json({
    sessionId: session.id,
    createdAt: session.createdAt,
    config: session.config
  });
});

// 2. Server-Sent Events (SSE) stream for live updates
router.get('/:sessionId/stream', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ sessionId: session.id, time: new Date().toISOString() })}\n\n`);

  session.sseClients.add(res);

  req.on('close', () => {
    session.sseClients.delete(res);
  });
});

// 3. Fetch all requests for a session
router.get('/:sessionId/requests', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);
  res.json({
    sessionId: session.id,
    total: session.requests.length,
    requests: session.requests
  });
});

// 4. Clear all requests for a session
router.delete('/:sessionId/requests', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);
  session.requests = [];
  broadcastToSession(session, 'cleared', { timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'All webhook requests cleared' });
});

// 5. Get / Update Response Config
router.get('/:sessionId/config', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);
  res.json(session.config);
});

router.post('/:sessionId/config', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);
  const { statusCode, delayMs, responseBody, contentType } = req.body;

  if (statusCode !== undefined) {
    session.config.statusCode = Math.min(Math.max(parseInt(statusCode, 10) || 200, 100), 599);
  }
  if (delayMs !== undefined) {
    session.config.delayMs = Math.min(Math.max(parseInt(delayMs, 10) || 0, 0), 10000);
  }
  if (responseBody !== undefined) {
    session.config.responseBody = String(responseBody);
  }
  if (contentType !== undefined) {
    session.config.contentType = String(contentType);
  }

  res.json({ success: true, config: session.config });
});

// 6. Mock Dispatcher / Webhook Sender
router.post('/dispatch', async (req, res) => {
  const { url, method = 'POST', headers = {}, body = '' } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid destination URL is required' });
  }

  const startTime = Date.now();

  try {
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'Cerilas-Webhook-Tester/1.0',
        ...headers
      }
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method) && body) {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : String(body);
    }

    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;
    const resText = await response.text();

    let resJson = null;
    try {
      resJson = JSON.parse(resText);
    } catch (_) {}

    const responseHeaders = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    res.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      duration,
      headers: responseHeaders,
      body: resJson || resText
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    res.status(502).json({
      success: false,
      error: err.message,
      duration
    });
  }
});

// 7. Universal Webhook Receiver endpoint
const handleIncomingWebhook = async (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);

  // Raw body extraction
  let rawBody = '';
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (typeof req.body === 'object' && req.body !== null) {
    rawBody = JSON.stringify(req.body);
  }

  let parsedBody = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (_) {
      parsedBody = null;
    }
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  const requestRecord = {
    id: 'req_' + crypto.randomBytes(6).toString('hex'),
    method: req.method,
    path: req.originalUrl,
    subpath: req.params[0] || '',
    query: req.query || {},
    headers: req.headers || {},
    clientIp,
    size: Buffer.byteLength(rawBody, 'utf8'),
    rawBody,
    body: parsedBody || rawBody,
    isJson: parsedBody !== null,
    timestamp: new Date().toISOString()
  };

  // Prepend to requests list, keep max 100
  session.requests.unshift(requestRecord);
  if (session.requests.length > 100) {
    session.requests.pop();
  }

  // Real-time broadcast to SSE listeners
  broadcastToSession(session, 'request', requestRecord);

  // Apply configured delay
  if (session.config.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, session.config.delayMs));
  }

  // Send configured response
  res.setHeader('Content-Type', session.config.contentType || 'application/json');
  res.setHeader('X-Powered-By', 'Cerilas Webhook Tester');
  res.status(session.config.statusCode || 200).send(session.config.responseBody || '');
};

router.all('/:sessionId', express.raw({ type: '*/*', limit: '10mb' }), handleIncomingWebhook);
router.all('/:sessionId/:subpath', express.raw({ type: '*/*', limit: '10mb' }), handleIncomingWebhook);

export default router;
