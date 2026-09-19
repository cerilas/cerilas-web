import {
  calculateSurveySampleSize,
  calculateMeanSampleSize,
  calculateTwoMeansSampleSize,
  calculateTwoProportionsSampleSize,
  calculateCorrelationSampleSize,
  calculateABTestSampleSize,
  applyDropoutAdjustment
} from './src/tools/sample-size-calculator/lib/sampleSizeEngine.js';

import {
  normalCDF,
  normalInvCDF,
  getZForConfidence
} from './src/tools/sample-size-calculator/lib/distributions.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== Running Statistical Validation Test Suite ===\n');

// Test 1: Distributions & Quantiles
console.log('1. Normal Distribution & Probit Quantile Tests:');
assert(Math.abs(normalCDF(0) - 0.5) < 1e-6, 'normalCDF(0) == 0.5');
assert(Math.abs(normalCDF(1.95996) - 0.975) < 1e-4, 'normalCDF(1.96) ≈ 0.975');
assert(Math.abs(normalInvCDF(0.975) - 1.95996) < 1e-4, 'normalInvCDF(0.975) ≈ 1.960 (95% CI critical Z)');
assert(Math.abs(getZForConfidence(0.95) - 1.95996) < 1e-4, 'getZForConfidence(0.95) ≈ 1.960');
assert(Math.abs(getZForConfidence(0.99) - 2.5758) < 1e-3, 'getZForConfidence(0.99) ≈ 2.576');
assert(Math.abs(getZForConfidence(0.90) - 1.6448) < 1e-3, 'getZForConfidence(0.90) ≈ 1.645');

// Test 2: Survey / Population Estimate (Cochran 1977 Benchmark)
console.log('\n2. Survey / Population Estimate:');
// Infinite population, 95% confidence, 5% margin of error, p = 0.5
const infiniteSurvey = calculateSurveySampleSize({
  populationSize: 0,
  confidenceLevel: 0.95,
  marginOfError: 0.05,
  expectedProportion: 0.50,
  isFinite: false
});
assert(infiniteSurvey.requiredSample === 385, `Infinite survey n = ${infiniteSurvey.requiredSample} (Expected: 385)`);

// Finite population N = 10,000, 95% conf, 5% margin, p = 0.5
const finiteSurvey = calculateSurveySampleSize({
  populationSize: 10000,
  confidenceLevel: 0.95,
  marginOfError: 0.05,
  expectedProportion: 0.50,
  dropoutRate: 0.10,
  isFinite: true
});
// n0 = 384.15, n = 384.15 / (1 + 383.15 / 10000) = 370.01 -> ceil -> 371
assert(finiteSurvey.requiredSample === 371 || finiteSurvey.requiredSample === 370, `Finite survey n = ${finiteSurvey.requiredSample} (Expected ~370-371)`);
assert(finiteSurvey.recruitmentTarget === 413 || finiteSurvey.recruitmentTarget === 412, `Recruitment target with 10% dropout = ${finiteSurvey.recruitmentTarget}`);

// Test 3: Estimate a Mean
console.log('\n3. Estimate a Mean:');
const meanResult = calculateMeanSampleSize({
  confidenceLevel: 0.95,
  marginOfError: 2,
  stdDev: 10,
  isFinite: false
});
// n = (1.96 * 10 / 2)^2 = (9.8)^2 = 96.04 -> ceil = 97
assert(meanResult.requiredSample === 97, `Estimate mean n = ${meanResult.requiredSample} (Expected: 97)`);

// Test 4: Compare Two Means (Cohen's d = 0.5, power = 80%, alpha = 0.05, 2-sided)
console.log('\n4. Compare Two Means (Cohen 1988 Benchmark):');
const twoMeans = calculateTwoMeansSampleSize({
  effectSizeD: 0.5,
  power: 0.80,
  alpha: 0.05,
  isTwoSided: true,
  allocationRatio: 1
});
// 2 * (1.960 + 0.842)^2 / 0.5^2 = 2 * 7.849 / 0.25 = 62.8 -> 63-64 per group
assert(twoMeans.samplePerGroup >= 63 && twoMeans.samplePerGroup <= 64, `Two means per group = ${twoMeans.samplePerGroup} (Expected: 63-64)`);
assert(twoMeans.requiredSample === twoMeans.samplePerGroup * 2, `Total sample = ${twoMeans.requiredSample}`);

// Test 5: Compare Two Proportions (Fleiss Benchmark)
console.log('\n5. Compare Two Proportions (Fleiss):');
const twoProps = calculateTwoProportionsSampleSize({
  p1: 0.20,
  p2: 0.30,
  power: 0.80,
  alpha: 0.05,
  isTwoSided: true
});
// Standard normal power formula yields ~293-294 per group
assert(twoProps.samplePerGroup >= 290 && twoProps.samplePerGroup <= 300, `Two proportions per group = ${twoProps.samplePerGroup} (Expected: ~294)`);

// Test 6: Correlation Sample Size (r = 0.30, power = 0.80, alpha = 0.05)
console.log('\n6. Correlation Study (Fisher z):');
const corr = calculateCorrelationSampleSize({
  expectedCorrelation: 0.30,
  power: 0.80,
  alpha: 0.05,
  isTwoSided: true
});
// Fisher C = 0.5 * ln(1.3 / 0.7) = 0.3095, ((1.96 + 0.8416) / 0.3095)^2 + 3 = 81.89 + 3 = 84.89 -> ceil = 85
assert(corr.requiredSample >= 84 && corr.requiredSample <= 86, `Correlation sample = ${corr.requiredSample} (Expected: 84-85)`);

// Test 7: A/B Test Sample Size & Duration
console.log('\n7. A/B Test Sample Size & Duration:');
const abTest = calculateABTestSampleSize({
  baselineConversionRate: 0.05,
  mde: 0.20,
  mdeType: 'relative',
  power: 0.80,
  alpha: 0.05,
  dailyTraffic: 5000
});
assert(Math.abs(abTest.variantConversionRate - 0.06) < 1e-6, `Variant CR = ${(abTest.variantConversionRate * 100).toFixed(1)}% (Expected 6.0%)`);
assert(abTest.samplePerVariant > 8000, `A/B test per variant = ${abTest.samplePerVariant}`);
assert(abTest.durationDays > 0, `Duration in days = ${abTest.durationDays}`);

// Test 8: Validation Bounds
console.log('\n8. Input Validation Checks:');
const invalid1 = calculateSurveySampleSize({ marginOfError: -0.05 });
assert(!invalid1.isValid, 'Rejects negative margin of error');
const invalid2 = calculateTwoMeansSampleSize({ effectSizeD: 0 });
assert(!invalid2.isValid, 'Rejects zero effect size');
const invalid3 = calculateTwoProportionsSampleSize({ p1: 0.20, p2: 0.20 });
assert(!invalid3.isValid, 'Rejects identical proportions (delta = 0)');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
