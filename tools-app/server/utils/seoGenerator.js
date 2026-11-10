/**
 * Automated SEO & Schema.org Generator for Scraped EU & Cascade Funding Calls
 * Generates SEO-optimized slugs, unique titles, meta descriptions, cleaned scope HTML,
 * call-specific FAQs, and JSON-LD schema.
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
 * Extracts a human-readable Call Reference ID from scraper external_id
 * e.g. "50143487_TOPICS_en" -> "50143487", "14664_COMPETITIVE_CALL_en" -> "14664"
 */
export function formatCleanCallId(externalId) {
  const raw = String(externalId || '').trim();
  if (!raw) return '';
  return raw
    .replace(/_?TOPICS_?[a-z]{2}$/i, '')
    .replace(/_?COMPETITIVE[-_]?CALL_?[a-z]{2}$/i, '')
    .replace(/^cascade_/i, 'FSTP-')
    .trim();
}

/**
 * Strips repeated European Commission legal boilerplate sections from long_description HTML
 * ("Destination & Policy Context", "Conditions & Eligibility Criteria", "Support & Documentation Guidance")
 * while preserving 100% of the topic-specific "Expected Outcome & Scope", "Eligibility & Target Applicants",
 * "Call Objectives & Scope", "How to Apply & Submission Process", and "Timeline & Schedule".
 */
export function cleanGrantLongDescriptionHtml(longDescHtml) {
  const raw = String(longDescHtml || '').trim();
  if (!raw) return '';

  // Split by the horizontal rule separator used in assembleRichDescription
  const parts = raw.split(/<hr[^>]*>/i);
  if (parts.length <= 1) {
    return raw;
  }

  const BOILERPLATE_HEADINGS = [
    'Destination & Policy Context',
    'Conditions & Eligibility Criteria',
    'Support & Documentation Guidance'
  ];

  const kept = parts.filter((sectionHtml) => {
    const plain = sectionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return false;
    for (const heading of BOILERPLATE_HEADINGS) {
      if (plain.startsWith(heading)) {
        return false;
      }
    }
    return true;
  });

  if (kept.length > 0) {
    return kept.join('<hr style="margin: 1.25rem 0; border: 0; border-top: 1px solid rgba(150, 150, 150, 0.15);" />');
  }

  // Fallback if all sections matched boilerplate: keep first section truncated
  return parts[0];
}

/**
 * Extracts plain text from cleaned long description, removing generic section prefixes
 * so the first sentence immediately reflects the unique substance of the grant call.
 */
