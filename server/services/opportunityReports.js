import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import pdfMakeFonts from 'pdfmake/build/vfs_fonts.js';

const FONT_REGULAR = Buffer.from(pdfMakeFonts['Roboto-Regular.ttf'], 'base64');
const FONT_SEMIBOLD = Buffer.from(pdfMakeFonts['Roboto-Medium.ttf'], 'base64');
const FONT_BOLD = FONT_SEMIBOLD;
const CERILAS_LOGO = readFileSync(new URL('../../src/assets/cerilas-logo-darkmode.png', import.meta.url));

const COLORS = {
  ink: '#111827',
  muted: '#6B7280',
  line: '#E5E7EB',
  soft: '#F3F4F6',
  cyan: '#0891B2',
  cyanLight: '#CFFAFE',
  green: '#059669',
  greenLight: '#D1FAE5',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  red: '#DC2626',
  white: '#FFFFFF',
};

const asText = (value, fallback = 'Belirtilmedi') => {
  const text = String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const asList = (value) => {
  if (Array.isArray(value)) return value.map((item) => asText(item, '')).filter(Boolean);
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map((item) => asText(item, '')).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const reportLabel = (scope) => (scope === 'shortlist' ? 'Kısa Liste' : 'Tüm Tarama Sonuçları');

const DEFAULT_FOCUS_AREAS = [
  'yapay zekâ', 'makine öğrenmesi', 'bilgisayarlı görü', 'robotik', 'IoT',
  'gömülü sistemler', 'veri analitiği', 'yazılım ve donanım ürün geliştirme',
];

const DEFAULT_OPPORTUNITY_TYPES = [
  'hibe ve grant programları', 'Ar-Ge ve inovasyon fonları', 'yatırım fırsatları',
  'kamu ve özel sektör ihaleleri', 'hızlandırma ve kuluçka programları',
  'konsorsiyum ve proje ortaklıkları', 'pilot proje ve teknoloji doğrulama çağrıları',
];

const uniqueList = (values) => [...new Set(values.map((value) => asText(value, '')).filter(Boolean))];

const splitListText = (value) => uniqueList(String(value || '').split(';').map((item) => item.trim()));

const extractFocusAreas = (companyProfile) => {
  const match = String(companyProfile || '').match(/Ana yetkinlik alanları\s+([^.]*)/iu);
  if (!match) return DEFAULT_FOCUS_AREAS;
  const values = match[1]
    .replace(/\s+ve\s+/giu, ', ')
    .split(',')
    .map((value) => value.trim().replace(/dir$/iu, ''));
  return uniqueList(values).length ? uniqueList(values) : DEFAULT_FOCUS_AREAS;
};

const compactList = (values, limit = 6) => {
  const clean = uniqueList(values);
  const visible = clean.slice(0, limit);
  const remaining = clean.length - visible.length;
  return `${visible.join(', ')}${remaining > 0 ? ` ve ${remaining} diğer` : ''}`;
};

export const createOpportunityReportContext = (items = [], context = {}) => {
  const sources = uniqueList((context.sources?.length ? context.sources : items)
    .map((source) => source.title || source.source_title || source.domain || source.source_domain));
  const sourceDomains = uniqueList((context.sources?.length ? context.sources : items)
    .map((source) => source.domain || source.source_domain || source.title || source.source_title));
  const focusAreas = uniqueList(context.focusAreas?.length ? context.focusAreas : extractFocusAreas(context.companyProfile));
  const opportunityTypes = uniqueList(context.opportunityTypes?.length
    ? context.opportunityTypes
    : splitListText(context.opportunityTypesText));
  const safeOpportunityTypes = opportunityTypes.length ? opportunityTypes : DEFAULT_OPPORTUNITY_TYPES;
  const organization = asText(context.organization, 'CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ');
  const sourceCount = sources.length;
  const narrative = `${organization} adına; ${compactList(focusAreas, 10)} alanlarındaki faaliyet ve büyüme hedeflerini destekleyebilecek potansiyel hibe, grant, funding/finansman, Ar-Ge ve inovasyon fonu, yatırım, hızlandırma, ihale ve proje ortaklığı fırsatları araştırılmıştır. Tarama ${sourceCount ? `${sourceCount} aktif kaynakta` : 'tanımlı kaynaklarda'} gerçekleştirilmiş; bulunan sonuçlar uygunluk, teknik uyum, finansal ve stratejik değer, son tarih ve riskler açısından bu raporda derlenmiştir.`;
  return {
    organization,
    focusAreas,
    opportunityTypes: safeOpportunityTypes,
    sources,
    sourceDomains,
    targetRegions: asText(context.targetRegions, 'Türkiye, Avrupa ve Türkiye merkezli şirketlerin katılımına açık küresel programlar'),
    narrative,
  };
};

export const normalizeReportScope = (value) => (value === 'shortlist' ? 'shortlist' : 'all');

export const buildOpportunityReportStats = (items = []) => {
  const total = items.length;
  const shortlisted = items.filter((item) => item.is_shortlisted).length;
  const averageScore = total
    ? Math.round(items.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / total)
    : 0;
  const highFit = items.filter((item) => Number(item.score) >= 80).length;
  return { total, shortlisted, averageScore, highFit };
};

const scoreColor = (score) => {
  const value = Number(score) || 0;
  if (value >= 80) return COLORS.green;
  if (value >= 60) return COLORS.amber;
  return COLORS.red;
};

const drawPdfStat = (doc, x, y, width, label, value, accent) => {
  doc.roundedRect(x, y, width, 58, 8).fillAndStroke(COLORS.white, COLORS.line);
  doc.rect(x, y, 4, 58).fill(accent);
  doc.font('NotoSans').fontSize(8).fillColor(COLORS.muted).text(label.toUpperCase(), x + 14, y + 11, { width: width - 24 });
  doc.font('NotoSans-Bold').fontSize(20).fillColor(COLORS.ink).text(String(value), x + 14, y + 27, { width: width - 24 });
};

const drawPdfHeader = (doc, label) => {
  doc.save();
  doc.rect(0, 0, doc.page.width, 62).fill(COLORS.ink);
  doc.image(CERILAS_LOGO, 48, 18, { fit: [112, 24], align: 'left', valign: 'center' });
  doc.font('NotoSans').fontSize(8).fillColor('#CBD5E1').text(label, 190, 25, { align: 'right', width: doc.page.width - 238 });
  doc.restore();
  doc.x = 48;
  doc.y = 82;
};

export async function createOpportunityPdf(items, { scope = 'all', generatedAt = new Date(), reportContext = {} } = {}) {
  const normalizedScope = normalizeReportScope(scope);
  const label = reportLabel(normalizedScope);
  const stats = buildOpportunityReportStats(items);
  const context = createOpportunityReportContext(items, reportContext);
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: `CERİLAS - ${label}`, Author: 'CERİLAS' } });
  doc.registerFont('NotoSans', FONT_REGULAR);
  doc.registerFont('NotoSans-Semibold', FONT_SEMIBOLD);
  doc.registerFont('NotoSans-Bold', FONT_BOLD);
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawPdfHeader(doc, label);

  doc.font('NotoSans-Semibold').fontSize(9).fillColor(COLORS.cyan).text('FIRSAT KEŞİF RAPORU', 48, 94, { characterSpacing: 1.2 });
  doc.font('NotoSans-Bold').fontSize(27).fillColor(COLORS.ink).text(label, 48, 116, { width: doc.page.width - 96 });
  doc.font('NotoSans').fontSize(10).fillColor(COLORS.muted)
    .text(`Yapay zekâ destekli tarama - ${generatedAt.toLocaleString('tr-TR')}`, 48, 157);

  const statY = 196;
  const statGap = 10;
  const statWidth = (doc.page.width - 96 - (statGap * 3)) / 4;
  drawPdfStat(doc, 48, statY, statWidth, 'Sonuç', stats.total, COLORS.cyan);
  drawPdfStat(doc, 48 + statWidth + statGap, statY, statWidth, 'Kısa liste', stats.shortlisted, COLORS.green);
  drawPdfStat(doc, 48 + (statWidth + statGap) * 2, statY, statWidth, 'Ort. puan', stats.averageScore, COLORS.amber);
  drawPdfStat(doc, 48 + (statWidth + statGap) * 3, statY, statWidth, '80+ puan', stats.highFit, '#7C3AED');
  doc.roundedRect(48, 288, doc.page.width - 96, 132, 10).fillAndStroke('#F8FAFC', COLORS.line);
  doc.font('NotoSans-Semibold').fontSize(10).fillColor(COLORS.ink).text('Araştırmanın amacı', 64, 306);
  doc.font('NotoSans').fontSize(8.7).fillColor('#4B5563').text(
    context.narrative,
    64, 328, { width: doc.page.width - 128, height: 76, ellipsis: true, lineGap: 3 },
  );

  doc.font('NotoSans-Semibold').fontSize(10).fillColor(COLORS.ink).text('Araştırma kapsamı', 48, 450);
  const scopeItems = [
    ['ODAK ALANLARI', compactList(context.focusAreas, 10), COLORS.cyan],
    ['ARANAN FIRSATLAR', compactList(context.opportunityTypes, 6), COLORS.green],
    ['TARANAN KAYNAKLAR', compactList(context.sourceDomains, 9), '#7C3AED'],
    ['COĞRAFİ KAPSAM', context.targetRegions, COLORS.amber],
  ];
  scopeItems.forEach(([title, copy, accent], index) => {
    const y = 476 + (index * 57);
    doc.roundedRect(48, y, doc.page.width - 96, 47, 8).fillAndStroke(COLORS.white, COLORS.line);
    doc.rect(48, y, 4, 47).fill(accent);
    doc.font('NotoSans-Semibold').fontSize(7).fillColor(accent).text(title, 64, y + 8, { width: 112 });
    doc.font('NotoSans').fontSize(7.8).fillColor('#374151').text(copy, 178, y + 8, { width: doc.page.width - 242, height: 31, ellipsis: true, lineGap: 1.5 });
  });

  if (!items.length) {
    doc.roundedRect(48, 718, doc.page.width - 96, 52, 8).fill(COLORS.soft);
    doc.font('NotoSans').fontSize(10).fillColor(COLORS.muted)
      .text('Seçilen kapsamda raporlanacak fırsat bulunmuyor.', 64, 736);
  }

  items.forEach((item, index) => {
    const fitReasons = asList(item.fit_reasons);
    const risks = asList(item.risks);
    const description = asText(item.description, 'Açıklama bulunmuyor.');
    const rationale = asText(item.rationale, 'Değerlendirme gerekçesi bulunmuyor.');
    doc.addPage();
    drawPdfHeader(doc, label);
    const startY = 82;
    const cardWidth = doc.page.width - 96;

    doc.font('NotoSans-Semibold').fontSize(8).fillColor(COLORS.cyan)
      .text(`FIRSAT ${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`, 48, startY, { characterSpacing: 0.8 });
    doc.roundedRect(doc.page.width - 122, startY - 5, 74, 31, 8).fill(scoreColor(item.score));
    doc.font('NotoSans-Bold').fontSize(11).fillColor(COLORS.white)
      .text(`${Number(item.score) || 0}/100`, doc.page.width - 122, startY + 5, { width: 74, align: 'center' });

    doc.font('NotoSans-Bold').fontSize(17).fillColor(COLORS.ink)
      .text(asText(item.title, 'İsimsiz fırsat'), 48, 117, { width: cardWidth - 92, height: 52, ellipsis: true, lineGap: 2 });
    doc.font('NotoSans').fontSize(8.5).fillColor(COLORS.muted)
      .text(`${asText(item.opportunity_type, 'Fırsat')}  |  ${asText(item.source_title || item.source_domain, 'Bilinmeyen kaynak')}  |  Güven: %${Number(item.confidence) || 0}`, 48, 172, { width: cardWidth, height: 16, ellipsis: true });
    if (item.is_shortlisted) {
      doc.roundedRect(48, 196, 74, 20, 6).fill(COLORS.greenLight);
      doc.font('NotoSans-Semibold').fontSize(7.5).fillColor(COLORS.green).text('KISA LİSTE', 48, 203, { width: 74, align: 'center' });
    }

    const descriptionY = 228;
    doc.roundedRect(48, descriptionY, cardWidth, 84, 9).fillAndStroke('#F8FAFC', COLORS.line);
    doc.font('NotoSans-Semibold').fontSize(8).fillColor(COLORS.cyan).text('FIRSAT ÖZETİ', 62, descriptionY + 13);
    doc.font('NotoSans').fontSize(9).fillColor('#374151').text(description, 62, descriptionY + 31, { width: cardWidth - 28, height: 41, ellipsis: true, lineGap: 2 });

    doc.font('NotoSans-Semibold').fontSize(9).fillColor(COLORS.ink).text('Temel bilgiler', 48, 332);
    const metaY = 352;
    const metaGap = 10;
    const metaWidth = (cardWidth - metaGap) / 2;
    const meta = [
      ['Son tarih', asText(item.deadline_text)],
      ['Destek', asText(item.funding_text)],
      ['Bölge', asText(item.geography)],
      ['Uygunluk', asText(item.eligibility)],
    ];
    meta.forEach(([metaLabel, value], metaIndex) => {
      const x = 48 + (metaIndex % 2) * (metaWidth + metaGap);
      const y = metaY + Math.floor(metaIndex / 2) * 54;
      doc.roundedRect(x, y, metaWidth, 44, 7).fillAndStroke(COLORS.white, COLORS.line);
      doc.font('NotoSans-Semibold').fontSize(7).fillColor(COLORS.muted).text(metaLabel.toUpperCase(), x + 12, y + 8, { width: metaWidth - 24 });
      doc.font('NotoSans').fontSize(8.5).fillColor(COLORS.ink).text(value, x + 12, y + 21, { width: metaWidth - 24, height: 16, ellipsis: true });
    });

    const rationaleY = 472;
    doc.roundedRect(48, rationaleY, cardWidth, 76, 9).fill(COLORS.cyanLight);
    doc.font('NotoSans-Semibold').fontSize(8).fillColor(COLORS.cyan).text('YAPAY ZEKÂ DEĞERLENDİRMESİ', 62, rationaleY + 12);
    doc.font('NotoSans').fontSize(8.5).fillColor('#164E63').text(rationale, 62, rationaleY + 29, { width: cardWidth - 28, height: 36, ellipsis: true, lineGap: 2 });

    const insightY = 568;
    const insightGap = 12;
    const insightWidth = (cardWidth - insightGap) / 2;
    const drawInsight = (x, title, values, fill, accent, fallback) => {
      doc.roundedRect(x, insightY, insightWidth, 126, 9).fillAndStroke(fill, COLORS.line);
      doc.font('NotoSans-Semibold').fontSize(8).fillColor(accent).text(title, x + 13, insightY + 12, { width: insightWidth - 26 });
      const visibleValues = values.slice(0, 3);
      if (!visibleValues.length) {
        doc.font('NotoSans').fontSize(8).fillColor(COLORS.muted).text(fallback, x + 13, insightY + 34, { width: insightWidth - 26, height: 70 });
        return;
      }
      visibleValues.forEach((value, valueIndex) => {
        const y = insightY + 34 + (valueIndex * 27);
        doc.circle(x + 17, y + 4, 2).fill(accent);
        doc.font('NotoSans').fontSize(7.8).fillColor('#374151').text(value, x + 25, y, { width: insightWidth - 38, height: 22, ellipsis: true, lineGap: 1 });
      });
    };
    drawInsight(48, 'NEDEN UYGUN?', fitReasons, '#F0FDF4', COLORS.green, 'Belirgin bir uyum nedeni eklenmemiş.');
    drawInsight(48 + insightWidth + insightGap, 'DİKKAT EDİLECEKLER', risks, '#FFFBEB', COLORS.amber, 'Belirgin bir risk eklenmemiş.');

    if (item.external_url) {
      doc.font('NotoSans-Semibold').fontSize(8.5).fillColor(COLORS.cyan)
        .text('Resmî fırsat sayfasını aç', 48, 716, { width: 160, height: 14, link: String(item.external_url), underline: true });
    }
  });

  const range = doc.bufferedPageRange();
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font('NotoSans').fontSize(7.5).fillColor('#9CA3AF')
      .text('CERİLAS · Gizli ve kurumsal kullanım içindir', 48, doc.page.height - 34, { width: doc.page.width - 160, lineBreak: false });
    doc.text(`${pageIndex + 1} / ${range.count}`, doc.page.width - 108, doc.page.height - 34, { width: 60, align: 'right', lineBreak: false });
    doc.page.margins.bottom = originalBottomMargin;
  }

  doc.end();
  return completed;
}

