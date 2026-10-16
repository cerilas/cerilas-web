import { GoogleGenAI } from '@google/genai';

/**
 * Google Business Profile & Places Review Service
 * All business data (name, address, rating, rating count, reviews) comes only
 * from Google Places API (New). Gemini is used solely to analyze those reviews.
 */

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

const PLACES_TIMEOUT_MS = 8000;
const LINK_RESOLVE_TIMEOUT_MS = 6000;
const GEMINI_ANALYSIS_TIMEOUT_MS = 30000;

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_CACHE_MAX = 200;
const searchCache = new Map();

export const GOOGLE_PLACES_SOURCE = 'google_places';

export class GoogleBusinessError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function requirePlacesApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new GoogleBusinessError(
      'GOOGLE_MAPS_NOT_CONFIGURED',
      'Google Maps API key (GOOGLE_MAPS_API_KEY) is not configured. Live Google data is unavailable.',
      503
    );
  }
  return apiKey;
}

/**
 * Place IDs issued by Google Places; legacy rows used generated "manual_" / "place_" ids.
 */
export function isGooglePlaceId(value) {
  const id = String(value || '');
  return /^[A-Za-z0-9_-]{16,}$/.test(id) && !/^(manual|place)_/.test(id);
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readSearchCache(key) {
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > SEARCH_CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return hit.places;
}

function writeSearchCache(key, places) {
  if (!places || places.length === 0) return;
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    searchCache.delete(searchCache.keys().next().value);
  }
  searchCache.set(key, { at: Date.now(), places });
}

const isUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

function decodePathName(segment) {
  try {
    return decodeURIComponent(segment.replace(/\+/g, ' ')).trim();
  } catch {
    return segment.replace(/\+/g, ' ').trim();
  }
}

/**
 * Extract business name, coordinates and Place ID from a full Google Maps URL.
 */
export function parseGoogleMapsUrl(rawUrl) {
  const result = { url: rawUrl, name: '', lat: null, lng: null, placeId: '' };
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return result;
  }

  // Google consent interstitial wraps the real Maps URL in ?continue=
  const continueUrl = url.searchParams.get('continue');
  if (url.hostname.startsWith('consent.') && continueUrl) {
    return parseGoogleMapsUrl(continueUrl);
  }

  const placeIdMatch = rawUrl.match(/(?:query_place_id=|place_id[:=])(ChI[\w-]+)/);
  if (placeIdMatch) result.placeId = placeIdMatch[1];

  const placeNameMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeNameMatch) result.name = decodePathName(placeNameMatch[1]);

  if (!result.name) {
    const q = url.searchParams.get('q') || url.searchParams.get('query');
    if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q.trim())) {
      result.name = q.replace(/^place_id:\S+/, '').trim();
    }
  }

  const pinMatch = rawUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const viewportMatch = decodePathName(url.pathname).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const coords = pinMatch || viewportMatch;
  if (coords) {
    result.lat = Number(coords[1]);
    result.lng = Number(coords[2]);
  }

  return result;
}

/**
 * Follow short links (maps.app.goo.gl, goo.gl/maps) and parse the final Maps URL.
 */
export async function resolveGoogleMapsLink(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  const direct = parseGoogleMapsUrl(trimmed);
  if (direct.placeId || direct.name) return direct;

  try {
    const res = await fetch(trimmed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(LINK_RESOLVE_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const finalUrl = res.url || trimmed;
    res.body?.cancel?.().catch(() => {});
    return parseGoogleMapsUrl(finalUrl);
  } catch (err) {
    console.warn('[Google Maps link resolve error]:', err.message);
    return direct;
  }
}

function mapSearchResult(p) {
  return {
    place_id: p.id,
    business_name: p.displayName?.text || '',
    formatted_address: p.formattedAddress || '',
    rating: Number(p.rating) || 0,
    user_ratings_total: Number(p.userRatingCount) || 0,
    google_maps_url: p.googleMapsUri || '',
    website_url: p.websiteUri || '',
    phone_number: p.nationalPhoneNumber || '',
    types: p.types || [],
    source: GOOGLE_PLACES_SOURCE
  };
}

const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber,places.types';
const DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,types,reviews';

async function placesTextSearch(apiKey, textQuery, { language, country, lat, lng }) {
  const body = { textQuery, languageCode: language, regionCode: country };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } };
  }

  const res = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(PLACES_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[Google Places search HTTP]:', res.status, detail.slice(0, 300));
    throw new GoogleBusinessError('GOOGLE_PLACES_ERROR', 'Google Maps search failed.', 502);
  }
  const data = await res.json();
  return (data.places || []).map(mapSearchResult);
}

