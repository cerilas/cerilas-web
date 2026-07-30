const DEFAULT_CURRENCY = 'TRY';
const EXCLUDED_STATUSES = new Set(['Pasif', 'Arşiv']);

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeCurrency = (value) => {
  const currency = String(value || DEFAULT_CURRENCY).trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : DEFAULT_CURRENCY;
};

const parseExchangeRates = (value) => {
  if (!value) return null;

  try {
    const rates = typeof value === 'string' ? JSON.parse(value) : value;
    return rates && typeof rates === 'object' ? rates : null;
  } catch {
    return null;
  }
};

const convertPaymentToOpportunityCurrency = (payment, opportunityCurrency) => {
  const amount = toFiniteNumber(payment.amount);
  const paymentCurrency = normalizeCurrency(payment.currency);
  const targetCurrency = normalizeCurrency(opportunityCurrency);

  if (paymentCurrency === targetCurrency) return amount;

  const rates = parseExchangeRates(payment.exchange_rates);
  const fromRate = toFiniteNumber(rates?.[paymentCurrency]);
  const targetRate = toFiniteNumber(rates?.[targetCurrency]);

  if (fromRate <= 0 || targetRate <= 0) return 0;
  return (amount * fromRate) / targetRate;
};

const addCurrencyAmount = (group, currency, amount) => {
  const normalizedCurrency = normalizeCurrency(currency);
  group[normalizedCurrency] = (group[normalizedCurrency] || 0) + toFiniteNumber(amount);
};

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const calculateDigestStats = (opportunities = [], payments = []) => {
  const paymentsByOpportunity = new Map();

  payments.forEach((payment) => {
    const opportunityId = String(payment.opportunity_id);
    const opportunityPayments = paymentsByOpportunity.get(opportunityId) || [];
    opportunityPayments.push(payment);
    paymentsByOpportunity.set(opportunityId, opportunityPayments);
  });

  const stats = {
    activeCount: 0,
    completedCount: 0,
    passiveCount: 0,
    certainCount: 0,
    highCount: 0,
    groupedReceived: {},
    groupedExpected: {},
    groupedAllTimeExpected: {},
  };

  payments.forEach((payment) => {
    addCurrencyAmount(
      stats.groupedReceived,
      payment.currency,
      Math.max(0, toFiniteNumber(payment.amount))
    );
  });

  opportunities.forEach((opportunity) => {
    const status = String(opportunity.status || 'Aktif');
    const probabilityRating = toFiniteNumber(opportunity.probability_rating);
    const currency = normalizeCurrency(opportunity.currency);
    const totalIncome = Math.max(0, toFiniteNumber(opportunity.total_income));

    if (status === 'Aktif') stats.activeCount += 1;
    if (status === 'Tamamlandı') stats.completedCount += 1;
    if (status === 'Pasif') stats.passiveCount += 1;
    if (status === 'Aktif' && probabilityRating === 10) stats.certainCount += 1;
    if (status === 'Aktif' && probabilityRating >= 7 && probabilityRating <= 9) {
      stats.highCount += 1;
    }

    addCurrencyAmount(stats.groupedAllTimeExpected, currency, totalIncome);

    if (!EXCLUDED_STATUSES.has(status)) {
      const receivedInOpportunityCurrency = (
        paymentsByOpportunity.get(String(opportunity.id)) || []
      ).reduce(
        (sum, payment) => (
          sum + convertPaymentToOpportunityCurrency(payment, currency)
        ),
        0
      );

      addCurrencyAmount(
        stats.groupedExpected,
        currency,
        Math.max(0, totalIncome - receivedInOpportunityCurrency)
      );
    }
  });

  return stats;
};

export const formatCurrencyGroups = (group, { inline = false } = {}) => {
  const entries = Object.entries(group)
    .filter(([, amount]) => Number.isFinite(amount))
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB, 'tr'));

  if (entries.length === 0) return '0 TRY';

  const formatted = entries.map(([currency, amount]) => {
    const value = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    if (inline) return `${value} ${escapeHtml(currency)}`;
    return `<div style="margin-bottom: 4px;">${value} <span style="font-size: 13px; color: #9ca3af;">${escapeHtml(currency)}</span></div>`;
  });

  return formatted.join(inline ? ' | ' : '');
};
