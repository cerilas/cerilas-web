import { GoogleGenAI } from '@google/genai';

/**
 * Google Business Profile & Places Review Service
 * Supports Google Places API (New) with Gemini Search Grounding fallback.
 */

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

/**
 * Search for a business on Google Maps / Places
 */
export async function searchGoogleBusiness(query, options = {}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const { country = 'TR', language = 'tr' } = options;

  // 1. Try Google Places API (New) if API key is present
  if (apiKey) {
    try {
      const res = await fetch(PLACES_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber,places.types'
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: language,
          regionCode: country
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          return data.places.map(p => ({
            place_id: p.id,
            business_name: p.displayName?.text || query,
            formatted_address: p.formattedAddress || '',
            rating: p.rating || 0,
            user_ratings_total: p.userRatingCount || 0,
            google_maps_url: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
            website_url: p.websiteUri || '',
            phone_number: p.nationalPhoneNumber || '',
            types: p.types || [],
            source: 'places_api'
          }));
        }
      }
    } catch (err) {
      console.warn('[Google Places API error, falling back to Gemini Search]:', err.message);
    }
  }

  // 2. Gemini Grounding Search Fallback (Gemini 3.8 Flash with Google Search)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are an expert Google Maps and Google Business Profile discovery system.
Target query or URL: "${query}"
Target region: ${country} (${language}).

Instructions:
1. Search Google Maps and Google Search for matching business profiles, branches, storefronts, or official listings.
2. If the query is a Google Maps link (e.g. goo.gl, maps.google.com, maps.app.goo.gl), resolve the business at that URL.
3. Return matching businesses with their verified Google Maps data.

Return JSON in this exact structure:
{
  "places": [
    {
      "place_id": "Google Place ID or slug identifier",
      "business_name": "Official Business Name on Google Maps",
      "formatted_address": "City, District, Country or street address",
      "rating": 4.5,
      "user_ratings_total": 85,
      "google_maps_url": "https://maps.google.com/...",
      "website_url": "https://...",
      "phone_number": "+90...",
      "types": ["business"]
    }
  ]
}
If absolutely no matching business profile exists, return {"places": []}. Return pure valid JSON only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.places && Array.isArray(parsed.places) && parsed.places.length > 0) {
          return parsed.places.map((p, idx) => ({
            place_id: p.place_id || `place_${Date.now()}_${idx}`,
            business_name: p.business_name || query,
            formatted_address: p.formatted_address || '',
            rating: Number(p.rating) || 0,
            user_ratings_total: Number(p.user_ratings_total) || 0,
            google_maps_url: p.google_maps_url || (query.startsWith('http') ? query : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.business_name || query)}`),
            website_url: p.website_url || '',
            phone_number: p.phone_number || '',
            types: p.types || ['business'],
            source: 'gemini_grounding'
          }));
        } else if (parsed.found && parsed.business_name) {
          return [{
            place_id: parsed.place_id || `place_${Date.now()}`,
            business_name: parsed.business_name || query,
            formatted_address: parsed.formatted_address || '',
            rating: Number(parsed.rating) || 0,
            user_ratings_total: Number(parsed.user_ratings_total) || 0,
            google_maps_url: parsed.google_maps_url || (query.startsWith('http') ? query : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsed.business_name || query)}`),
            website_url: parsed.website_url || '',
            phone_number: parsed.phone_number || '',
            types: parsed.types || ['business'],
            source: 'gemini_grounding'
          }];
        }
      }
    } catch (err) {
      console.warn('[Gemini Search Place error]:', err.message);
    }
  }

  return [];
}

/**
 * Fetch detailed reviews, analyze low-star reviews, and generate AI insights
 */
