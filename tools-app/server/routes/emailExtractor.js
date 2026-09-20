import express from 'express';
import dns from 'dns/promises';
import net from 'net';
import * as cheerio from 'cheerio';

const router = express.Router();

// ============================================================================
// SSRF & URL SAFETY UTILITIES
// ============================================================================
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127) return true; // 127.0.0.0/8 Loopback
    if (parts[0] === 10) return true;  // 10.0.0.0/8 Private
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 Link-local / Cloud metadata
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80:')) return true;
    return false;
  }
  return false;
}

async function validateAndResolveUrl(inputUrl) {
  let parsed;
  try {
    let urlStr = inputUrl.trim();
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'https://' + urlStr;
    }
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL format provided.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Access to local, internal, or metadata hosts is restricted.');
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error('Host resolution failed.');
    }
    for (const record of addresses) {
      if (isPrivateIP(record.address)) {
        throw new Error('Resolved host points to a private or restricted IP address.');
      }
    }
  } catch (err) {
    if (err.message.includes('private or restricted')) throw err;
    throw new Error('Could not resolve domain name: ' + hostname);
  }

  return parsed;
}

// ============================================================================
// NOISE & FALSE POSITIVE PATTERNS
// ============================================================================
const INVALID_EMAIL_PATTERNS = [
  /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff|css|js|woff|woff2|ttf|eot)$/i,
  /@(sentry\.io|wixpress\.com|example\.com|domain\.com|yourdomain\.com|test\.com|sample\.com)$/i,
  /@(cloudflare\.com|google-analytics\.com|googletagmanager\.com|facebook\.com|twitter\.com)$/i,
  /^(noreply|no-reply|mailer-daemon|postmaster|donotreply|notifications?|alert|daemon)@/i,
  /^[0-9a-f]{20,}@/i, // Hex hash hashes
  /bootstrap|fontawesome|webpack|polyfill/i
];

const IGNORED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.css', '.js', '.xml', '.json', '.txt'
]);

// ============================================================================
// DETERMINISTIC DEPARTMENT CLASSIFICATION DICTIONARIES
// ============================================================================
const DEPARTMENT_PREFIX_RULES = [
  {
    department: 'Executive & Leadership',
    patterns: [
      /^ceo@/i, /^founder@/i, /^coo@/i, /^cto@/i, /^cfo@/i, /^cmo@/i, /^cio@/i,
      /^yonetim@/i, /^baskan@/i, /^president@/i, /^director@/i, /^kurucu@/i,
      /^generalmanager@/i, /^gm@/i, /^mudur@/i, /^genel-mudur@/i, /^exec@/i, /^board@/i
    ]
  },
  {
    department: 'Sales & Business Development',
    patterns: [
      /^sales@/i, /^satis@/i, /^pazarlama@/i, /^marketing@/i, /^business@/i,
      /^deals@/i, /^revenue@/i, /^ticaret@/i, /^growth@/i, /^commercial@/i,
      /^partners@/i, /^partner@/i, /^isgelistirme@/i, /^bizdev@/i, /^bayi@/i,
      /^teklif@/i, /^siparis@/i, /^orders@/i
    ]
  },
  {
    department: 'Human Resources & Talent',
    patterns: [
      /^hr@/i, /^kariyer@/i, /^ik@/i, /^jobs@/i, /^careers@/i, /^talent@/i,
      /^recruiting@/i, /^recruitment@/i, /^people@/i, /^isealim@/i, /^cv@/i,
      /^staj@/i, /^internship@/i, /^work@/i, /^hiring@/i
    ]
  },
  {
    department: 'Engineering & Technology',
    patterns: [
      /^dev@/i, /^developers?@/i, /^engineering@/i, /^tech@/i, /^it@/i,
      /^software@/i, /^admin@/i, /^security@/i, /^webmaster@/i, /^bilgiislem@/i,
      /^sistem@/i, /^sysadmin@/i, /^qa@/i, /^test@/i, /^support-tech@/i,
      /^infrastructure@/i, /^cloud@/i, /^data@/i
    ]
  },
  {
    department: 'Customer Support & Operations',
    patterns: [
      /^support@/i, /^destek@/i, /^help@/i, /^yardim@/i, /^service@/i,
      /^services@/i, /^musteri@/i, /^care@/i, /^cozum@/i, /^hizmet@/i,
      /^operasyon@/i, /^ops@/i, /^operations@/i, /^assist@/i, /^desk@/i
    ]
  },
  {
    department: 'Finance, Billing & Accounting',
    patterns: [
      /^finance@/i, /^accounting@/i, /^muhasebe@/i, /^mali@/i, /^billing@/i,
      /^invoices?@/i, /^odeme@/i, /^payments?@/i, /^accounts?@/i, /^fatura@/i,
      /^finans@/i, /^treasury@/i
    ]
  },
  {
    department: 'Legal, Privacy & Compliance',
    patterns: [
      /^legal@/i, /^hukuk@/i, /^kvkk@/i, /^privacy@/i, /^gizlilik@/i,
      /^compliance@/i, /^dpo@/i, /^terms@/i, /^avukat@/i, /^copyright@/i,
      /^taraf@/i
    ]
  },
  {
    department: 'Press, Media & Public Relations',
    patterns: [
      /^press@/i, /^media@/i, /^basin@/i, /^news@/i, /^pr@/i, /^editorial@/i,
      /^comms@/i, /^communications@/i, /^iletisim-basin@/i, /^medya@/i
    ]
  },
  {
    department: 'General Inquiries & Reception',
    patterns: [
      /^info@/i, /^contact@/i, /^iletisim@/i, /^hello@/i, /^merhaba@/i,
      /^hi@/i, /^mail@/i, /^genel@/i, /^danisma@/i, /^office@/i,
      /^santral@/i, /^merkez@/i, /^reception@/i
    ]
  }
];