export function extractUniqueScopePlainText(longDescHtml) {
  const cleanedHtml = cleanGrantLongDescriptionHtml(longDescHtml);
  if (!cleanedHtml) return '';

  let text = cleanedHtml
    .replace(/<h4[^>]*>[\s\S]*?<\/h4>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Strip common repetitive introductory phrases in Horizon Europe topics
  text = text
    .replace(/^Expected Outcome\s*:?\s*/i, '')
    .replace(/^Project(?:s)? results are expected to contribute to (?:all|some|at least one) of the following expected outcomes\s*:?\s*/i, '')
    .replace(/^Proposals are expected to contribute to (?:all|some) of the following expected outcomes\s*:?\s*/i, '')
    .replace(/^Scope\s*:?\s*/i, '')
    .trim();

  return text;
}

/**
 * Ensures short_description is unique to the topic rather than a generic Horizon Europe Destination header.
 */
export function deriveUniqueShortDescription(opp) {
  const stripLeadPhrases = (str) =>
    String(str || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^Expected Outcome\s*:?\s*/i, '')
      .replace(/^Project(?:s)? results are expected to contribute to (?:all|some|at least one) of the following expected outcomes\s*:?\s*/i, '')
      .replace(/^Proposals are expected to contribute to (?:all|some) of the following expected outcomes\s*:?\s*/i, '')
      .replace(/^Specific Challenge\s*:?\s*/i, '')
      .replace(/^Objective\s*:?\s*/i, '')
      .replace(/^Scope\s*:?\s*/i, '')
      .trim();

  const existingShort = stripLeadPhrases(opp.short_description);

  const isGenericDestination =
    !existingShort ||
    existingShort.length < 115 ||
    /\(\d{4}(?:-\d{2,4})?\)\.?$/.test(existingShort) ||
    /^Destination\b/i.test(existingShort);

  const uniqueScopeText = extractUniqueScopePlainText(opp.long_description);

  if (isGenericDestination && uniqueScopeText.length >= 60) {
    return uniqueScopeText.length > 280
      ? uniqueScopeText.slice(0, 277).trim() + '...'
      : uniqueScopeText;
  }

  if (existingShort) {
    return existingShort.length > 280
      ? existingShort.slice(0, 277).trim() + '...'
      : existingShort;
  }

  if (uniqueScopeText) {
    return uniqueScopeText.length > 280
      ? uniqueScopeText.slice(0, 277).trim() + '...'
      : uniqueScopeText;
  }

  const cleanId = formatCleanCallId(opp.external_id);
  const sourceLabel = opp.source_key === 'cascadefunding' ? 'Cascade Funding (FSTP)' : 'Horizon Europe (SEDIA)';
  return `${opp.title || 'EU Grant Opportunity'} (${sourceLabel}${cleanId ? `, Call ID ${cleanId}` : ''}). Review full scope, budget, eligibility criteria, and official submission portal links.`;
}

/**
 * Generates 4 deterministic, call-specific FAQs for an individual grant page
 */
export function buildGrantFaqs(opp) {
  const title = (opp.title || 'this EU funding call').trim();
  const cleanId = formatCleanCallId(opp.external_id);
  const isEc = opp.source_key === 'ec_funding';
  const programName = isEc ? 'Horizon Europe (European Commission SEDIA)' : 'EU Cascade Funding (Financial Support to Third Parties / FSTP)';
  const budgetText = opp.funding_amount && opp.funding_amount !== 'Not specified' && opp.funding_amount !== 'EUR 0'
    ? opp.funding_amount
    : (isEc ? 'Competitive European Commission topic budget (see official Work Programme table)' : 'Equity-free lump-sum sub-grant (typically €50,000–€200,000 per beneficiary)');
  const deadlineText = opp.deadline_raw || (opp.deadline_date ? new Date(opp.deadline_date).toISOString().slice(0, 10) : 'Continuous / Check Official Portal');
  const applicants = Array.isArray(opp.eligible_applicants) && opp.eligible_applicants.length > 0
    ? opp.eligible_applicants.join(', ')
    : 'SMEs, Startups, Universities, and Research Organizations established in EU Member States or Horizon Europe Associated Countries';
  const domains = Array.isArray(opp.domains) && opp.domains.length > 0
    ? opp.domains.join(', ')
    : 'Research, Innovation & Technology Deployment';
  const callScopePreview = deriveUniqueShortDescription(opp);

  return [
    {
      q: `What is the grant budget and funding instrument for "${title}"${cleanId ? ` (Call #${cleanId})` : ''}?`,
      a: `"${title}"${cleanId ? ` (Call Reference: ${cleanId})` : ''} is published under ${programName} as a ${opp.call_type || 'Grant Call'}. The indicative funding allocation is ${budgetText}. Funding is provided as non-dilutive, equity-free European grant support subject to the call's grant agreement terms.`
    },
    {
      q: `Who is eligible to apply for "${title}"?`,
      a: `Eligible applicant categories for this call include: ${applicants}. Applicants must be legally established in an eligible European Union Member State or Horizon Europe Associated Country and meet the specific consortium or single-beneficiary admissibility rules detailed on the official submission portal.`
    },
    {
      q: `When is the submission deadline for "${title}" and how do I apply?`,
      a: `The official submission deadline for "${title}" is ${deadlineText}. Proposals must be submitted electronically before the cutoff time via the official ${isEc ? 'European Commission Funding & Tenders Portal (SEDIA)' : 'managing consortium open-call submission portal'} linked in the Grant Key Specifications table above.`
    },
    {
      q: `What are the core objectives and scope of "${title}"?`,
      a: `This call targets ${domains}. Specifically: ${callScopePreview}`
    }
  ];
}

/**
 * Generate full SEO suite for a single funding opportunity
 * @param {Object} opp - Funding opportunity object from scraper or database
 * @returns {Object} { slug, seo_title, meta_description, meta_keywords, schema_json, short_description }
 */
export function generateOpportunitySeo(opp) {
  const title = (opp.title || '').trim();
  const externalId = (opp.external_id || '').trim();
  const cleanId = formatCleanCallId(externalId);
  const sourceKey = opp.source_key || 'ec_funding';
  const isEc = sourceKey === 'ec_funding';

  // 1. Build Unique, Clean Slug
  const cleanTitleSlug = slugify(title);
  const cleanIdSlug = slugify(externalId);

  let slug = '';
  if (cleanIdSlug && !cleanTitleSlug.includes(cleanIdSlug)) {
    slug = `${cleanTitleSlug}-${cleanIdSlug}`;
  } else {
    slug = cleanTitleSlug;
  }
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
  let programName = isEc ? 'Horizon Europe' : 'Cascade Funding';
  if (isEc && title.toLowerCase().includes('msca')) programName = 'MSCA Grant';
  if (isEc && title.toLowerCase().includes('erc')) programName = 'ERC Grant';

  // 5. Generate 100% Unique SEO Title (includes Call ID and/or Budget to prevent duplicate titles across multi-topic calls)
  const idBadge = cleanId ? ` #${cleanId}` : '';
  const budgetBadge = budgetText ? ` (${budgetText})` : '';
  let maxTitleChars = 58 - idBadge.length - budgetBadge.length - programName.length - 3;
  if (maxTitleChars < 24) maxTitleChars = 28;

  let conciseTitle = title;
  if (conciseTitle.length > maxTitleChars) {
    conciseTitle = conciseTitle.slice(0, maxTitleChars - 1).trim() + '…';
  }

  let seo_title = `${conciseTitle}${budgetBadge}${idBadge} | ${programName}`;
  if (seo_title.length > 74) {
    seo_title = `${title.slice(0, 38).trim()}…${idBadge} | ${programName}`;
  }

  // 6. Generate 100% Unique Meta Description (combines unique call scope + budget + deadline + Call ID)
  const uniqueShort = deriveUniqueShortDescription(opp);
  let metaSpecs = [];
  if (cleanId) metaSpecs.push(`Call #${cleanId}`);
  if (budgetText) metaSpecs.push(`Budget: ${budgetText}`);
  if (deadlineStr) metaSpecs.push(`Deadline: ${deadlineStr}`);
  const specsPrefix = metaSpecs.length > 0 ? `[${metaSpecs.join(' · ')}] ` : '';

  const remainingChars = Math.max(50, 158 - specsPrefix.length);
  const scopeSnippet = uniqueShort.length > remainingChars
    ? uniqueShort.slice(0, remainingChars - 1).trim() + '…'
    : uniqueShort;

  const meta_description = `${specsPrefix}${scopeSnippet}`.slice(0, 160);

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
  if (cleanId) keywordsSet.add(`EU Call ${cleanId}`);
  if (externalId) keywordsSet.add(externalId);
  const meta_keywords = Array.from(keywordsSet).slice(0, 14).join(', ');

  // 8. Generate Schema.org Structured Data (JSON-LD)
  const canonicalUrl = `https://tools.cerilas.com/tool/eu-funding-opportunities/${slug}`;
  const applicantsList = Array.isArray(opp.eligible_applicants)
    ? opp.eligible_applicants.join(', ')
    : (typeof opp.eligible_applicants === 'string' ? opp.eligible_applicants : 'Startups, SMEs & Researchers');

  const schema_json = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    'name': cleanId ? `${title} (Call #${cleanId})` : title,
    'identifier': cleanId || externalId || slug,
    'description': uniqueShort,
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
    schema_json,
    short_description: uniqueShort
  };
}
