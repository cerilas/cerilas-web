/**
 * Advanced Bot & Crawler Detection Utility
 * Accurately categorizes web traffic into Real Humans vs Search Engines, AI Crawlers, Social Scrapers, and Automated Scripts.
 */

const KNOWN_BOT_PATTERNS = [
  // 1. AI Search & LLM Crawlers
  { regex: /OAI-SearchBot/i, name: 'OAI-SearchBot', category: 'ai_crawler' },
  { regex: /GPTBot/i, name: 'GPTBot', category: 'ai_crawler' },
  { regex: /ChatGPT-User/i, name: 'ChatGPT-User', category: 'ai_crawler' },
  { regex: /Claude-SearchBot/i, name: 'Claude-SearchBot', category: 'ai_crawler' },
  { regex: /Claude-User/i, name: 'Claude-User', category: 'ai_crawler' },
  { regex: /Claude-Web/i, name: 'Claude-Web', category: 'ai_crawler' },
  { regex: /ClaudeBot|anthropic-ai/i, name: 'ClaudeBot', category: 'ai_crawler' },
  { regex: /Perplexity-User/i, name: 'Perplexity-User', category: 'ai_crawler' },
  { regex: /PerplexityBot/i, name: 'PerplexityBot', category: 'ai_crawler' },
  { regex: /Google-Extended|GoogleOther|Google-CloudVertexBot/i, name: 'Google AI (Extended/Other)', category: 'ai_crawler' },
  { regex: /Applebot-Extended/i, name: 'Applebot-Extended', category: 'ai_crawler' },
  { regex: /MistralAI-User/i, name: 'MistralAI-User', category: 'ai_crawler' },
  { regex: /DeepSeekBot/i, name: 'DeepSeekBot', category: 'ai_crawler' },
  { regex: /YouBot/i, name: 'YouBot', category: 'ai_crawler' },
  { regex: /PhindBot/i, name: 'PhindBot', category: 'ai_crawler' },
  { regex: /CCBot/i, name: 'CommonCrawl (CCBot)', category: 'ai_crawler' },
  { regex: /Bytespider/i, name: 'Bytespider (TikTok/ByteDance)', category: 'ai_crawler' },
  { regex: /cohere-ai|cohere-training/i, name: 'Cohere AI', category: 'ai_crawler' },
  { regex: /Diffbot/i, name: 'Diffbot', category: 'ai_crawler' },
  { regex: /FacebookBot/i, name: 'FacebookBot', category: 'ai_crawler' },
  { regex: /meta-externalagent|meta-externalfetcher/i, name: 'Meta External Agent', category: 'ai_crawler' },
  { regex: /Amazonbot/i, name: 'Amazonbot', category: 'ai_crawler' },
  { regex: /Timpibot/i, name: 'Timpibot', category: 'ai_crawler' },
  { regex: /ImagesiftBot/i, name: 'ImagesiftBot', category: 'ai_crawler' },
  { regex: /omgili/i, name: 'Omgili', category: 'ai_crawler' },

  // 2. Search Engine Spiders
  { regex: /AdsBot-Google|Mediapartners-Google|Storebot-Google|Google-Read-Aloud|APIs-Google|FeedFetcher-Google|Google-Site-Verification|Google-Safety/i, name: 'Google Services Bot', category: 'search_engine' },
  { regex: /Googlebot/i, name: 'Googlebot', category: 'search_engine' },
  { regex: /Google-InspectionTool/i, name: 'Google Inspection Tool', category: 'search_engine' },
  { regex: /bingbot|BingPreview|adidxbot|msnbot/i, name: 'Bingbot', category: 'search_engine' },
  { regex: /Applebot/i, name: 'Applebot', category: 'search_engine' },
  { regex: /YandexBot|YandexImages|YandexMobileBot|YandexRenderResourcesBot|Yandex\.com\/bots/i, name: 'YandexBot', category: 'search_engine' },
  { regex: /Baiduspider/i, name: 'Baiduspider', category: 'search_engine' },
  { regex: /DuckDuckBot|DuckAssistBot/i, name: 'DuckDuckBot', category: 'search_engine' },
  { regex: /Slurp/i, name: 'Yahoo! Slurp', category: 'search_engine' },
  { regex: /Sogou/i, name: 'Sogou Spider', category: 'search_engine' },
  { regex: /PetalBot|AspiegelBot/i, name: 'PetalBot (Huawei)', category: 'search_engine' },
  { regex: /SeznamBot/i, name: 'SeznamBot', category: 'search_engine' },
  { regex: /Qwantify|Qwantbot/i, name: 'Qwant', category: 'search_engine' },
  { regex: /Yeti\//i, name: 'Naver Yeti', category: 'search_engine' },
  { regex: /MojeekBot/i, name: 'MojeekBot', category: 'search_engine' },
  { regex: /YisouSpider/i, name: 'YisouSpider', category: 'search_engine' },
  { regex: /coccocbot/i, name: 'Coc Coc Bot', category: 'search_engine' },

  // 3. SEO Tools & Marketing Crawlers
  { regex: /AhrefsBot|AhrefsSiteAudit/i, name: 'AhrefsBot', category: 'seo_crawler' },
  { regex: /SemrushBot|SiteAuditBot|SplitSignalBot/i, name: 'SemrushBot', category: 'seo_crawler' },
  { regex: /MJ12bot/i, name: 'Majestic (MJ12bot)', category: 'seo_crawler' },
  { regex: /DotBot|rogerbot/i, name: 'Moz (DotBot)', category: 'seo_crawler' },
  { regex: /BLEXBot/i, name: 'BLEXBot', category: 'seo_crawler' },
  { regex: /DataForSeoBot/i, name: 'DataForSeoBot', category: 'seo_crawler' },
  { regex: /Screaming Frog/i, name: 'Screaming Frog', category: 'seo_crawler' },
  { regex: /serpstatbot/i, name: 'Serpstat', category: 'seo_crawler' },
  { regex: /barkrowler/i, name: 'Barkrowler', category: 'seo_crawler' },
  { regex: /SEOkicks|seokicks/i, name: 'SEOkicks', category: 'seo_crawler' },
  { regex: /Sitebulb/i, name: 'Sitebulb', category: 'seo_crawler' },

  // 4. Monitoring, Performance & Security Scanners
  { regex: /Chrome-Lighthouse|Lighthouse/i, name: 'Lighthouse / PageSpeed', category: 'monitoring' },
  { regex: /GTmetrix/i, name: 'GTmetrix', category: 'monitoring' },
  { regex: /UptimeRobot/i, name: 'UptimeRobot', category: 'monitoring' },
  { regex: /Pingdom/i, name: 'Pingdom', category: 'monitoring' },
  { regex: /StatusCake/i, name: 'StatusCake', category: 'monitoring' },
  { regex: /Site24x7/i, name: 'Site24x7', category: 'monitoring' },
  { regex: /Better ?Uptime|BetterStack/i, name: 'Better Stack', category: 'monitoring' },
  { regex: /Datadog|NewRelicPinger|Checkly/i, name: 'Synthetic Monitor', category: 'monitoring' },
  { regex: /CensysInspect|Expanse|zgrab|masscan|Nmap|Nuclei|Nessus|sqlmap/i, name: 'Security Scanner', category: 'monitoring' },

  // 5. Social Media & Link Preview Bots
  { regex: /Twitterbot/i, name: 'Twitterbot (X)', category: 'social_preview' },
  { regex: /facebookexternalhit|facebookcatalog/i, name: 'Facebook Preview', category: 'social_preview' },
  { regex: /LinkedInBot/i, name: 'LinkedInBot', category: 'social_preview' },
  { regex: /Slackbot|Slack-ImgProxy/i, name: 'Slackbot', category: 'social_preview' },
  { regex: /TelegramBot/i, name: 'TelegramBot', category: 'social_preview' },
  { regex: /WhatsApp/i, name: 'WhatsApp Preview', category: 'social_preview' },
  { regex: /Discordbot/i, name: 'Discordbot', category: 'social_preview' },
  { regex: /Pinterestbot/i, name: 'Pinterestbot', category: 'social_preview' },
  { regex: /redditbot/i, name: 'Redditbot', category: 'social_preview' },
  { regex: /SkypeUriPreview/i, name: 'Skype Preview', category: 'social_preview' },
  { regex: /Embedly|Iframely|vkShare/i, name: 'Link Preview Service', category: 'social_preview' },

  // 6. Headless & Automated Testing Browsers
  { regex: /HeadlessChrome/i, name: 'Headless Chrome', category: 'automated_browser' },
  { regex: /PhantomJS/i, name: 'PhantomJS', category: 'automated_browser' },
  { regex: /Selenium/i, name: 'Selenium WebDriver', category: 'automated_browser' },
  { regex: /Puppeteer/i, name: 'Puppeteer', category: 'automated_browser' },
  { regex: /Playwright/i, name: 'Playwright', category: 'automated_browser' },
  { regex: /Cypress/i, name: 'Cypress', category: 'automated_browser' },
  { regex: /jsdom|Nightmare/i, name: 'Scripted Browser', category: 'automated_browser' },

  // 7. CLI & HTTP Libraries
  { regex: /^curl/i, name: 'cURL Client', category: 'cli_tool' },
  { regex: /^Wget/i, name: 'Wget', category: 'cli_tool' },
  { regex: /Python-urllib/i, name: 'Python Urllib', category: 'script_scraper' },
  { regex: /python-requests/i, name: 'Python Requests', category: 'script_scraper' },
  { regex: /aiohttp/i, name: 'Python aiohttp', category: 'script_scraper' },
  { regex: /httpx/i, name: 'Python HTTPX', category: 'script_scraper' },
  { regex: /Scrapy/i, name: 'Scrapy', category: 'script_scraper' },
  { regex: /Go-http-client/i, name: 'Go HTTP Client', category: 'script_scraper' },
  { regex: /node-fetch|undici|^node$/i, name: 'Node Fetch', category: 'script_scraper' },
  { regex: /axios/i, name: 'Axios Client', category: 'script_scraper' },
  { regex: /okhttp/i, name: 'OkHttp', category: 'script_scraper' },
  { regex: /Java\/|Apache-HttpClient/i, name: 'Java HTTP Client', category: 'script_scraper' },
  { regex: /libwww-perl|LWP::Simple/i, name: 'Perl LWP', category: 'script_scraper' },
  { regex: /Ruby|Faraday/i, name: 'Ruby HTTP Client', category: 'script_scraper' },
  { regex: /GuzzleHttp|^PHP/i, name: 'PHP HTTP Client', category: 'script_scraper' },
  { regex: /PostmanRuntime/i, name: 'Postman', category: 'cli_tool' },
  { regex: /insomnia/i, name: 'Insomnia', category: 'cli_tool' },
  { regex: /HeadlessBrowser|HTTrack|WebCopier|Offline Explorer/i, name: 'Site Downloader', category: 'script_scraper' },

  // 8. Generic Bot Matchers (word ending in bot/crawler/spider, e.g. "FooBot/1.0")
  { regex: /bot(?:[\s/;)_-]|$)/i, name: 'Generic Bot', category: 'generic_bot' },
  { regex: /spider/i, name: 'Generic Spider', category: 'generic_bot' },
  { regex: /crawl/i, name: 'Generic Crawler', category: 'generic_bot' },
  { regex: /archiver|ia_archiver/i, name: 'Generic Web Archiver', category: 'generic_bot' },
  { regex: /scraper|scrape/i, name: 'Generic Scraper', category: 'script_scraper' },
  { regex: /https?:\/\/|\+http|@[a-z0-9-]+\.[a-z]{2,}/i, name: 'Self-identified Crawler', category: 'generic_bot' }
];