const DEPARTMENT_KEYWORDS = [
  { department: 'Executive & Leadership', keywords: ['executive', 'management', 'director', 'yonetim', 'baskan', 'ceo', 'board', 'leadership', 'kurucu'] },
  { department: 'Sales & Business Development', keywords: ['sales', 'marketing', 'pazarlama', 'satis', 'business development', 'is gelistirme', 'commercial', 'growth'] },
  { department: 'Human Resources & Talent', keywords: ['human resources', 'insan kaynaklari', 'kariyer', 'careers', 'recruiting', 'recruitment', 'talent', 'jobs', 'ise alim'] },
  { department: 'Engineering & Technology', keywords: ['engineering', 'software', 'technology', 'developer', 'muhendislik', 'yazilim', 'bilgi islem', 'it team', 'technical'] },
  { department: 'Customer Support & Operations', keywords: ['support', 'customer care', 'destek', 'musteri hizmetleri', 'yardim', 'help desk', 'operations', 'operasyon'] },
  { department: 'Finance, Billing & Accounting', keywords: ['finance', 'accounting', 'muhasebe', 'finans', 'billing', 'mali isler', 'invoicing'] },
  { department: 'Legal, Privacy & Compliance', keywords: ['legal', 'hukuk', 'compliance', 'privacy', 'kvkk', 'dpo', 'gizlilik'] },
  { department: 'Press, Media & Public Relations', keywords: ['press', 'media', 'basin', 'public relations', 'pr', 'medya', 'haberler'] }
];

// Determine if a local-part looks like an individual's name (e.g. john.doe, ahmet_yilmaz)
function extractPersonNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const nameSeparatorRegex = /^[a-zA-Z]{2,}[._-][a-zA-Z]{2,}([._-][a-zA-Z]{2,})?$/;

  if (nameSeparatorRegex.test(localPart)) {
    const parts = localPart.split(/[._-]/);
    const capitalized = parts
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
    return capitalized;
  }
  return null;
}

// Clean and validate email string
function cleanAndValidateEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  let email = rawEmail.trim().toLowerCase();
  email = email.replace(/^[<"'\s]+|[>"'\s,;:.]+$|mailto:/g, '');

  // RFC basic pattern
  const rfcPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcPattern.test(email)) return null;

  for (const pattern of INVALID_EMAIL_PATTERNS) {
    if (pattern.test(email)) return null;
  }

  return email;
}