async function placesDetails(apiKey, placeId, language) {
  const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}${language ? `?languageCode=${encodeURIComponent(language)}` : ''}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(PLACES_TIMEOUT_MS),
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK
    }
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[Google Places details HTTP]:', res.status, detail.slice(0, 300));
    throw new GoogleBusinessError('GOOGLE_PLACES_ERROR', 'Could not load business details from Google Maps.', 502);
  }
  return res.json();
}

/**
 * Search for a business on Google Maps (name, address or Google Maps link).
 */
export async function searchGoogleBusiness(query, options = {}) {
  const apiKey = requirePlacesApiKey();
  const { country = 'US', language = 'en' } = options;
  const rawQuery = String(query || '').trim();
  if (!rawQuery) return [];

  const cacheKey = `${country}|${language}|${rawQuery.toLowerCase()}`;
  const cached = readSearchCache(cacheKey);
  if (cached) return cached;

  let textQuery = rawQuery;
  let lat = null;
  let lng = null;
  if (isUrl(rawQuery)) {
    const link = await resolveGoogleMapsLink(rawQuery);
    if (link.placeId) {
      const d = await placesDetails(apiKey, link.placeId, language);
      if (d) {
        const places = [mapSearchResult(d)];
        writeSearchCache(cacheKey, places);
        return places;
      }
    }
    if (!link.name) return [];
    textQuery = link.name;
    lat = link.lat;
    lng = link.lng;
  }

  const places = await placesTextSearch(apiKey, textQuery, { language, country, lat, lng });
  writeSearchCache(cacheKey, places);
  return places;
}

/**
 * Fetch the current Google Maps profile and its Google-provided reviews.
 * Google Places returns at most 5 reviews and does not expose owner replies.
 */
export async function fetchGoogleBusinessProfile(placeId, options = {}) {
  const apiKey = requirePlacesApiKey();
  const { language = 'en' } = options;

  if (!isGooglePlaceId(placeId)) {
    throw new GoogleBusinessError('INVALID_PLACE_ID', 'No valid Google Maps business was selected.', 400);
  }

  const d = await placesDetails(apiKey, placeId, language);
  if (!d) {
    throw new GoogleBusinessError('PLACE_NOT_FOUND', 'Business not found on Google Maps.', 404);
  }

  const reviews = (Array.isArray(d.reviews) ? d.reviews : []).map(r => ({
    author_name: r.authorAttribution?.displayName || '',
    author_photo: r.authorAttribution?.photoUri || null,
    author_url: r.authorAttribution?.uri || null,
    rating: Number(r.rating) || 0,
    text: r.text?.text || r.originalText?.text || '',
    relative_time: r.relativePublishTimeDescription || '',
    publish_time: r.publishTime || null,
    google_maps_uri: r.googleMapsUri || null,
    is_low_rating: Number(r.rating) <= 2
  }));

  return finalizeBusinessProfile({
    place_id: d.id || placeId,
    business_name: d.displayName?.text || '',
    formatted_address: d.formattedAddress || '',
    rating: Number(d.rating) || 0,
    total_reviews: Number(d.userRatingCount) || 0,
    google_maps_url: d.googleMapsUri || '',
    website_url: d.websiteUri || '',
    phone_number: d.nationalPhoneNumber || '',
    reviews
  });
}

function riskFromRating(rating, totalReviews) {
  if (!totalReviews) return 'Medium Risk';
  return rating >= 4.3 ? 'Low Risk' : rating >= 3.8 ? 'Medium Risk' : 'High Risk';
}

/**
 * Derive review statistics strictly from the reviews Google returned.
 */
