import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import {
  buildOpportunityReportStats,
  createOpportunityEmail,
  createOpportunityPdf,
  createOpportunityReportContext,
  createOpportunityWorkbook,
  createReportFilename,
} from './opportunityReports.js';

const SAMPLE_ITEMS = [
  {
    id: 1,
    title: 'Yapay Zekâ & Robotik Açık Çağrısı',
    description: 'KOBİ ve teknoloji girişimleri için ürün doğrulama desteği.',
    opportunity_type: 'Hibe',
    deadline_text: '30 Eylül 2026',
    funding_text: '€60.000',
    geography: 'Avrupa Birliği ve Türkiye',
    eligibility: 'Teknoloji KOBİ’leri',
    score: 88,
    confidence: 91,
    is_shortlisted: true,
    rationale: 'CERİLAS teknoloji alanlarıyla güçlü eşleşme.',
    fit_reasons: ['Yapay zekâ', 'Robotik'],
    risks: ['KOBİ statüsü doğrulanmalı'],
    external_url: 'https://example.com/call',
    source_title: 'Örnek Kaynak',
    first_seen_at: '2026-08-01T10:00:00Z',
    last_seen_at: '2026-08-01T11:00:00Z',
  },
  {
    id: 2,
    title: 'Dijital Dönüşüm Programı',
    description: 'Uluslararası hızlandırma programı.',
    score: 62,
    confidence: 70,
    is_shortlisted: false,
    external_url: 'https://example.com/accelerator',
  },
];

test('buildOpportunityReportStats summarizes report candidates', () => {
  assert.deepEqual(buildOpportunityReportStats(SAMPLE_ITEMS), {
    total: 2,
    shortlisted: 1,
    averageScore: 75,
    highFit: 1,
  });
});

test('createOpportunityReportContext explains the organization, focus and sources', () => {
  const context = createOpportunityReportContext(SAMPLE_ITEMS, {
    companyProfile: 'CERİLAS. Ana yetkinlik alanları yapay zekâ, robotik ve IoT.',
    opportunityTypesText: 'Hibe ve grant programları; yatırım fırsatları',
    sources: [{ title: 'F6S', domain: 'f6s.com' }, { title: 'GetOnePass', domain: 'opportunities.getonepass.eu' }],
  });
  assert.match(context.narrative, /CERİLAS Yüksek Teknoloji/);
  assert.match(context.narrative, /yapay zekâ/);
  assert.deepEqual(context.sourceDomains, ['f6s.com', 'opportunities.getonepass.eu']);
});

test('createOpportunityPdf produces a non-empty PDF with Turkish text support', async () => {
  const buffer = await createOpportunityPdf(SAMPLE_ITEMS, { generatedAt: new Date('2026-08-01T12:00:00Z') });
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF');
  assert.ok(buffer.length > 10_000);
});

test('createOpportunityWorkbook creates summary, all-results and shortlist sheets', async () => {
  const buffer = await createOpportunityWorkbook(SAMPLE_ITEMS, { scope: 'all', generatedAt: new Date('2026-08-01T12:00:00Z') });
  assert.equal(buffer.subarray(0, 2).toString(), 'PK');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Özet', 'Tüm Sonuçlar', 'Kısa Liste']);
  assert.equal(workbook.getWorksheet('Tüm Sonuçlar').rowCount, 3);
  assert.equal(workbook.getWorksheet('Kısa Liste').rowCount, 2);
  assert.match(String(workbook.getWorksheet('Özet').getCell('B6').formula), /COUNTA/);
  assert.match(String(workbook.getWorksheet('Özet').getCell('A12').value), /CERİLAS Yüksek Teknoloji/);
});

test('createOpportunityEmail escapes content and includes report summary', () => {
  const { subject, html, text } = createOpportunityEmail([
    { ...SAMPLE_ITEMS[0], title: '<script>Çağrı</script>' },
  ], { scope: 'shortlist', generatedAt: new Date('2026-08-01T12:00:00Z') });
  assert.match(subject, /Kısa Liste/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, />Çağrı<\/h3>/);
  assert.match(html, /Bu rapor neyi kapsıyor/);
  assert.match(text, /PDF ve Excel/);
  assert.match(text, /Taranan kaynaklar/);
  assert.equal(createReportFilename('shortlist', 'pdf', new Date('2026-08-01T12:00:00Z')), 'cerilas-firsat-kisa-liste-2026-08-01.pdf');
});