const EXCEL_HEADERS = [
  'Başlık', 'Puan', 'Güven (%)', 'Kısa Liste', 'Fırsat Türü', 'Son Tarih', 'Destek',
  'Bölge', 'Uygunluk', 'Kaynak', 'Açıklama', 'Değerlendirme', 'Uyum Nedenleri',
  'Riskler', 'Bağlantı', 'İlk Görülme', 'Son Görülme',
];

const toExcelRows = (items) => items.map((item) => [
  asText(item.title, 'İsimsiz fırsat'),
  Number(item.score) || 0,
  Number(item.confidence) || 0,
  item.is_shortlisted ? 'Evet' : 'Hayır',
  asText(item.opportunity_type),
  asText(item.deadline_text),
  asText(item.funding_text),
  asText(item.geography),
  asText(item.eligibility),
  asText(item.source_title || item.source_domain, 'Bilinmiyor'),
  asText(item.description, ''),
  asText(item.rationale, ''),
  asList(item.fit_reasons).join(' · '),
  asList(item.risks).join(' · '),
  item.external_url ? { text: 'Fırsatı aç', hyperlink: String(item.external_url) } : '',
  item.first_seen_at ? new Date(item.first_seen_at) : null,
  item.last_seen_at ? new Date(item.last_seen_at) : null,
]);

