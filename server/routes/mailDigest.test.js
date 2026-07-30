import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDigestStats,
  escapeHtml,
  formatCurrencyGroups,
} from './mailDigest.js';

test('digest counts use probability_rating and active statuses', () => {
  const stats = calculateDigestStats([
    { id: 1, status: 'Aktif', probability_rating: 10, total_income: 1000, currency: 'TRY' },
    { id: 2, status: 'Aktif', probability_rating: 8, total_income: 200, currency: 'USD' },
    { id: 3, status: 'Tamamlandı', probability_rating: 10, total_income: 500, currency: 'TRY' },
    { id: 4, status: 'Pasif', probability_rating: 8, total_income: 300, currency: 'EUR' },
  ]);

  assert.equal(stats.activeCount, 2);
  assert.equal(stats.completedCount, 1);
  assert.equal(stats.passiveCount, 1);
  assert.equal(stats.certainCount, 1);
  assert.equal(stats.highCount, 1);
});

test('pending collection subtracts same- and cross-currency payments', () => {
  const stats = calculateDigestStats(
    [
      { id: 1, status: 'Aktif', total_income: 1000, currency: 'TRY' },
      { id: 2, status: 'Aktif', total_income: 100, currency: 'USD' },
      { id: 3, status: 'Pasif', total_income: 999, currency: 'TRY' },
    ],
    [
      { opportunity_id: 1, amount: 250, currency: 'TRY' },
      {
        opportunity_id: 2,
        amount: 1900,
        currency: 'TRY',
        exchange_rates: { TRY: 1, USD: 38 },
      },
    ]
  );

  assert.equal(stats.groupedExpected.TRY, 750);
  assert.equal(stats.groupedExpected.USD, 50);
  assert.equal(stats.groupedAllTimeExpected.TRY, 1999);
  assert.equal(stats.groupedReceived.TRY, 2150);
});

test('mail output escapes database content and formats currencies deterministically', () => {
  assert.equal(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  assert.match(formatCurrencyGroups({ USD: 12.5, TRY: 100 }), />100 <span[^>]*>TRY<\/span>/);
  assert.equal(formatCurrencyGroups({ USD: 12.5 }, { inline: true }), '12,5 USD');
});
