import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import {
  DEFAULT_OPPORTUNITY_AI_SETTINGS,
  FALLBACK_GEMINI_MODELS,
  detectAccessBlock,
  discoverPaginationUrls,
  getGeminiModels,
  normalizeAiSettings,
} from './opportunityScanner.js';

test('detectAccessBlock recognizes bot verification pages', () => {
  const result = detectAccessBlock({
    finalUrl: 'https://www.f6s.com/programs',
    html: '<html><head><title>Checking your browser</title></head><body>We think you might be a bot. Enable cookies and JavaScript.</body></html>',
  });

  assert.equal(result?.type, 'robot_verification');
  assert.equal(result?.url, 'https://www.f6s.com/programs');
  assert.equal(detectAccessBlock({ html: '<title>Fırsatlar</title><body>Açık çağrılar listesi</body>' }), null);
});

test('normalizeAiSettings clamps numeric values and preserves dynamic profiles', () => {
  const settings = normalizeAiSettings({
    extraction_model: 'gemini-custom-extractor',
    scoring_model: 'gemini-custom-scorer',
    company_profile: 'CERİLAS dinamik profili',
    personal_profile: 'Deniz dinamik profili',
    shortlist_threshold: 140,
    max_candidates_per_source: 0,
    temperature: 4,
    score_weights: { technical_fit: 150, financial_value: -5 },
  });

  assert.equal(settings.extraction_model, 'gemini-custom-extractor');
  assert.equal(settings.scoring_model, 'gemini-custom-scorer');
  assert.equal(settings.company_profile, 'CERİLAS dinamik profili');
  assert.equal(settings.personal_profile, 'Deniz dinamik profili');
  assert.equal(settings.shortlist_threshold, 100);
  assert.equal(settings.max_candidates_per_source, 1);
  assert.equal(settings.temperature, 1);
  assert.equal(settings.score_weights.technical_fit, 100);
  assert.equal(settings.score_weights.financial_value, 0);
  assert.equal(settings.score_weights.eligibility, DEFAULT_OPPORTUNITY_AI_SETTINGS.score_weights.eligibility);
});

test('discoverPaginationUrls finds same-origin next and numbered pages only', () => {
  const urls = discoverPaginationUrls({
    finalUrl: 'https://example.com/calls?page=1#top',
    html: `
      <nav aria-label="Pagination">
        <a href="/calls?page=2">2</a>
        <a href="/calls?page=3#results">3</a>
        <a href="https://other.example/calls?page=2">4</a>
      </nav>
      <a rel="next" href="/calls?page=2">Sonraki</a>
      <a href="/?post_type=page&p=125">WordPress içeriği</a>
      <a href="/opportunities/regular-item">Normal fırsat</a>
    `,
  });

  assert.deepEqual(urls.sort(), [
    'https://example.com/calls?page=2',
    'https://example.com/calls?page=3',
  ]);
});

test('discoverPaginationUrls expands and paginates OnePass public opportunities', () => {
  const expanded = discoverPaginationUrls({
    finalUrl: 'https://opportunities.getonepass.eu/open-opportunities',
    html: '<a href="/open-opportunities/first-six-only">First</a>',
  });
  assert.deepEqual(expanded, [
    'https://opportunities.getonepass.eu/open-opportunities?opp_pageSize=200',
  ]);

  const details = discoverPaginationUrls({
    finalUrl: 'https://opportunities.getonepass.eu/open-opportunities?opp_pageSize=200',
    html: `
      <a href="/open-opportunities/fierce">FIERCE</a>
      <a href="/open-opportunities/odeon#actions">ODEON</a>
      <a href="/open-opportunities/fierce">Duplicate</a>
      <a href="/api/opportunities/public/active?pageIndex=1">API</a>
      <a href="https://other.example/open-opportunities/external">External</a>
    `,
  });
  assert.deepEqual(details.sort(), [
    'https://opportunities.getonepass.eu/open-opportunities/fierce',
    'https://opportunities.getonepass.eu/open-opportunities/odeon',
  ]);
});

test('getGeminiModels returns safe defaults when no API key is configured', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await getGeminiModels();
    assert.equal(result.configured, false);
    assert.deepEqual(result.models, FALLBACK_GEMINI_MODELS);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
