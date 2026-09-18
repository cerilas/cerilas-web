import { Router } from 'express';
import dns from 'dns';
import { promisify } from 'util';
import pool from '../db.js';

const router = Router();
const dnsLookup = promisify(dns.lookup);

// List of private/reserved IP patterns for SSRF prevention
const PRIVATE_IP_REGEX = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.|::1|fe80:|fc00:|fd00:)/i;

/**
 * Validates whether a URL is safe to fetch (SSRF check)
 */
function isSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Unsupported protocol (only http and https are allowed)' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.arpa')
    ) {
      return { safe: false, reason: 'Restricted or internal domain' };
    }
    // Check if hostname is directly an IP
    if (PRIVATE_IP_REGEX.test(hostname)) {
      return { safe: false, reason: 'Private or loopback IP address' };
    }
    return { safe: true, parsed };
  } catch (err) {
    return { safe: false, reason: 'Malformed URL format' };
  }
}

/**
 * Checks a single URL for DNS and HTTP status
 */
async function checkUrl(urlString, timeoutMs = 5000) {
  const startTime = Date.now();
  const validation = isSafeUrl(urlString);
  if (!validation.safe) {
    return {
      url: urlString,
      status: 'blocked',
      httpCode: null,
      responseTimeMs: Date.now() - startTime,
      isHallucination: false,
      riskLevel: 'high',
      diagnostic: validation.reason
    };
  }

  const { hostname } = validation.parsed;

  // 1. DNS Resolution Check
  try {
    const lookupResult = await dnsLookup(hostname);
    if (lookupResult && lookupResult.address && PRIVATE_IP_REGEX.test(lookupResult.address)) {
      return {
        url: urlString,
        status: 'blocked',
        httpCode: null,
        responseTimeMs: Date.now() - startTime,
        isHallucination: false,
        riskLevel: 'high',
        diagnostic: 'Domain resolves to a private/internal IP address'
      };
    }
  } catch (dnsErr) {
    if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'ESERVFAIL') {
      return {
        url: urlString,
        status: 'nxdomain',
        httpCode: null,
        responseTimeMs: Date.now() - startTime,
        isHallucination: true,
        riskLevel: 'critical',
        diagnostic: 'Domain does not exist (NXDOMAIN) — 100% fabricated domain name'
      };
    }
    // Other DNS errors
    return {
      url: urlString,
      status: 'dns_error',
      httpCode: null,
      responseTimeMs: Date.now() - startTime,
      isHallucination: true,
      riskLevel: 'high',
      diagnostic: `DNS resolution failed: ${dnsErr.code || dnsErr.message}`
    };
  }

  // 2. HTTP Request Check (HEAD first, fallback to GET)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CerilasLinkChecker/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  };

  try {
    let res = null;
    let methodUsed = 'HEAD';

    try {
      res = await fetch(urlString, {
        method: 'HEAD',
        headers: requestHeaders,
        signal: controller.signal,
        redirect: 'follow'
      });
    } catch (headErr) {
      // Some web servers reject HEAD or return network error; fallback to GET
      methodUsed = 'GET';
      res = await fetch(urlString, {
        method: 'GET',
        headers: { ...requestHeaders, Range: 'bytes=0-2048' },
        signal: controller.signal,
        redirect: 'follow'
      });
    }

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const finalUrl = res.url || urlString;

    const statusCode = res.status;

    // Evaluate HTTP Status
    if (statusCode >= 200 && statusCode < 300) {
      // Check if redirected to root or home page (common soft 404 behavior)
      const originalPath = new URL(urlString).pathname;
      const finalPath = new URL(finalUrl).pathname;
      if (originalPath.length > 1 && (finalPath === '/' || finalPath === '')) {
        return {
          url: urlString,
          finalUrl,
          status: 'soft_404_redirect',
          httpCode: statusCode,
          responseTimeMs,
          isHallucination: true,
          riskLevel: 'moderate',
          diagnostic: 'URL path likely hallucinated: server redirected from deep path back to homepage'
        };
      }

      return {
        url: urlString,
        finalUrl,
        status: 'alive',
        httpCode: statusCode,
        responseTimeMs,
        isHallucination: false,
        riskLevel: 'clean',
        diagnostic: 'URL is alive and returned HTTP 200 OK'
      };
    } else if (statusCode === 404 || statusCode === 410) {
      return {
        url: urlString,
        finalUrl,
        status: 'not_found',
        httpCode: statusCode,
        responseTimeMs,
        isHallucination: true,
        riskLevel: 'high',
        diagnostic: `HTTP ${statusCode} Not Found: Domain is real, but the specific URL path was fabricated by the LLM`
      };
    } else if (statusCode === 403 || statusCode === 401) {
      return {
        url: urlString,
        finalUrl,
        status: 'restricted',
        httpCode: statusCode,
        responseTimeMs,
        isHallucination: false,
        riskLevel: 'low',
        diagnostic: `HTTP ${statusCode} Access Restricted: Site is alive but requires authentication or Cloudflare verification`
      };
    } else if (statusCode >= 500) {
      return {
        url: urlString,
        finalUrl,
        status: 'server_error',
        httpCode: statusCode,
        responseTimeMs,
        isHallucination: false,
        riskLevel: 'moderate',
        diagnostic: `HTTP ${statusCode} Server Error: Destination server is currently unavailable`
      };
    } else {
      return {
        url: urlString,
        finalUrl,
        status: 'other',
        httpCode: statusCode,
        responseTimeMs,
        isHallucination: statusCode >= 400,
        riskLevel: statusCode >= 400 ? 'high' : 'low',
        diagnostic: `HTTP ${statusCode} response received`
      };
    }
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (fetchErr.name === 'AbortError') {
      return {
        url: urlString,
        status: 'timeout',
        httpCode: null,
        responseTimeMs,
        isHallucination: false,
        riskLevel: 'moderate',
        diagnostic: 'Request timed out after 5 seconds (domain may be dead or firewalled)'
      };
    }

    if (fetchErr.cause && fetchErr.cause.code === 'CERT_HAS_EXPIRED') {
      return {
        url: urlString,
        status: 'ssl_error',
        httpCode: null,
        responseTimeMs,
        isHallucination: false,
        riskLevel: 'moderate',
        diagnostic: 'SSL Certificate expired or invalid'
      };
    }

    return {
      url: urlString,
      status: 'network_error',
      httpCode: null,
      responseTimeMs,
      isHallucination: false,
      riskLevel: 'moderate',
      diagnostic: `Network connection failed: ${fetchErr.message}`
    };
  }
}