// De-obfuscate emails in text (e.g. name [at] domain [dot] com)
function deobfuscateText(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\[\s*at\s*\]|\(\s*at\s*\)|\{\s*at\s*\}|\s+at\s+/gi, '@')
    .replace(/\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+/gi, '.')
    .replace(/&#64;/g, '@')
    .replace(/&#46;/g, '.');
}

// Classify contact based on email, DOM context, role text, and page URL
function classifyContact(email, surroundingText, pageUrl, detectedRole) {
  // 1. Direct prefix matching
  for (const rule of DEPARTMENT_PREFIX_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(email)) {
        return rule.department;
      }
    }
  }

  // 2. Surrounding heading / card text analysis
  const combinedContext = `${surroundingText || ''} ${detectedRole || ''} ${pageUrl || ''}`.toLowerCase();
  for (const rule of DEPARTMENT_KEYWORDS) {
    for (const kw of rule.keywords) {
      if (combinedContext.includes(kw)) {
        return rule.department;
      }
    }
  }

  // 3. If individual person detected from email structure
  if (extractPersonNameFromEmail(email)) {
    return 'Direct Personnel';
  }

  return 'General Inquiries & Team';
}

// Extract emails and contextual data from a single HTML page
function extractPageEmails(html, pageUrl) {
  const $ = cheerio.load(html);
  const foundList = [];
  const seenEmails = new Set();

  // Strip script, style, SVG, noscript
  $('script, style, noscript, iframe, svg').remove();

  // Step 1: Mailto links (most reliable source)
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const rawEmail = href.replace(/^mailto:/i, '').split('?')[0];
    const cleaned = cleanAndValidateEmail(rawEmail);
    if (cleaned && !seenEmails.has(cleaned)) {
      seenEmails.add(cleaned);

      // DOM Context Discovery: find enclosing card, list item, or table row
      const parentContainer = $(el).closest('div, li, tr, article, section, p');
      const heading = parentContainer.find('h1, h2, h3, h4, h5, h6, strong, b').first().text().trim();
      const roleText = parentContainer.find('.role, .title, .position, .designation, span').not(el).text().trim();
      const parentText = parentContainer.text().replace(/\s+/g, ' ').slice(0, 300);

      // Person Name fallback
      let personName = null;
      if (heading && heading.length < 50 && !heading.includes('@') && !heading.toLowerCase().includes('email')) {
        personName = heading;
      }
      if (!personName) {
        personName = extractPersonNameFromEmail(cleaned);
      }

      const department = classifyContact(cleaned, parentText, pageUrl, roleText);

      foundList.push({
        email: cleaned,
        name: personName || 'N/A',
        role: roleText ? roleText.slice(0, 80) : 'N/A',
        department,
        sourceUrl: pageUrl,
        detectionMethod: 'mailto-link'
      });
    }
  });

  // Step 2: Plain text search across body text & de-obfuscation
  const bodyText = $('body').text() || '';
  const deobfuscated = deobfuscateText(bodyText);
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let match;

  while ((match = regex.exec(deobfuscated)) !== null) {
    const rawEmail = match[0];
    const cleaned = cleanAndValidateEmail(rawEmail);
    if (cleaned && !seenEmails.has(cleaned)) {
      seenEmails.add(cleaned);

      // Extract window around match for context
      const matchIndex = match.index;
      const start = Math.max(0, matchIndex - 120);
      const end = Math.min(deobfuscated.length, matchIndex + 120);
      const contextSnippet = deobfuscated.slice(start, end).replace(/\s+/g, ' ');

      const personName = extractPersonNameFromEmail(cleaned);
      const department = classifyContact(cleaned, contextSnippet, pageUrl, '');

      foundList.push({
        email: cleaned,
        name: personName || 'N/A',
        role: 'N/A',
        department,
        sourceUrl: pageUrl,
        detectionMethod: 'body-text'
      });
    }
  }

  // Step 3: Discover internal links on same origin
  const discoveredLinks = new Set();
  $('a[href]').each((_, el) => {
    try {
      const href = $(el).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      const absoluteUrl = new URL(href, pageUrl);
      // Strip query strings and hashes for cleaner crawling
      absoluteUrl.hash = '';
      absoluteUrl.search = '';

      const extMatch = absoluteUrl.pathname.match(/\.[a-z0-9]+$/i);
      if (extMatch && IGNORED_EXTENSIONS.has(extMatch[0].toLowerCase())) {
        return;
      }

      discoveredLinks.add(absoluteUrl.href);
    } catch {
      // Ignore malformed hrefs
    }
  });

  return {
    emails: foundList,
    links: Array.from(discoveredLinks)
  };
}

