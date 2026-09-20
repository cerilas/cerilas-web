/**
 * Automated SEO & Schema.org Generator for Scraped EU & Cascade Funding Calls
 * Generates SEO-optimized slugs, titles, meta descriptions, keywords, and JSON-LD schema.
 */

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, ' ')  // replace non-alphanumeric with space
    .trim()
    .replace(/\s+/g, '-')          // collapse whitespace to dashes
    .replace(/-+/g, '-')           // collapse repeated dashes
    .slice(0, 140);
}

/**
 * Generate full SEO suite for a single funding opportunity
 * @param {Object} opp - Funding opportunity object from scraper or database
 * @returns {Object} { slug, seo_title, meta_description, meta_keywords, schema_json }
 */
export function generateOpportunitySeo(opp) {
  const title = (opp.title || '').trim();
  const externalId = (opp.external_id || '').trim();
  const sourceKey = opp.source_key || 'ec_funding';
  const isEc = sourceKey === 'ec_funding';
  const isCascade = sourceKey === 'cascadefunding';

  // 1. Build Unique, Clean Slug
  // Example: boosting-biorefinery-competitiveness-through-biotech-horizon-ju-cbe-2026-1
  const cleanTitleSlug = slugify(title);
  const cleanIdSlug = slugify(externalId);

  let slug = '';
  if (cleanIdSlug && !cleanTitleSlug.includes(cleanIdSlug)) {
    slug = `${cleanTitleSlug}-${cleanIdSlug}`;
  } else {
    slug = cleanTitleSlug;
  }
  // Trim slug to max 180 chars and remove trailing dashes
  slug = slug.slice(0, 180).replace(/-+$/, '');
  if (!slug) slug = `grant-opportunity-${Date.now()}`;

  // 2. Extract Budget String
  let budgetText = opp.funding_amount || '';
  if (!budgetText || budgetText === 'Not specified' || budgetText === 'EUR 0') {
    budgetText = '';
  }

  // 3. Format Deadline
  let deadlineStr = '';
  if (opp.deadline_date) {
    try {
      const d = new Date(opp.deadline_date);
      if (!isNaN(d.getTime())) {
        deadlineStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      deadlineStr = '';
    }
  }

  // 4. Determine Program Name
  let programName = isEc ? 'Horizon Europe' : 'Cascade Funding (FSTP)';
  if (isEc && title.toLowerCase().includes('msca')) programName = 'MSCA Doctoral Networks';
  if (isEc && title.toLowerCase().includes('erc')) programName = 'ERC Research Grant';

  // 5. Generate SEO Title (50 - 65 chars optimal)
  // E.g.: "Biorefinery Competitiveness (€20M) | Horizon Europe Grant"
  let conciseTitle = title;
  if (conciseTitle.length > 55) {
    conciseTitle = conciseTitle.slice(0, 52).trim() + '...';
  }
  let seo_title = budgetText 
    ? `${conciseTitle} (${budgetText}) | ${programName} 2026`
    : `${conciseTitle} | ${programName} Call 2026`;
  
  if (seo_title.length > 70) {
    seo_title = `${title.slice(0, 42).trim()}... | ${programName}`;
  }

  // 6. Generate Meta Description (145 - 160 chars optimal for Google snippets)
  const applicantsList = Array.isArray(opp.eligible_applicants) 
    ? opp.eligible_applicants.join(', ') 
    : (typeof opp.eligible_applicants === 'string' ? opp.eligible_applicants : 'Startups, SMEs & Researchers');
  
  let descParts = [];
  if (budgetText) descParts.push(`Grant: ${budgetText}.`);
  if (deadlineStr) descParts.push(`Deadline: ${deadlineStr}.`);
  if (applicantsList && applicantsList !== '[]') descParts.push(`Eligible: ${applicantsList.slice(0, 50)}.`);

  let rawShort = (opp.short_description || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let intro = `Apply for ${title}.`;
  if (intro.length > 60) intro = `Apply for ${title.slice(0, 57)}...`;

  let meta_description = `${intro} ${descParts.join(' ')} Explore official EU guidelines and call details on Cerilas Tools.`;
  if (meta_description.length > 160) {
    meta_description = meta_description.slice(0, 157).trim() + '...';
  }

  // 7. Generate Meta Keywords
  const domains = Array.isArray(opp.domains) ? opp.domains : [];
  const technologies = Array.isArray(opp.technologies) ? opp.technologies : [];
  const keywordsSet = new Set([
    'EU funding',
    'Horizon Europe',
    'Cascade funding',
    'FSTP grants',
    'research grants 2026',
    'SME grants Europe',
    ...domains,
    ...technologies
  ]);
  if (externalId) keywordsSet.add(externalId);
  const meta_keywords = Array.from(keywordsSet).slice(0, 12).join(', ');

  // 8. Generate Schema.org Structured Data (JSON-LD)
  // Rich snippet schema matching Google guidelines for FinancialProduct / GovernmentService / Grant
  const canonicalUrl = `https://tools.cerilas.com/tool/eu-funding-opportunities/${slug}`;
  
  const schema_json = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    'name': title,
    'description': opp.short_description || meta_description,
    'url': canonicalUrl,
    'provider': {
      '@type': 'GovernmentOrganization',
      'name': isEc ? 'European Commission' : 'European Innovation Council & FSTP Hub',
      'url': 'https://ec.europa.eu'
    },
    'category': opp.call_type || 'Research & Innovation Grant',
    'offers': {
      '@type': 'Offer',
      'price': opp.funding_raw_amount || '0',
      'priceCurrency': 'EUR',
      'description': budgetText || 'Equity-free grant funding'
    },
    'validThrough': opp.deadline_date || undefined,
    'audience': {
      '@type': 'Audience',
      'audienceType': applicantsList
    }
  };

  return {
    slug,
    seo_title,
    meta_description,
    meta_keywords,
    schema_json
  };
}