/**
 * POST /verify
 * Accepts an array of URLs (max 30 per request) and returns check results
 */
router.post('/verify', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ success: false, error: 'Expected an array of URLs to verify.' });
    }

    if (urls.length === 0) {
      return res.json({ success: true, results: [], stats: { total: 0, alive: 0, hallucinated: 0 } });
    }

    // Limit to max 30 URLs per batch for performance & rate limiting
    const sanitizedUrls = urls
      .filter(u => typeof u === 'string' && u.trim().length > 0)
      .slice(0, 30)
      .map(u => u.trim());

    // Deduplicate URLs for checking
    const uniqueUrls = [...new Set(sanitizedUrls)];

    // Check URLs in parallel with concurrency pool of 6
    const resultsMap = new Map();
    const batchSize = 6;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const slice = uniqueUrls.slice(i, i + batchSize);
      const sliceResults = await Promise.all(slice.map(url => checkUrl(url)));
      sliceResults.forEach(result => {
        resultsMap.set(result.url, result);
      });
    }

    // Map back to original requested list
    const results = uniqueUrls.map(url => resultsMap.get(url));

    // Compute summary stats
    const total = results.length;
    const alive = results.filter(r => r.status === 'alive').length;
    const hallucinated = results.filter(r => r.isHallucination).length;
    const nxdomain = results.filter(r => r.status === 'nxdomain').length;
    const notFound = results.filter(r => r.status === 'not_found' || r.status === 'soft_404_redirect').length;
    const restricted = results.filter(r => r.status === 'restricted').length;
    const unresolvable = results.filter(r => r.status === 'timeout' || r.status === 'network_error').length;

    const hallucinationRate = total > 0 ? Math.round((hallucinated / total) * 100) : 0;

    return res.json({
      success: true,
      results,
      stats: {
        total,
        alive,
        hallucinated,
        nxdomain,
        notFound,
        restricted,
        unresolvable,
        hallucinationRate
      }
    });
  } catch (error) {
    console.error('Error verifying links:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during link verification.' });
  }
});

export default router;
