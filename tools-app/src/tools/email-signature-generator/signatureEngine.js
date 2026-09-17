/**
 * Premium Email Signature Engine for Cerilas Tools
 * Generates email-client compliant, table-based HTML signatures
 * that render cleanly across Outlook, Gmail, Apple Mail, Thunderbird, and Mobile.
 */

export const FONT_OPTIONS = [
  { id: 'arial', name: 'Arial (Modern & Universal)', value: 'Arial, Helvetica, sans-serif' },
  { id: 'helvetica', name: 'Helvetica (Clean Executive)', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id: 'georgia', name: 'Georgia (Editorial Serif)', value: 'Georgia, Times, "Times New Roman", serif' },
  { id: 'verdana', name: 'Verdana (High Legibility)', value: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', name: 'Trebuchet MS (Contemporary)', value: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  { id: 'tahoma', name: 'Tahoma (Crisp Sans)', value: 'Tahoma, Geneva, sans-serif' }
];

export const TEMPLATES = [
  { 
    id: 'modern', 
    name: 'Modern Minimalist', 
    desc: 'Side-by-side logo with vertical brand divider',
    icon: 'Sparkles',
    badge: 'Popular'
  },
  { 
    id: 'classic', 
    name: 'Corporate Executive', 
    desc: 'Structured header with horizontal accent line',
    icon: 'Building',
    badge: 'Formal'
  },
  { 
    id: 'compact', 
    name: 'Compact Linear', 
    desc: 'Space-saving inline layout for high-volume mail',
    icon: 'Sliders',
    badge: 'Minimal'
  },
  { 
    id: 'card', 
    name: 'Executive Card', 
    desc: 'Framed card container with action CTA and social badges',
    icon: 'Palette',
    badge: 'High Impact'
  }
];

export const ACCENT_PALETTE = [
  '#2563eb', // Cerilas Blue
  '#4f46e5', // Royal Indigo
  '#0d9488', // Nordic Teal
  '#10b981', // Emerald Green
  '#f59e0b', // Warm Amber
  '#ea580c', // Electric Orange
  '#e11d48', // Crimson Rose
  '#9333ea', // Deep Violet
  '#0f172a'  // Midnight Slate
];

export const SOCIAL_PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', iconText: 'in', color: '#0a66c2', placeholder: 'https://linkedin.com/in/username' },
  { id: 'twitter', name: 'X (Twitter)', iconText: '𝕏', color: '#000000', placeholder: 'https://x.com/username' },
  { id: 'github', name: 'GitHub', iconText: 'GH', color: '#24292e', placeholder: 'https://github.com/username' },
  { id: 'calendly', name: 'Calendly / Booking', iconText: 'Meet', color: '#006bff', placeholder: 'https://calendly.com/username' },
  { id: 'instagram', name: 'Instagram', iconText: 'IG', color: '#e1306c', placeholder: 'https://instagram.com/username' },
  { id: 'youtube', name: 'YouTube', iconText: 'YT', color: '#ff0000', placeholder: 'https://youtube.com/@channel' },
  { id: 'facebook', name: 'Facebook', iconText: 'FB', color: '#1877f2', placeholder: 'https://facebook.com/page' },
  { id: 'whatsapp', name: 'WhatsApp', iconText: 'WA', color: '#25d366', placeholder: 'https://wa.me/15551234567' }
];

