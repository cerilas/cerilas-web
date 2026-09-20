/**
 * Advanced Bot & Crawler Detection Utility
 * Accurately categorizes web traffic into Real Humans vs Search Engines, AI Crawlers, Social Scrapers, and Automated Scripts.
 */

const KNOWN_BOT_PATTERNS = [
  // 1. AI Search & LLM Crawlers
  { regex: /GPTBot/i, name: 'GPTBot', category: 'ai_crawler' },
  { regex: /ChatGPT-User/i, name: 'ChatGPT-User', category: 'ai_crawler' },
  { regex: /Claude-SearchBot/i, name: 'Claude-SearchBot', category: 'ai_crawler' },
  { regex: /Claude-User/i, name: 'Claude-User', category: 'ai_crawler' },
  { regex: /ClaudeBot/i, name: 'ClaudeBot', category: 'ai_crawler' },
  { regex: /PerplexityBot/i, name: 'PerplexityBot', category: 'ai_crawler' },
  { regex: /CCBot/i, name: 'CommonCrawl (CCBot)', category: 'ai_crawler' },
  { regex: /Bytespider/i, name: 'Bytespider (TikTok/ByteDance)', category: 'ai_crawler' },
  { regex: /cohere-ai/i, name: 'Cohere AI', category: 'ai_crawler' },
  { regex: /Diffbot/i, name: 'Diffbot', category: 'ai_crawler' },
  { regex: /FacebookBot/i, name: 'FacebookBot', category: 'ai_crawler' },
  { regex: /meta-externalagent/i, name: 'Meta External Agent', category: 'ai_crawler' },
  { regex: /Amazonbot/i, name: 'Amazonbot', category: 'ai_crawler' },
  { regex: /Timpibot/i, name: 'Timpibot', category: 'ai_crawler' },

  // 2. Search Engine Spiders
  { regex: /Googlebot/i, name: 'Googlebot', category: 'search_engine' },
  { regex: /Google-InspectionTool/i, name: 'Google Inspection Tool', category: 'search_engine' },
  { regex: /bingbot/i, name: 'Bingbot', category: 'search_engine' },
  { regex: /Applebot/i, name: 'Applebot', category: 'search_engine' },
  { regex: /YandexBot/i, name: 'YandexBot', category: 'search_engine' },
  { regex: /Baiduspider/i, name: 'Baiduspider', category: 'search_engine' },
  { regex: /DuckDuckBot/i, name: 'DuckDuckBot', category: 'search_engine' },
  { regex: /Slurp/i, name: 'Yahoo! Slurp', category: 'search_engine' },
  { regex: /Sogou/i, name: 'Sogou Spider', category: 'search_engine' },
  { regex: /PetalBot/i, name: 'PetalBot (Huawei)', category: 'search_engine' },

  // 3. Social Media & Link Preview Bots
  { regex: /Twitterbot/i, name: 'Twitterbot (X)', category: 'social_preview' },
  { regex: /facebookexternalhit/i, name: 'Facebook Preview', category: 'social_preview' },
  { regex: /LinkedInBot/i, name: 'LinkedInBot', category: 'social_preview' },
  { regex: /Slackbot/i, name: 'Slackbot', category: 'social_preview' },
  { regex: /TelegramBot/i, name: 'TelegramBot', category: 'social_preview' },
  { regex: /WhatsApp/i, name: 'WhatsApp Preview', category: 'social_preview' },
  { regex: /Discordbot/i, name: 'Discordbot', category: 'social_preview' },
  { regex: /Pinterestbot/i, name: 'Pinterestbot', category: 'social_preview' },

  // 4. Headless & Automated Testing Browsers
  { regex: /HeadlessChrome/i, name: 'Headless Chrome', category: 'automated_browser' },
  { regex: /PhantomJS/i, name: 'PhantomJS', category: 'automated_browser' },
  { regex: /Selenium/i, name: 'Selenium WebDriver', category: 'automated_browser' },
  { regex: /Puppeteer/i, name: 'Puppeteer', category: 'automated_browser' },
  { regex: /Playwright/i, name: 'Playwright', category: 'automated_browser' },
  { regex: /Cypress/i, name: 'Cypress', category: 'automated_browser' },

  // 5. CLI & HTTP Libraries
  { regex: /^curl/i, name: 'cURL Client', category: 'cli_tool' },
  { regex: /^Wget/i, name: 'Wget', category: 'cli_tool' },
  { regex: /Python-urllib/i, name: 'Python Urllib', category: 'script_scraper' },
  { regex: /python-requests/i, name: 'Python Requests', category: 'script_scraper' },
  { regex: /aiohttp/i, name: 'Python aiohttp', category: 'script_scraper' },
  { regex: /httpx/i, name: 'Python HTTPX', category: 'script_scraper' },
  { regex: /Go-http-client/i, name: 'Go HTTP Client', category: 'script_scraper' },
  { regex: /node-fetch/i, name: 'Node Fetch', category: 'script_scraper' },
  { regex: /axios/i, name: 'Axios Client', category: 'script_scraper' },
  { regex: /PostmanRuntime/i, name: 'Postman', category: 'cli_tool' },
  { regex: /insomnia/i, name: 'Insomnia', category: 'cli_tool' },

  // 6. Generic Bot Matchers
  { regex: /\bbot\b/i, name: 'Generic Bot', category: 'generic_bot' },
  { regex: /\bspider\b/i, name: 'Generic Spider', category: 'generic_bot' },
  { regex: /\bcrawler\b/i, name: 'Generic Crawler', category: 'generic_bot' },
  { regex: /\barchiver\b/i, name: 'Generic Web Archiver', category: 'generic_bot' },
  { regex: /\bscraper\b/i, name: 'Generic Scraper', category: 'script_scraper' }
];

/**
 * Evaluates an incoming HTTP request and client metadata to detect if it's a bot or real human.
 * @param {import('express').Request} req 
 * @param {Object} [clientMetadata] 
 * @returns {{ isBot: boolean, botName: string|null, category: string }}
 */
export function detectBot(req, clientMetadata = {}) {
  const ua = req.headers['user-agent'] || '';

  // 1. Client explicitly reported webdriver execution (e.g. navigator.webdriver === true)
  if (clientMetadata && clientMetadata.isWebDriver === true) {
    return {
      isBot: true,
      botName: 'Automated WebDriver',
      category: 'automated_browser'
    };
  }

  // 2. Empty or missing User-Agent is almost certainly automated script
  if (!ua || ua.trim().length === 0) {
    return {
      isBot: true,
      botName: 'Empty User-Agent',
      category: 'script_scraper'
    };
  }

  // 3. Match against known bot database
  for (const bot of KNOWN_BOT_PATTERNS) {
    if (bot.regex.test(ua)) {
      return {
        isBot: true,
        botName: bot.name,
        category: bot.category
      };
    }
  }

  // 4. Client passed legitimate browser indicators and failed bot tests
  return {
    isBot: false,
    botName: null,
    category: 'human'
  };
}