// Real devices whose model names would otherwise trip the generic "bot" matcher.
const HUMAN_UA_EXCEPTIONS = /\bCubot\b|\bBotim\b/i;

// Real browsers (including in-app webviews) always send a Mozilla/ or Opera/ product token.
const BROWSER_UA = /^(Mozilla|Opera)\//;

/**
 * Evaluates an incoming HTTP request and client metadata to detect if it's a bot or real human.
 * @param {import('express').Request} req 
 * @param {Object} [clientMetadata] 
 * @returns {{ isBot: boolean, botName: string|null, category: string }}
 */
export function detectBot(req, clientMetadata = {}) {
  const ua = (req.headers['user-agent'] || '').trim();

  // 1. Client explicitly reported webdriver execution (e.g. navigator.webdriver === true)
  if (clientMetadata && clientMetadata.isWebDriver === true) {
    return {
      isBot: true,
      botName: 'Automated WebDriver',
      category: 'automated_browser'
    };
  }

  // 2. Empty or missing User-Agent is almost certainly automated script
  if (!ua) {
    return {
      isBot: true,
      botName: 'Empty User-Agent',
      category: 'script_scraper'
    };
  }

  // 3. Match against known bot database
  const uaForMatching = ua.replace(HUMAN_UA_EXCEPTIONS, '');
  for (const bot of KNOWN_BOT_PATTERNS) {
    if (bot.regex.test(uaForMatching)) {
      return {
        isBot: true,
        botName: bot.name,
        category: bot.category
      };
    }
  }

  // 4. Anything that is not a browser product token is a script/library
  if (!BROWSER_UA.test(ua)) {
    return {
      isBot: true,
      botName: 'Non-browser Client',
      category: 'script_scraper'
    };
  }

  // 5. Headless environment signals reported by the browser itself
  const signals = clientMetadata?.clientSignals;
  if (signals && typeof signals === 'object') {
    const headlessHints = [
      signals.languages === 0,
      signals.zeroWindow === true,
      signals.noPlugins === true && /Chrome\//.test(ua) && !/Mobile|Android/i.test(ua)
    ].filter(Boolean).length;
    if (headlessHints >= 2) {
      return {
        isBot: true,
        botName: 'Headless Browser (signals)',
        category: 'automated_browser'
      };
    }
  }

  return {
    isBot: false,
    botName: null,
    category: 'human'
  };
}