export const INITIAL_SIGNATURE_DATA = {
  fullName: 'Sarah Jenkins',
  jobTitle: 'VP of Product Operations',
  department: 'Product & Design',
  companyName: 'Acme Global Inc.',
  email: 'sarah.jenkins@acme.com',
  phone: '+1 (555) 234-5678',
  mobile: '+1 (555) 876-5432',
  website: 'https://cerilas.com',
  address: '500 Howard St, San Francisco, CA',
  
  // Logo & Avatar
  logoUrl: '',
  logoShape: 'rounded', // 'circle' | 'square' | 'rounded'
  logoSize: 76, // 48 to 130 px

  // Theme & Styling
  accentColor: '#2563eb',
  textColor: '#1e293b',
  subtextColor: '#64748b',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 'medium', // 'small' | 'medium' | 'large'
  template: 'modern',

  // Social Links
  socials: {
    linkedin: 'https://linkedin.com/in/sarahjenkins',
    twitter: 'https://x.com/sarahjenkins',
    github: 'https://github.com/acme',
    instagram: '',
    youtube: '',
    facebook: '',
    whatsapp: '',
    calendly: 'https://calendly.com/sarah-jenkins'
  },

  // Custom Fields
  customFields: [
    { id: 'cf-1', label: 'Pronouns', value: 'she/her', link: '' },
    { id: 'cf-2', label: 'Calendar', value: 'Book 15 mins on Calendly', link: 'https://calendly.com' }
  ],

  // Disclaimer & CTA
  ctaEnabled: true,
  ctaText: 'Schedule a Product Demo',
  ctaUrl: 'https://cerilas.com',
  ctaColor: '#2563eb',
  disclaimer: 'The content of this email is confidential and intended solely for the recipient. If you have received it in error, please notify us immediately.'
};

/**
 * Clean URL helper to ensure protocol exists
 */
export function ensureUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Generate high-converting branded social icon badge
 */
function renderSocialBadge(platform, url) {
  if (!url || !url.trim()) return '';

  const cfg = SOCIAL_PLATFORMS.find(p => p.id === platform) || {
    iconText: platform.slice(0, 2).toUpperCase(),
    color: '#334155'
  };

  const href = ensureUrl(url);

  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block; text-decoration:none; margin-right:6px; margin-bottom:4px;"><span style="display:inline-block; padding:2px 7px; border-radius:10px; background-color:${cfg.color}; color:#ffffff; font-size:10px; font-weight:bold; font-family:Arial, sans-serif; line-height:1.3; text-decoration:none;">${cfg.iconText}</span></a>`;
}

/**
 * Generate full HTML email signature string
 */
