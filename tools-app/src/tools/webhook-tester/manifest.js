export const webhookTesterManifest = {
  slug: 'webhook-tester',
  title: 'Webhook Tester & Sender',
  short_description: 'Send, test, and debug requests to external webhooks (Discord, Slack, Zapier, Stripe, custom APIs). Custom headers, HMAC signature generator, JSON body editor, response latency telemetry, and repeat testing.',
  shortDescription: 'Send, test, and debug requests to external webhooks (Discord, Slack, Zapier, Stripe, custom APIs). Custom headers, HMAC signature generator, JSON body editor, response latency telemetry, and repeat testing.',
  category: 'Developer Tool',
  icon_name: 'Webhook',
  iconName: 'Webhook',
  badge: 'Sender & Tester',
  targetUrl: '#/tool/webhook-tester',
  seoTitle: 'Free Online Webhook Tester & Sender (2026) – Test Discord, Slack & Custom Webhooks | Cerilas Tools',
  seoDescription: 'Send and test requests to external webhooks online. Built-in templates for Discord, Slack, Telegram, Stripe, and Zapier. Custom HTTP methods, headers, HMAC-SHA256 signature generator, response inspector, and cURL replay.',
  features: [
    'Send Webhooks to Any External URL: Test Discord, Slack, Zapier, Make, n8n, Stripe, and custom API webhooks',
    'Pre-Configured Platform Templates: Instant 1-click payloads for Discord, Slack, Telegram, Stripe, and GitHub',
    'Dynamic Variables: Auto-replace {{timestamp}}, {{uuid}}, {{iso_date}}, and {{random_id}} on dispatch',
    'HMAC Signature Generator: Calculate SHA-256 / SHA-1 signatures for secure webhook authentication',
    'Deep Response Inspector: Inspect status codes (200, 204, 400, 500), response latency in ms, headers, and body',
    'Custom Headers Editor: Add authorization tokens, custom secret headers, and content types',
    'cURL Command Generator: 1-click copy ready-to-run terminal cURL commands for any dispatched webhook',
    '100% Free & Ad-Free: Instant developer testing with zero signup or API key requirements'
  ],
  seo: {
    title: "Free Online Webhook Tester & Debugger (2026) | Cerilas Tools",
    description: "Test and inspect incoming webhooks in real time with unique live URLs. Inspect headers, JSON payloads, query parameters, and simulate mock HTTP responses.",
    keywords: "webhook tester, test webhooks online, debug webhook, stripe webhook tester, webhook simulator, http request inspector, test api callbacks",
    ogImage: 'https://tools.cerilas.com/tool-icons/webhook-tester.webp',
    ogImageAlt: "Free Online Webhook Tester & Debugger (2026) | Cerilas Tools",
    breadcrumbsName: "Webhook Tester",
    faq: [
        {
            "q": "How long do temporary webhook testing URLs remain active?",
            "a": "Webhook URLs remain active for 24 hours of inactivity. You can generate new endpoints with one click whenever needed."
        },
        {
            "q": "Can I test webhooks sent by Stripe, GitHub, Shopify, and Slack?",
            "a": "Yes. The endpoints accept standard HTTP/HTTPS POST, PUT, PATCH, and GET calls from any external service."
        },
        {
            "q": "Does the tester support customizing HTTP response status codes and headers?",
            "a": "Yes. You can configure custom return status codes (200, 201, 400, 500) and response bodies to simulate success or error handling."
        },
        {
            "q": "Is my webhook payload data secure and private?",
            "a": "Yes. Endpoints are protected with random cryptographic UUIDs, and event payloads are stored ephemerally in memory without permanent persistence."
        }
    ]
  }
};