const styleResultsSheet = (sheet, items, tableName) => {
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 1, showGridLines: false }];
  sheet.columns = [
    { width: 34 }, { width: 10 }, { width: 12 }, { width: 13 }, { width: 20 }, { width: 18 },
    { width: 22 }, { width: 18 }, { width: 30 }, { width: 24 }, { width: 46 }, { width: 44 },
    { width: 34 }, { width: 34 }, { width: 16 }, { width: 15 }, { width: 15 },
  ];
  sheet.addTable({
    name: tableName,
    ref: 'A1',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: EXCEL_HEADERS.map((name) => ({ name, filterButton: true })),
    rows: toExcelRows(items),
  });
  sheet.getRow(1).height = 28;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
  sheet.getColumn(2).numFmt = '0';
  sheet.getColumn(3).numFmt = '0';
  sheet.getColumn(16).numFmt = 'yyyy-mm-dd';
  sheet.getColumn(17).numFmt = 'yyyy-mm-dd';
  [1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach((column) => {
    sheet.getColumn(column).alignment = { vertical: 'top', wrapText: true };
  });
  sheet.getColumn(15).font = { color: { argb: 'FF0891B2' }, underline: true };
  if (items.length) {
    const lastRow = items.length + 1;
    for (let row = 2; row <= lastRow; row += 1) sheet.getRow(row).height = 54;
    sheet.addConditionalFormatting({
      ref: `B2:B${lastRow}`,
      rules: [{ type: 'colorScale', cfvo: [{ type: 'min' }, { type: 'percentile', value: 50 }, { type: 'max' }], color: [{ argb: 'FFFECACA' }, { argb: 'FFFEF3C7' }, { argb: 'FFD1FAE5' }] }],
    });
    sheet.addConditionalFormatting({
      ref: `D2:D${lastRow}`,
      rules: [{ type: 'containsText', operator: 'containsText', text: 'Evet', style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }, font: { color: { argb: 'FF047857' }, bold: true } } }],
    });
  }
};