export function finalizeBusinessProfile(profile) {
  const reviews = profile.reviews || [];
  const lowStarReviews = reviews.filter(r => Number(r.rating) <= 2);
  return {
    ...profile,
    rating_breakdown: {},
    ai_recommendation_risk: profile.ai_recommendation_risk || riskFromRating(profile.rating || 0, profile.total_reviews || 0),
    low_rating_count: lowStarReviews.length,
    unanswered_low_count: 0,
    low_star_reviews: lowStarReviews
  };
}

/**
 * Gemini analysis of the Google-provided reviews only. No web search, no new data.
 */
export async function analyzeBusinessReviews(profile) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const reviews = (profile.reviews || []).filter(r => r.text);
  const baseSummary = { data_source: GOOGLE_PLACES_SOURCE, review_sample_size: (profile.reviews || []).length };

  if (!geminiKey || reviews.length === 0) {
    return {
      ai_summary: { ...baseSummary, status: 'ready' },
      ai_recommendation_risk: riskFromRating(profile.rating || 0, profile.total_reviews || 0)
    };
  }

  const reviewLines = reviews
    .map((r, i) => `${i + 1}. [${r.rating}★] ${r.text.replace(/\s+/g, ' ').slice(0, 1200)}`)
    .join('\n');

  const prompt = `You analyze Google Maps reviews for a business. Use ONLY the reviews below; do not search, assume or invent anything else.

Business: "${profile.business_name}"
Google rating: ${profile.rating} / 5 from ${profile.total_reviews} ratings
Reviews returned by Google (${reviews.length}):
${reviewLines}

Return JSON in this exact structure (write all text fields in English):
{
  "chronic_complaint_themes": [
    { "theme": "Short complaint title", "count": 1, "severity": "high/medium/low", "description": "What customers complain about" }
  ],
  "ai_recommendation_risk": "Low Risk" | "Medium Risk" | "High Risk",
  "ai_risk_explanation": "Would AI answer engines recommend this business based on this rating and these reviews? Why?",
  "sentiment_summary": "Two-sentence summary of customer perception in these reviews.",
  "actionable_recommendations": ["..."]
}
Only list complaint themes that actually appear in the reviews above; "count" is the number of those reviews mentioning it. Return pure valid JSON only.`;

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const response = await withTimeout(
    ai.models.generateContent({ model: 'gemini-3.8-flash', contents: prompt }),
    GEMINI_ANALYSIS_TIMEOUT_MS,
    'Gemini review analysis'
  );

  const text = response.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  const analysis = match ? JSON.parse(match[0]) : null;
  if (!analysis) throw new Error('Gemini review analysis returned no JSON');

  return {
    ai_summary: { ...analysis, ...baseSummary, status: 'ready' },
    ai_recommendation_risk: analysis.ai_recommendation_risk || riskFromRating(profile.rating || 0, profile.total_reviews || 0)
  };
}

/**
 * Generate a professional, empathetic AI response for a low-star Google review
 */
export async function generateGoogleReviewReply({ businessName, reviewerName, rating, reviewText, issueTheme }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const prompt = `You are a Senior Customer Experience & Brand Reputation Manager.
Business Name: "${businessName}"
A customer left a ${rating}-star review on Google Maps / Google Business Profile.

Customer Name: "${reviewerName || 'Valued Customer'}"
Review / Feedback Text:
"${reviewText || 'No text provided'}"

${issueTheme ? `Issue Theme: "${issueTheme}"` : ''}

Generate a polished, professional response ready to be posted directly to Google Business Profile.
Rules:
1. Never sound defensive or argumentative. Be empathetic, polite, professional, and resolution-oriented.
2. Express sincere empathy for the inconvenience experienced.
3. Invite them to connect directly via official support channels (email or phone) to investigate and resolve the issue.
4. Maintain a tone that reassures both the reviewer and prospective customers reading this response on Google Maps.
5. Return the ready-to-post reply in professional English (if the customer's review is in another language, you may respond in that language; otherwise default to fluent English).
6. Output only the reply body directly—no subject lines, no quotation marks, and no introductory remarks.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });

  return (response.text || '').trim();
}