export function generateSignatureHtml(data) {
  const {
    fullName = '',
    jobTitle = '',
    department = '',
    companyName = '',
    email = '',
    phone = '',
    mobile = '',
    website = '',
    address = '',
    logoUrl = '',
    logoShape = 'rounded',
    logoSize = 76,
    accentColor = '#2563eb',
    textColor = '#1e293b',
    subtextColor = '#64748b',
    fontFamily = 'Arial, Helvetica, sans-serif',
    template = 'modern',
    socials = {},
    customFields = [],
    ctaEnabled = false,
    ctaText = '',
    ctaUrl = '',
    ctaColor = '#2563eb',
    disclaimer = ''
  } = data;

  const borderRadius = logoShape === 'circle' ? '50%' : logoShape === 'rounded' ? '12px' : '0px';
  const cleanWebsite = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const websiteHref = ensureUrl(website);

  // Collect active social badges
  const socialBadges = Object.keys(socials)
    .filter(k => socials[k] && socials[k].trim())
    .map(k => renderSocialBadge(k, socials[k]))
    .join('');

  // Collect custom fields HTML
  const customFieldsHtml = customFields
    .filter(f => f.label && f.value)
    .map(f => {
      const valContent = f.link
        ? `<a href="${ensureUrl(f.link)}" target="_blank" rel="noopener noreferrer" style="color:${accentColor}; text-decoration:underline;">${f.value}</a>`
        : `<span style="color:${textColor}; font-weight:500;">${f.value}</span>`;
      return `<tr style="line-height:1.4;"><td style="font-size:12px; color:${subtextColor}; padding-top:2px; font-family:${fontFamily};"><strong style="color:${subtextColor};">${f.label}:</strong> ${valContent}</td></tr>`;
    })
    .join('');

  // CTA Button HTML
  const ctaHtml = (ctaEnabled && ctaText && ctaUrl) ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px; border-collapse:collapse;">
      <tr>
        <td align="center" style="border-radius:6px; background-color:${ctaColor || accentColor};">
          <a href="${ensureUrl(ctaUrl)}" target="_blank" rel="noopener noreferrer" style="font-family:${fontFamily}; font-size:12px; font-weight:bold; color:#ffffff; text-decoration:none; padding:8px 16px; display:inline-block; border-radius:6px;">
            ${ctaText} &rarr;
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  // Disclaimer HTML
  const disclaimerHtml = disclaimer ? `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:540px; margin-top:12px; border-top:1px dashed #cbd5e1; border-collapse:collapse;">
      <tr>
        <td style="font-size:10px; color:#94a3b8; line-height:1.4; padding-top:8px; font-family:${fontFamily}; font-style:italic;">
          ${disclaimer}
        </td>
      </tr>
    </table>
  ` : '';

  // Logo Table Cell
  const logoCell = logoUrl ? `
    <td valign="middle" style="padding-right:16px;">
      <img src="${logoUrl}" alt="${companyName || fullName}" width="${logoSize}" height="${logoSize}" style="width:${logoSize}px; height:${logoSize}px; object-fit:cover; border-radius:${borderRadius}; display:block; border:0; outline:none;" />
    </td>
  ` : '';

  // ==================== TEMPLATE 1: MODERN (DEFAULT) ====================
  if (template === 'modern') {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily}; color:${textColor}; line-height:1.4; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tr>
    <td valign="middle">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          ${logoUrl ? `<td valign="top" style="width:2px; background-color:${accentColor}; font-size:1px; line-height:1px;">&nbsp;</td>` : ''}
          <td valign="middle" style="${logoUrl ? 'padding-left:16px;' : ''}">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${fullName ? `<tr><td style="font-size:16px; font-weight:bold; color:${textColor}; line-height:1.2; font-family:${fontFamily}; letter-spacing:-0.01em;">${fullName}</td></tr>` : ''}
              ${(jobTitle || department || companyName) ? `
                <tr>
                  <td style="font-size:13px; color:${subtextColor}; padding-top:2px; line-height:1.3; font-family:${fontFamily};">
                    ${jobTitle ? `<span style="font-weight:600; color:${accentColor};">${jobTitle}</span>` : ''}
                    ${jobTitle && (department || companyName) ? ' &bull; ' : ''}
                    ${department ? `<span>${department}</span>` : ''}
                    ${department && companyName ? ', ' : ''}
                    ${companyName ? `<strong>${companyName}</strong>` : ''}
                  </td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding-top:8px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px; line-height:1.5; color:${textColor}; font-family:${fontFamily}; border-collapse:collapse;">
                    ${email ? `<tr><td style="color:${subtextColor}; font-weight:600; padding-right:8px;">Email:</td><td><a href="mailto:${email}" style="color:${accentColor}; text-decoration:none;">${email}</a></td></tr>` : ''}
                    ${phone ? `<tr><td style="color:${subtextColor}; font-weight:600; padding-right:8px;">Phone:</td><td><a href="tel:${phone}" style="color:${textColor}; text-decoration:none;">${phone}</a></td></tr>` : ''}
                    ${mobile ? `<tr><td style="color:${subtextColor}; font-weight:600; padding-right:8px;">Mobile:</td><td><a href="tel:${mobile}" style="color:${textColor}; text-decoration:none;">${mobile}</a></td></tr>` : ''}
                    ${website ? `<tr><td style="color:${subtextColor}; font-weight:600; padding-right:8px;">Web:</td><td><a href="${websiteHref}" target="_blank" rel="noopener noreferrer" style="color:${accentColor}; text-decoration:none; font-weight:500;">${cleanWebsite}</a></td></tr>` : ''}
                    ${address ? `<tr><td style="color:${subtextColor}; font-weight:600; padding-right:8px;">Address:</td><td><span style="color:${subtextColor};">${address}</span></td></tr>` : ''}
                    ${customFieldsHtml}
                  </table>
                </td>
              </tr>
              ${socialBadges ? `
                <tr>
                  <td style="padding-top:10px;">
                    ${socialBadges}
                  </td>
                </tr>
              ` : ''}
              ${ctaHtml ? `<tr><td style="padding-top:4px;">${ctaHtml}</td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${disclaimerHtml ? `<tr><td>${disclaimerHtml}</td></tr>` : ''}
</table>`.trim();
  }

  // ==================== TEMPLATE 2: CORPORATE CLASSIC ====================
  if (template === 'classic') {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily}; color:${textColor}; line-height:1.4; border-collapse:collapse; max-width:540px;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td valign="middle">
            ${fullName ? `<div style="font-size:18px; font-weight:bold; color:${accentColor}; line-height:1.2; font-family:${fontFamily};">${fullName}</div>` : ''}
            ${jobTitle ? `<div style="font-size:13px; font-weight:600; color:${textColor}; padding-top:2px; font-family:${fontFamily};">${jobTitle}${companyName ? ` | ${companyName}` : ''}</div>` : ''}
          </td>
          ${logoUrl ? `
            <td align="right" valign="middle">
              <img src="${logoUrl}" alt="${companyName || fullName}" width="${logoSize}" height="${logoSize}" style="width:${logoSize}px; height:${logoSize}px; object-fit:cover; border-radius:${borderRadius}; display:block; border:0;" />
            </td>
          ` : ''}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:6px; padding-bottom:8px;">
      <div style="height:2px; background-color:${accentColor}; width:100%;"></div>
    </td>
  </tr>
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px; color:${textColor}; line-height:1.5; font-family:${fontFamily}; border-collapse:collapse;">
        ${email ? `<tr><td style="padding-right:12px;"><strong>E:</strong> <a href="mailto:${email}" style="color:${accentColor}; text-decoration:none;">${email}</a></td></tr>` : ''}
        ${phone ? `<tr><td style="padding-right:12px;"><strong>P:</strong> <a href="tel:${phone}" style="color:${textColor}; text-decoration:none;">${phone}</a></td></tr>` : ''}
        ${website ? `<tr><td style="padding-right:12px;"><strong>W:</strong> <a href="${websiteHref}" target="_blank" rel="noopener noreferrer" style="color:${accentColor}; text-decoration:none;">${cleanWebsite}</a></td></tr>` : ''}
        ${address ? `<tr><td><strong>A:</strong> ${address}</td></tr>` : ''}
        ${customFieldsHtml}
      </table>
    </td>
  </tr>
  ${socialBadges ? `<tr><td style="padding-top:10px;">${socialBadges}</td></tr>` : ''}
  ${ctaHtml ? `<tr><td>${ctaHtml}</td></tr>` : ''}
  ${disclaimerHtml ? `<tr><td>${disclaimerHtml}</td></tr>` : ''}
</table>`.trim();
  }

  // ==================== TEMPLATE 3: COMPACT HORIZONTAL ====================
  if (template === 'compact') {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily}; color:${textColor}; line-height:1.4; border-collapse:collapse;">
  <tr>
    <td valign="middle">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoUrl ? `
            <td valign="middle" style="padding-right:12px;">
              <img src="${logoUrl}" alt="${companyName || fullName}" width="${Math.min(logoSize, 56)}" height="${Math.min(logoSize, 56)}" style="width:${Math.min(logoSize, 56)}px; height:${Math.min(logoSize, 56)}px; object-fit:cover; border-radius:${borderRadius}; display:block; border:0;" />
            </td>
          ` : ''}
          <td valign="middle">
            <div style="font-size:14px; font-weight:bold; color:${textColor};">
              ${fullName} <span style="font-size:12px; font-weight:normal; color:${subtextColor};">| ${jobTitle} ${companyName ? `at ${companyName}` : ''}</span>
            </div>
            <div style="font-size:12px; color:${subtextColor}; padding-top:2px;">
              ${email ? `<a href="mailto:${email}" style="color:${accentColor}; text-decoration:none;">${email}</a>` : ''}
              ${phone ? ` &bull; <a href="tel:${phone}" style="color:${textColor}; text-decoration:none;">${phone}</a>` : ''}
              ${website ? ` &bull; <a href="${websiteHref}" target="_blank" rel="noopener noreferrer" style="color:${accentColor}; text-decoration:none;">${cleanWebsite}</a>` : ''}
            </div>
            ${socialBadges ? `<div style="padding-top:6px;">${socialBadges}</div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${customFields.length > 0 ? `
    <tr>
      <td style="padding-top:6px;">
        <table cellpadding="0" cellspacing="0" border="0" style="font-size:11px; color:${subtextColor};">${customFieldsHtml}</table>
      </td>
    </tr>
  ` : ''}
  ${ctaHtml ? `<tr><td>${ctaHtml}</td></tr>` : ''}
  ${disclaimerHtml ? `<tr><td>${disclaimerHtml}</td></tr>` : ''}
</table>`.trim();
  }

  // ==================== TEMPLATE 4: EXECUTIVE CARD ====================
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily}; border:1px solid #e2e8f0; border-radius:12px; background-color:#ffffff; padding:16px 20px; max-width:500px; border-collapse:collapse; box-shadow:0 4px 14px rgba(0,0,0,0.05);">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          ${logoUrl ? `
            <td valign="middle" style="padding-right:16px; width:${logoSize}px;">
              <img src="${logoUrl}" alt="${companyName || fullName}" width="${logoSize}" height="${logoSize}" style="width:${logoSize}px; height:${logoSize}px; object-fit:cover; border-radius:${borderRadius}; display:block; border:0;" />
            </td>
          ` : ''}
          <td valign="middle">
            <div style="font-size:17px; font-weight:bold; color:${textColor}; line-height:1.2;">${fullName}</div>
            <div style="font-size:13px; font-weight:600; color:${accentColor}; padding-top:2px;">${jobTitle}</div>
            <div style="font-size:12px; color:${subtextColor};">${companyName}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:12px; border-top:1px solid #f1f5f9; margin-top:10px;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px; line-height:1.5; color:${textColor}; font-family:${fontFamily}; border-collapse:collapse;">
        ${email ? `<tr><td style="color:${subtextColor}; font-weight:600; width:55px;">Email:</td><td><a href="mailto:${email}" style="color:${accentColor}; text-decoration:none;">${email}</a></td></tr>` : ''}
        ${phone ? `<tr><td style="color:${subtextColor}; font-weight:600;">Phone:</td><td><a href="tel:${phone}" style="color:${textColor}; text-decoration:none;">${phone}</a></td></tr>` : ''}
        ${website ? `<tr><td style="color:${subtextColor}; font-weight:600;">Web:</td><td><a href="${websiteHref}" target="_blank" rel="noopener noreferrer" style="color:${accentColor}; text-decoration:none;">${cleanWebsite}</a></td></tr>` : ''}
        ${customFieldsHtml}
      </table>
    </td>
  </tr>
  ${socialBadges ? `<tr><td style="padding-top:12px;">${socialBadges}</td></tr>` : ''}
  ${ctaHtml ? `<tr><td style="padding-top:6px;">${ctaHtml}</td></tr>` : ''}
  ${disclaimerHtml ? `<tr><td>${disclaimerHtml}</td></tr>` : ''}
</table>`.trim();
}