export async function getDetailedBusinessProfile(placeIdentifier, businessName, options = {}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const { country = 'TR', language = 'tr', manualData = {} } = options;

  let baseData = {
    place_id: placeIdentifier || `place_${Date.now()}`,
    business_name: businessName,
    formatted_address: manualData.formattedAddress || '',
    rating: Number(manualData.rating) || 0,
    total_reviews: Number(manualData.totalReviews) || 0,
    google_maps_url: manualData.googleMapsUrl || '',
    website_url: manualData.websiteUrl || '',
    phone_number: manualData.phoneNumber || '',
    reviews: []
  };

  // 1. If we have a Google Maps Place ID and Google Maps API Key
  if (apiKey && placeIdentifier && placeIdentifier.startsWith('ChI')) {
    try {
      const res = await fetch(`${PLACES_DETAILS_URL}/${placeIdentifier}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,reviews,types'
        }
      });
      if (res.ok) {
        const d = await res.json();
        baseData.business_name = d.displayName?.text || businessName;
        baseData.formatted_address = d.formattedAddress || '';
        baseData.rating = d.rating || 0;
        baseData.total_reviews = d.userRatingCount || 0;
        baseData.google_maps_url = d.googleMapsUri || '';
        baseData.website_url = d.websiteUri || '';
        baseData.phone_number = d.nationalPhoneNumber || '';
        if (d.reviews && Array.isArray(d.reviews)) {
          baseData.reviews = d.reviews.map(r => ({
            author_name: r.authorAttribution?.displayName || 'Google Kullanıcısı',
            author_photo: r.authorAttribution?.photoUri || null,
            rating: r.rating || 5,
            text: r.text?.text || '',
            relative_time: r.relativePublishTimeDescription || '',
            publish_time: r.publishTime || new Date().toISOString(),
            has_owner_response: false,
            owner_response: null,
            is_low_rating: Number(r.rating) <= 2
          }));
        }
      }
    } catch (err) {
      console.warn('[Places API Details error]:', err.message);
    }
  }

  // 2. Enrich with Gemini Grounding for comprehensive review analysis & low-star detection
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Perform a comprehensive Google Business Profile & Google Maps Reviews Audit for:
Business Name: "${businessName}"
Place / Address Context: "${baseData.formatted_address || country}"

Search Google Maps and review platforms for this exact business. 
Extract real user reviews, paying special attention to 1-STAR and 2-STAR reviews (düşük yıldızlı olumsuz yorumlar) and customer complaints.

Return a JSON with this exact structure:
{
  "rating": 4.6,
  "total_reviews": 120,
  "formatted_address": "City, Street, Country",
  "google_maps_url": "https://maps.google.com/...",
  "website_url": "Website url",
  "phone_number": "Phone number",
  "rating_breakdown": {
    "1": 4,
    "2": 2,
    "3": 8,
    "4": 26,
    "5": 80
  },
  "reviews": [
    {
      "author_name": "Reviewer Name",
      "rating": 1,
      "text": "Exact or synthesized complaint text from real reviews",
      "relative_time": "1 ay önce",
      "has_owner_response": false,
      "owner_response": null,
      "issue_category": "Kargo / Teslimat / Destek / Fiyat vb."
    }
  ],
  "ai_analysis": {
    "chronic_complaint_themes": [
      {
        "theme": "Kısa şikayet başlığı (örn: İade ve Değişim Süreci)",
        "count": 3,
        "severity": "high/medium/low",
        "description": "Müşterilerin şikayetçi olduğu spesifik durum özeti"
      }
    ],
    "ai_recommendation_risk": "Düşük Risk" | "Orta Risk" | "Yüksek Risk",
    "ai_risk_explanation": "Gemini, Perplexity ve ChatGPT Search bu yorumları okuduğunda işletmeyi tavsiye eder mi? Neden?",
    "sentiment_summary": "İşletmenin Google profilindeki müşteri algısı ve puan dağılımının 2 cümlelik özeti.",
    "actionable_recommendations": [
      "1. Yanıtsız kalan 1 yıldızlı yorumlara hemen telafi odaklı yanıt verilmesi.",
      "2. Düzenli memnun müşterilerden Google yorumu toplanması."
    ]
  }
}
If there are no 1-2 star reviews found, chronic_complaint_themes can be empty and ai_recommendation_risk "Düşük Risk". Return pure JSON only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const enriched = JSON.parse(cleanJson);

      if (enriched) {
        if (!baseData.rating && enriched.rating) baseData.rating = Number(enriched.rating);
        if (!baseData.total_reviews && enriched.total_reviews) baseData.total_reviews = Number(enriched.total_reviews);
        if (!baseData.formatted_address && enriched.formatted_address) baseData.formatted_address = enriched.formatted_address;
        if (!baseData.google_maps_url && enriched.google_maps_url) baseData.google_maps_url = enriched.google_maps_url;
        if (!baseData.website_url && enriched.website_url) baseData.website_url = enriched.website_url;
        if (!baseData.phone_number && enriched.phone_number) baseData.phone_number = enriched.phone_number;

        // Merge reviews
        if (enriched.reviews && Array.isArray(enriched.reviews) && enriched.reviews.length > 0) {
          const merged = [...baseData.reviews];
          for (const er of enriched.reviews) {
            const exists = merged.some(m => m.text && er.text && m.text.slice(0, 30) === er.text.slice(0, 30));
            if (!exists) {
              merged.push({
                author_name: er.author_name || 'Müşteri',
                author_photo: null,
                rating: Number(er.rating) || 1,
                text: er.text || '',
                relative_time: er.relative_time || 'Yakın zamanda',
                publish_time: new Date().toISOString(),
                has_owner_response: Boolean(er.has_owner_response),
                owner_response: er.owner_response || null,
                issue_category: er.issue_category || 'Genel Geri Bildirim',
                is_low_rating: Number(er.rating) <= 2
              });
            }
          }
          baseData.reviews = merged;
        }

        baseData.rating_breakdown = enriched.rating_breakdown || {
          "1": Math.round(baseData.total_reviews * 0.05),
          "2": Math.round(baseData.total_reviews * 0.03),
          "3": Math.round(baseData.total_reviews * 0.07),
          "4": Math.round(baseData.total_reviews * 0.25),
          "5": Math.round(baseData.total_reviews * 0.60)
        };

        baseData.ai_summary = enriched.ai_analysis || {};
        baseData.ai_recommendation_risk = enriched.ai_analysis?.ai_recommendation_risk || (baseData.rating >= 4.3 ? 'Düşük Risk' : baseData.rating >= 3.8 ? 'Orta Risk' : 'Yüksek Risk');
      }
    } catch (err) {
      console.warn('[Gemini Enrich Review Audit error]:', err.message);
    }
  }

  // Filter low star reviews
  const lowStarReviews = (baseData.reviews || []).filter(r => Number(r.rating) <= 2);
  const lowRatingCount = lowStarReviews.length;
  const unansweredLowCount = lowStarReviews.filter(r => !r.has_owner_response).length;

  return {
    ...baseData,
    low_rating_count: lowRatingCount,
    unanswered_low_count: unansweredLowCount,
    low_star_reviews: lowStarReviews
  };
}

/**
 * Generate a professional, empathetic AI response for a low-star Google review
 */
export async function generateGoogleReviewReply({ businessName, reviewerName, rating, reviewText, issueTheme }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('Gemini API anahtarı yapılandırılmamış.');
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const prompt = `Sen profesyonel bir Müşteri Deneyimi & Marka İtibar Yöneticisisin.
İşletme Adı: "${businessName}"
Google Haritalar'da bir müşteriden ${rating} yıldızlı olumsuz bir yorum aldık.

Müşteri Adı: "${reviewerName || 'Müşteri'}"
Geri Bildirim / Şikayet Metni:
"${reviewText}"

${issueTheme ? `Şikayet Teması: "${issueTheme}"` : ''}

Lütfen bu yoruma Google İşletme Profilinde yayınlanmak üzere doğrudan yanıt oluştur.
Kurallar:
1. Kesinlikle kavgacı veya savunmacı olma. Samimi, kibar, profesyonel ve çözüm odaklı ol.
2. Müşterinin yaşadığı aksaklıktan dolayı samimi bir empati göster.
3. Sorunu çözmek veya telafi etmek için destek e-postası veya telefon üzerinden doğrudan iletişime geçmeye davet et.
4. Hem olumsuz yorumu yapan müşteriyi kazanacak hem de bu yanıtı Google Haritalar'da okuyan diğer potansiyel müşterilere güven verecek bir ton kullan.
5. Türkçe olarak hazır metin döndür (Başlık vb. koyma, doğrudan yanıta başla).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });

  return (response.text || '').trim();
}