export async function createOpportunityWorkbook(items, { scope = 'all', generatedAt = new Date(), reportContext = {} } = {}) {
  const normalizedScope = normalizeReportScope(scope);
  const context = createOpportunityReportContext(items, reportContext);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CERİLAS';
  workbook.company = 'CERİLAS Yüksek Teknoloji';
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.calcProperties.fullCalcOnLoad = true;

  const summary = workbook.addWorksheet('Özet', { views: [{ showGridLines: false }] });
  const detailSheetName = normalizedScope === 'shortlist' ? 'Kısa Liste' : 'Tüm Sonuçlar';
  const primaryItems = normalizedScope === 'shortlist' ? items.filter((item) => item.is_shortlisted) : items;
  const stats = buildOpportunityReportStats(primaryItems);
  const detail = workbook.addWorksheet(detailSheetName);
  styleResultsSheet(detail, primaryItems, normalizedScope === 'shortlist' ? 'ShortlistResults' : 'AllResults');

  if (normalizedScope === 'all') {
    const shortlist = workbook.addWorksheet('Kısa Liste');
    styleResultsSheet(shortlist, items.filter((item) => item.is_shortlisted), 'ShortlistResults');
  }

  summary.columns = [{ width: 28 }, { width: 20 }, { width: 52 }];
  summary.mergeCells('A1:C2');
  summary.getCell('A1').value = `CERİLAS · ${reportLabel(normalizedScope)}`;
  summary.getCell('A1').font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  summary.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
  summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
  summary.getRow(1).height = 30;
  summary.getRow(2).height = 22;
  summary.getCell('A4').value = 'Rapor tarihi';
  summary.getCell('B4').value = generatedAt;
  summary.getCell('B4').numFmt = 'yyyy-mm-dd hh:mm';
  summary.getCell('A6').value = 'Toplam sonuç';
  summary.getCell('B6').value = { formula: `COUNTA('${detailSheetName}'!A2:A${Math.max(2, primaryItems.length + 1)})`, result: stats.total };
  summary.getCell('A7').value = 'Kısa liste';
  summary.getCell('B7').value = { formula: `COUNTIF('${detailSheetName}'!D2:D${Math.max(2, primaryItems.length + 1)},"Evet")`, result: stats.shortlisted };
  summary.getCell('A8').value = 'Ortalama puan';
  summary.getCell('B8').value = { formula: `IFERROR(AVERAGE('${detailSheetName}'!B2:B${Math.max(2, primaryItems.length + 1)}),0)`, result: stats.averageScore };
  summary.getCell('A9').value = '80+ puan';
  summary.getCell('B9').value = { formula: `COUNTIF('${detailSheetName}'!B2:B${Math.max(2, primaryItems.length + 1)},">=80")`, result: stats.highFit };
  summary.getCell('B8').numFmt = '0';
  for (let row = 6; row <= 9; row += 1) {
    summary.getCell(row, 1).font = { bold: true, color: { argb: 'FF4B5563' } };
    summary.getCell(row, 2).font = { bold: true, size: 16, color: { argb: row === 7 ? 'FF059669' : 'FF111827' } };
    summary.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    summary.getCell(row, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    summary.getRow(row).height = 27;
  }
  const setSummarySection = (titleCell, bodyRange, title, body, color = 'FF0891B2') => {
    summary.getCell(titleCell).value = title;
    summary.getCell(titleCell).font = { bold: true, color: { argb: color } };
    summary.mergeCells(bodyRange);
    const bodyCell = summary.getCell(bodyRange.split(':')[0]);
    bodyCell.value = body;
    bodyCell.alignment = { vertical: 'top', wrapText: true };
    bodyCell.font = { color: { argb: 'FF334155' }, size: 10 };
    bodyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    bodyCell.border = {
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  };

  setSummarySection('A11', 'A12:C15', 'Araştırmanın amacı', context.narrative);
  [12, 13, 14, 15].forEach((row) => { summary.getRow(row).height = 20; });
  setSummarySection('A17', 'A18:C19', 'Odak alanları', context.focusAreas.join(' · '), 'FF0891B2');
  setSummarySection('A21', 'A22:C24', 'Aranan fırsatlar', context.opportunityTypes.join(' · '), 'FF059669');
  setSummarySection('A26', 'A27:C29', `Taranan kaynaklar (${context.sources.length || context.sourceDomains.length})`, context.sources.join(' · ') || context.sourceDomains.join(' · '), 'FF7C3AED');
  setSummarySection('A31', 'A32:C34', 'Coğrafi kapsam', context.targetRegions, 'FFD97706');
  setSummarySection(
    'A36',
    'A37:C39',
    'Kullanım notu',
    'Puanlama yapay zekâ değerlendirmesidir. Başvuru koşulları, son tarihler ve destek tutarları resmî kaynak üzerinden ayrıca doğrulanmalıdır.',
  );
  [18, 19, 22, 23, 24, 27, 28, 29, 32, 33, 34, 37, 38, 39].forEach((row) => { summary.getRow(row).height = 19; });
  summary.pageSetup.printArea = 'A1:C39';
  summary.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  detail.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function createOpportunityEmail(items, { scope = 'all', generatedAt = new Date(), reportContext = {} } = {}) {
  const normalizedScope = normalizeReportScope(scope);
  const stats = buildOpportunityReportStats(items);
  const label = reportLabel(normalizedScope);
  const context = createOpportunityReportContext(items, reportContext);
  const topItems = [...items].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 8);
  const opportunityCards = topItems.map((item) => `
    <tr><td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #243244;border-radius:12px;background:#172033;">
        <tr><td style="padding:16px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:top;"><div style="font-size:11px;color:${item.is_shortlisted ? '#6EE7B7' : '#67E8F9'};font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${item.is_shortlisted ? 'Kısa liste' : escapeHtml(asText(item.opportunity_type, 'Fırsat'))}</div></td>
            <td style="vertical-align:top;text-align:right;"><span style="display:inline-block;border-radius:8px;padding:5px 9px;background:${Number(item.score) >= 80 ? '#064E3B' : Number(item.score) >= 60 ? '#78350F' : '#7F1D1D'};color:#fff;font-size:12px;font-weight:800;">${Number(item.score) || 0}/100</span></td>
          </tr></table>
          <h3 style="margin:10px 0 6px;color:#F8FAFC;font-size:16px;line-height:1.35;">${escapeHtml(asText(item.title, 'İsimsiz fırsat'))}</h3>
          <p style="margin:0 0 12px;color:#AAB6C7;font-size:13px;line-height:1.55;">${escapeHtml(asText(item.description, 'Açıklama bulunmuyor.')).slice(0, 360)}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:12px;color:#94A3B8;"><tr>
            <td style="padding:3px 8px 3px 0;vertical-align:top;"><strong style="color:#CBD5E1;">Son tarih:</strong> ${escapeHtml(asText(item.deadline_text))}</td>
            <td style="padding:3px 0;vertical-align:top;"><strong style="color:#CBD5E1;">Destek:</strong> ${escapeHtml(asText(item.funding_text))}</td>
          </tr></table>
          ${item.external_url ? `<a href="${escapeHtml(item.external_url)}" style="display:inline-block;margin-top:12px;color:#67E8F9;text-decoration:none;font-size:12px;font-weight:700;">Fırsatı görüntüle →</a>` : ''}
        </td></tr>
      </table>
    </td></tr>
  `).join('');

  const html = `<!doctype html>
  <html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(label)}</title>
  <style>@media only screen and (max-width:600px){.report-shell{padding:16px 8px!important}.report-body{padding:22px 16px!important}.stat-cell{display:block!important;width:auto!important;margin-bottom:8px!important}.stat-table{border-spacing:0!important}}</style></head>
  <body style="margin:0;padding:0;background:#07101F;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07101F;"><tr><td class="report-shell" align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;">
        <tr><td style="padding:22px 26px;border-radius:18px 18px 0 0;background:linear-gradient(135deg,#0E7490,#111827);">
          <div style="color:#fff;font-size:22px;font-weight:900;letter-spacing:.08em;">CERİLAS</div>
          <div style="margin-top:5px;color:#CFFAFE;font-size:12px;letter-spacing:.04em;">Yapay Zekâ Fırsat Keşfi</div>
        </td></tr>
        <tr><td class="report-body" style="padding:28px 26px;background:#101827;border-left:1px solid #243244;border-right:1px solid #243244;">
          <div style="font-size:11px;color:#67E8F9;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(label)}</div>
          <h1 style="margin:9px 0 8px;color:#F8FAFC;font-size:25px;line-height:1.25;">CERİLAS için yeni fon ve Ar-Ge fırsatları araştırıldı</h1>
          <p style="margin:0;color:#AAB6C7;font-size:14px;line-height:1.65;">${escapeHtml(generatedAt.toLocaleString('tr-TR'))} tarihli araştırmanın sonuçları aşağıda özetlenmiştir. Ayrıntılı PDF ve düzenlenebilir Excel dosyaları ektedir.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;border:1px solid #155E75;border-radius:12px;background:#0C2A3A;">
            <tr><td style="padding:18px;">
              <div style="color:#67E8F9;font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;">Bu rapor neyi kapsıyor?</div>
              <p style="margin:9px 0 14px;color:#D8E5ED;font-size:13px;line-height:1.65;">${escapeHtml(context.narrative)}</p>
              <div style="padding-top:12px;border-top:1px solid #164E63;color:#AAB6C7;font-size:11px;line-height:1.65;"><strong style="color:#E2E8F0;">Odak alanları:</strong> ${escapeHtml(compactList(context.focusAreas, 10))}</div>
              <div style="margin-top:5px;color:#AAB6C7;font-size:11px;line-height:1.65;"><strong style="color:#E2E8F0;">Taranan kaynaklar:</strong> ${escapeHtml(context.sourceDomains.join(', '))}</div>
            </td></tr>
          </table>
          <table class="stat-table" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-spacing:8px;"><tr>
            <td class="stat-cell" style="width:25%;padding:15px 8px;text-align:center;background:#172033;border-radius:10px;border-top:3px solid #22D3EE;"><div style="font-size:10px;color:#94A3B8;text-transform:uppercase;">Sonuç</div><div style="margin-top:5px;font-size:24px;color:#fff;font-weight:800;">${stats.total}</div></td>
            <td class="stat-cell" style="width:25%;padding:15px 8px;text-align:center;background:#172033;border-radius:10px;border-top:3px solid #10B981;"><div style="font-size:10px;color:#94A3B8;text-transform:uppercase;">Kısa Liste</div><div style="margin-top:5px;font-size:24px;color:#fff;font-weight:800;">${stats.shortlisted}</div></td>
            <td class="stat-cell" style="width:25%;padding:15px 8px;text-align:center;background:#172033;border-radius:10px;border-top:3px solid #F59E0B;"><div style="font-size:10px;color:#94A3B8;text-transform:uppercase;">Ort. Puan</div><div style="margin-top:5px;font-size:24px;color:#fff;font-weight:800;">${stats.averageScore}</div></td>
            <td class="stat-cell" style="width:25%;padding:15px 8px;text-align:center;background:#172033;border-radius:10px;border-top:3px solid #8B5CF6;"><div style="font-size:10px;color:#94A3B8;text-transform:uppercase;">80+ Puan</div><div style="margin-top:5px;font-size:24px;color:#fff;font-weight:800;">${stats.highFit}</div></td>
          </tr></table>
          <h2 style="margin:0 0 14px;color:#F8FAFC;font-size:17px;">Öne çıkan fırsatlar</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${opportunityCards || '<tr><td style="color:#94A3B8;padding:20px 0;">Seçilen kapsamda sonuç bulunmuyor.</td></tr>'}</table>
        </td></tr>
        <tr><td style="padding:20px 26px;background:#0B1220;border:1px solid #243244;border-top:0;border-radius:0 0 18px 18px;color:#64748B;font-size:11px;line-height:1.55;text-align:center;">
          Bu rapor otomatik oluşturulmuştur. Başvuru koşullarını ve tarihleri resmî kaynak üzerinden doğrulayın.<br>CERİLAS Yüksek Teknoloji · cerilas.com
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const text = [
    `CERİLAS Yüksek Teknoloji - Fırsat Araştırması - ${label}`,
    `Rapor tarihi: ${generatedAt.toLocaleString('tr-TR')}`,
    '',
    'BU RAPOR NEYİ KAPSIYOR?',
    context.narrative,
    `Odak alanları: ${context.focusAreas.join(', ')}`,
    `Aranan fırsatlar: ${context.opportunityTypes.join(', ')}`,
    `Taranan kaynaklar: ${context.sourceDomains.join(', ')}`,
    `Coğrafi kapsam: ${context.targetRegions}`,
    '',
    `Toplam: ${stats.total} | Kısa liste: ${stats.shortlisted} | Ortalama puan: ${stats.averageScore} | 80+ puan: ${stats.highFit}`,
    '',
    ...topItems.map((item) => `${Number(item.score) || 0}/100 - ${asText(item.title, 'İsimsiz fırsat')}\n${asText(item.external_url, '')}`),
    '',
    'Ayrıntılı PDF ve Excel dosyaları ektedir.',
  ].join('\n');

  return { subject: `CERİLAS Fırsat Araştırması · ${label} · ${generatedAt.toLocaleDateString('tr-TR')}`, html, text };
}

export const createReportFilename = (scope, extension, generatedAt = new Date()) => {
  const date = generatedAt.toISOString().slice(0, 10);
  const suffix = normalizeReportScope(scope) === 'shortlist' ? 'kisa-liste' : 'tum-sonuclar';
  return `cerilas-firsat-${suffix}-${date}.${extension}`;
};