/**
 * Generate plain-text equivalent for fallback clipboard/plain text emails
 */
export function generatePlainTextSignature(data) {
  const lines = [];
  if (data.fullName) lines.push(data.fullName);
  if (data.jobTitle || data.companyName) {
    lines.push([data.jobTitle, data.companyName].filter(Boolean).join(' | '));
  }
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.phone) lines.push(`Phone: ${data.phone}`);
  if (data.mobile) lines.push(`Mobile: ${data.mobile}`);
  if (data.website) lines.push(`Web: ${data.website}`);
  if (data.address) lines.push(`Address: ${data.address}`);
  if (data.customFields && data.customFields.length > 0) {
    data.customFields.forEach(f => {
      if (f.label && f.value) lines.push(`${f.label}: ${f.value}`);
    });
  }
  if (data.ctaEnabled && data.ctaText && data.ctaUrl) {
    lines.push(`${data.ctaText}: ${data.ctaUrl}`);
  }
  if (data.disclaimer) {
    lines.push(`\n${data.disclaimer}`);
  }
  return lines.join('\n');
}

/**
 * Copy visual rich formatted HTML to user's clipboard
 */
export async function copyVisualSignature(html, plainText) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API not fully supported in this browser');
  }

  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([plainText], { type: 'text/plain' });

  const item = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob
  });

  await navigator.clipboard.write([item]);
}

/**
 * Download raw HTML file
 */
export function downloadHtmlFile(html, filename = 'email-signature.html') {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Signature</title>
</head>
<body style="margin:20px; font-family:Arial, sans-serif;">
${html}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