// ============================================================================
// CRAWL CONTROLLER ENDPOINT
// ============================================================================
router.post('/crawl', async (req, res) => {
  const { url, maxPages = 20, maxDepth = 2 } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid target website URL is required.' });
  }

  let parsedTarget;
  try {
    parsedTarget = await validateAndResolveUrl(url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const targetHost = parsedTarget.hostname.toLowerCase();
  const rootOrigin = parsedTarget.origin;
  const pageLimit = Math.min(Math.max(parseInt(maxPages, 10) || 20, 5), 50); // Safe cap 5 to 50
  const depthLimit = Math.min(Math.max(parseInt(maxDepth, 10) || 2, 1), 3);

  const queue = [{ url: parsedTarget.href, depth: 0 }];
  const visited = new Set();
  const crawledPages = [];
  const allEmailsMap = new Map(); // Keyed by email lower

  const startTime = Date.now();

  try {
    while (queue.length > 0 && visited.size < pageLimit) {
      const current = queue.shift();
      const currentUrl = current.url;
      const currentDepth = current.depth;

      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(currentUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CerilasCrawler/2.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8'
          },
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          crawledPages.push({
            url: currentUrl,
            status: response.status,
            emailsCount: 0,
            note: 'Skipped non-HTML'
          });
          continue;
        }

        const html = await response.text();
        const { emails, links } = extractPageEmails(html, currentUrl);

        emails.forEach(item => {
          if (!allEmailsMap.has(item.email)) {
            allEmailsMap.set(item.email, item);
          } else {
            // If already present, enrich if current has better name/department
            const existing = allEmailsMap.get(item.email);
            if (existing.name === 'N/A' && item.name !== 'N/A') {
              existing.name = item.name;
            }
            if (existing.role === 'N/A' && item.role !== 'N/A') {
              existing.role = item.role;
            }
            if (existing.department === 'General Inquiries & Team' && item.department !== 'General Inquiries & Team') {
              existing.department = item.department;
            }
          }
        });

        crawledPages.push({
          url: currentUrl,
          status: response.status,
          emailsCount: emails.length
        });

        // Add discovered links to queue if within depth limit and on same hostname
        if (currentDepth < depthLimit) {
          for (const link of links) {
            try {
              const linkObj = new URL(link);
              if (linkObj.hostname.toLowerCase() === targetHost && !visited.has(linkObj.href)) {
                queue.push({ url: linkObj.href, depth: currentDepth + 1 });
              }
            } catch {
              // Ignore invalid link
            }
          }
        }
      } catch (crawlErr) {
        crawledPages.push({
          url: currentUrl,
          status: 0,
          emailsCount: 0,
          error: crawlErr.message || 'Network error'
        });
      }
    }

    const emailList = Array.from(allEmailsMap.values());

    // Aggregate department breakdown
    const departmentBreakdown = {};
    const domainBreakdown = {};

    emailList.forEach(item => {
      departmentBreakdown[item.department] = (departmentBreakdown[item.department] || 0) + 1;
      const domain = item.email.split('@')[1];
      if (domain) {
        domainBreakdown[domain] = (domainBreakdown[domain] || 0) + 1;
      }
    });

    return res.json({
      success: true,
      targetDomain: targetHost,
      rootUrl: rootOrigin,
      durationMs: Date.now() - startTime,
      stats: {
        totalPagesCrawled: visited.size,
        totalEmailsFound: emailList.length,
        uniqueDepartmentsCount: Object.keys(departmentBreakdown).length,
        uniqueDomainsCount: Object.keys(domainBreakdown).length
      },
      departmentBreakdown,
      domainBreakdown,
      emails: emailList,
      crawledPages
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An error occurred during site crawling: ' + error.message
    });
  }
});

export default router;
