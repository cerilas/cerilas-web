/**
 * Enterprise Deterministic Statistical Calculation Engine
 * Implements standard power and sample size formulas across 7 study designs:
 * 1. Survey / Population Estimate
 * 2. Estimate a Proportion
 * 3. Estimate a Mean
 * 4. Compare Two Means (Independent Two-Sample)
 * 5. Compare Two Proportions (Two-Sample Test of Proportions)
 * 6. Correlation Study (Fisher's z-transformation)
 * 7. A/B Testing (Binary Conversion Uplift with Duration Estimation)
 */

import {
  normalInvCDF,
  getZForConfidence,
  getCriticalZ,
  getPowerZ,
  fisherZ
} from './distributions.js';

/**
 * Adjust required completed sample size for expected dropout or non-response rate.
 * Formula: n_recruitment = ceil(n_required / (1 - dropoutRate))
 */
export function applyDropoutAdjustment(requiredSample, dropoutRate = 0) {
  if (!requiredSample || isNaN(requiredSample) || requiredSample <= 0) return 0;
  const rate = Math.max(0, Math.min(0.95, Number(dropoutRate) || 0));
  if (rate === 0) return Math.ceil(requiredSample);
  return Math.ceil(requiredSample / (1 - rate));
}

/**
 * 1. Survey / Population Estimate
 * Computes Cochran's sample size with optional Finite Population Correction (FPC).
 */
export function calculateSurveySampleSize({
  populationSize = 10000,
  confidenceLevel = 0.95,
  marginOfError = 0.05,
  expectedProportion = 0.50,
  dropoutRate = 0,
  isFinite = true
}) {
  const errors = [];
  const N = Number(populationSize);
  const conf = Number(confidenceLevel);
  const e = Number(marginOfError);
  const p = Number(expectedProportion);
  const d = Number(dropoutRate) || 0;

  if (isFinite && (!N || N < 1 || !Number.isFinite(N))) {
    errors.push('Population size must be a positive integer.');
  }
  if (conf <= 0 || conf >= 1) errors.push('Confidence level must be between 0% and 100%.');
  if (e <= 0 || e >= 1) errors.push('Margin of error must be between 0% and 100%.');
  if (p <= 0 || p >= 1) errors.push('Expected proportion must be between 0% and 100%.');
  if (d < 0 || d >= 1) errors.push('Dropout rate must be between 0% and 100%.');

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const Z = getZForConfidence(conf);
  // Cochran's initial infinite-population sample size
  const n0 = (Math.pow(Z, 2) * p * (1 - p)) / Math.pow(e, 2);

  let nFinalRaw = n0;
  if (isFinite && N > 0) {
    // Finite Population Correction: n = n0 / (1 + (n0 - 1) / N)
    nFinalRaw = n0 / (1 + (n0 - 1) / N);
  }

  const requiredSample = Math.ceil(nFinalRaw);
  const recruitmentTarget = applyDropoutAdjustment(requiredSample, d);

  const breakdown = [
    `Confidence Level: ${(conf * 100).toFixed(1).replace(/\.0$/, '')}% → Critical Z = ${Z.toFixed(3)}`,
    `Expected Proportion (p): ${(p * 100).toFixed(1).replace(/\.0$/, '')}% (q = ${(1 - p).toFixed(2)})`,
    `Margin of Error (e): ±${(e * 100).toFixed(1).replace(/\.0$/, '')}%`,
    ...(isFinite ? [`Population Size (N): ${N.toLocaleString()}`] : ['Population Size: Infinite / Unknown']),
    '',
    '1. Initial Infinite-Population Sample Size (n₀):',
    `   n₀ = (Z² × p × (1 - p)) / e²`,
    `   n₀ = (${Z.toFixed(3)}² × ${p.toFixed(2)} × ${(1 - p).toFixed(2)}) / ${e.toFixed(3)}²`,
    `   n₀ = ${(Math.pow(Z, 2) * p * (1 - p)).toFixed(4)} / ${Math.pow(e, 2).toFixed(6)}`,
    `   n₀ = ${n0.toFixed(2)}`,
    ...(isFinite ? [
      '',
      '2. Finite Population Correction (FPC):',
      `   n = n₀ / (1 + (n₀ - 1) / N)`,
      `   n = ${n0.toFixed(2)} / (1 + (${(n0 - 1).toFixed(2)} / ${N.toLocaleString()}))`,
      `   n = ${n0.toFixed(2)} / ${(1 + (n0 - 1) / N).toFixed(5)}`,
      `   n = ${nFinalRaw.toFixed(2)}`
    ] : []),
    '',
    `3. Minimum Required Completed Sample:`,
    `   n = ⌈${nFinalRaw.toFixed(2)}⌉ = ${requiredSample.toLocaleString()} participants`,
    ...(d > 0 ? [
      '',
      `4. Non-Response / Dropout Adjustment (${(d * 100).toFixed(0)}%):`,
      `   Target = ⌈${requiredSample} / (1 - ${d.toFixed(2)})⌉`,
      `   Target = ⌈${(requiredSample / (1 - d)).toFixed(2)}⌉ = ${recruitmentTarget.toLocaleString()} participants`
    ] : [])
  ].join('\n');

  const summary = `A sample of at least ${requiredSample.toLocaleString()} completed responses is required to estimate the population proportion with a ${(conf * 100).toFixed(0)}% confidence level and ±${(e * 100).toFixed(1).replace(/\.0$/, '')}% margin of error${isFinite ? ` across a population of ${N.toLocaleString()}` : ''}.`;

  return {
    isValid: true,
    requiredSample,
    recruitmentTarget,
    breakdown,
    summary,
    stats: {
      Z,
      n0,
      nFinalRaw,
      populationSize: isFinite ? N : null,
      confidenceLevel: conf,
      marginOfError: e,
      expectedProportion: p,
      dropoutRate: d
    }
  };
}

/**
 * 2. Estimate a Proportion
 * For public opinion, prevalence studies, or election polls.
 */
export function calculateProportionSampleSize(params) {
  return calculateSurveySampleSize(params);
}

/**
 * 3. Estimate a Mean
 * Computes sample size to estimate a continuous mean within margin E.
 * Formula: n0 = (Z * sigma / E)^2
 */
export function calculateMeanSampleSize({
  confidenceLevel = 0.95,
  marginOfError = 2,
  stdDev = 10,
  populationSize = 10000,
  isFinite = false,
  dropoutRate = 0
}) {
  const errors = [];
  const conf = Number(confidenceLevel);
  const E = Number(marginOfError);
  const sigma = Number(stdDev);
  const N = Number(populationSize);
  const d = Number(dropoutRate) || 0;

  if (conf <= 0 || conf >= 1) errors.push('Confidence level must be between 0% and 100%.');
  if (E <= 0) errors.push('Margin of error must be a positive number.');
  if (sigma <= 0) errors.push('Standard deviation (σ) must be a positive number.');
  if (isFinite && (!N || N < 1)) errors.push('Population size must be a positive integer.');

  if (errors.length > 0) return { isValid: false, errors };

  const Z = getZForConfidence(conf);
  const n0 = Math.pow((Z * sigma) / E, 2);

  let nFinalRaw = n0;
  if (isFinite && N > 0) {
    nFinalRaw = n0 / (1 + (n0 - 1) / N);
  }

  const requiredSample = Math.ceil(nFinalRaw);
  const recruitmentTarget = applyDropoutAdjustment(requiredSample, d);

  const breakdown = [
    `Confidence Level: ${(conf * 100).toFixed(1).replace(/\.0$/, '')}% → Critical Z = ${Z.toFixed(3)}`,
    `Expected Standard Deviation (σ): ${sigma}`,
    `Desired Precision / Margin of Error (E): ±${E}`,
    ...(isFinite ? [`Population Size (N): ${N.toLocaleString()}`] : ['Population: Infinite / Unspecified']),
    '',
    '1. Sample Size Formula for Estimating a Mean:',
    `   n₀ = (Z × σ / E)²`,
    `   n₀ = (${Z.toFixed(3)} × ${sigma} / ${E})²`,
    `   n₀ = (${(Z * sigma).toFixed(3)} / ${E})² = ${Math.pow((Z * sigma) / E, 2).toFixed(2)}`,
    ...(isFinite ? [
      '',
      '2. Finite Population Correction:',
      `   n = n₀ / (1 + (n₀ - 1) / N) = ${nFinalRaw.toFixed(2)}`
    ] : []),
    '',
    `3. Minimum Required Sample:`,
    `   n = ⌈${nFinalRaw.toFixed(2)}⌉ = ${requiredSample.toLocaleString()} subjects`,
    ...(d > 0 ? [
      '',
      `4. Non-Response / Dropout Target (${(d * 100).toFixed(0)}%):`,
      `   Target = ⌈${requiredSample} / (1 - ${d.toFixed(2)})⌉ = ${recruitmentTarget.toLocaleString()} subjects`
    ] : [])
  ].join('\n');

  const summary = `A minimum sample of ${requiredSample.toLocaleString()} subjects is required to estimate the true mean within ±${E} units with ${(conf * 100).toFixed(0)}% confidence, assuming a standard deviation of ${sigma}.`;

  return {
    isValid: true,
    requiredSample,
    recruitmentTarget,
    breakdown,
    summary,
    stats: { Z, sigma, E, n0, nFinalRaw }
  };
}

/**
 * 4. Compare Two Means (Independent Samples t / Z-Test Power Analysis)
 * Standard formula for detecting standardized effect size Cohen's d:
 * n_per_group = (1 + 1/kappa) * (Z_(alpha/2) + Z_beta)^2 / d^2
 * where kappa = n2 / n1 (allocation ratio).
 */
export function calculateTwoMeansSampleSize({
  effectSizeD = 0.5,
  power = 0.80,
  alpha = 0.05,
  isTwoSided = true,
  allocationRatio = 1,
  dropoutRate = 0
}) {
  const errors = [];
  const d = Number(effectSizeD);
  const pwr = Number(power);
  const a = Number(alpha);
  const kappa = Number(allocationRatio) || 1;
  const drop = Number(dropoutRate) || 0;

  if (d <= 0) errors.push("Cohen's d effect size must be greater than 0.");
  if (pwr <= 0 || pwr >= 1) errors.push('Statistical power must be between 0% and 100%.');
  if (a <= 0 || a >= 1) errors.push('Significance level (α) must be between 0 and 1.');
  if (kappa <= 0) errors.push('Group allocation ratio must be positive.');

  if (errors.length > 0) return { isValid: false, errors };

  const zAlpha = getCriticalZ(a, isTwoSided);
  const zBeta = getPowerZ(pwr);

  // Group 1 size
  const n1Raw = ((1 + 1 / kappa) * Math.pow(zAlpha + zBeta, 2)) / Math.pow(d, 2);
  const n1 = Math.ceil(n1Raw);
  const n2 = Math.ceil(n1 * kappa);
  const totalRequired = n1 + n2;
  const totalRecruitment = applyDropoutAdjustment(totalRequired, drop);

  const breakdown = [
    `Effect Size (Cohen's d): ${d}`,
    `Significance Level (α): ${a} (${isTwoSided ? 'Two-sided' : 'One-sided'}) → Z_α = ${zAlpha.toFixed(3)}`,
    `Statistical Power (1 - β): ${(pwr * 100).toFixed(0)}% → Z_β = ${zBeta.toFixed(3)}`,
    `Group Allocation Ratio (n₂ / n₁): ${kappa === 1 ? '1:1 (Equal)' : `${kappa}:1`}`,
    '',
    '1. Power Equation for Two Independent Means:',
    `   n₁ = (1 + 1/κ) × (Z_α + Z_β)² / d²`,
    `   n₁ = (1 + ${(1 / kappa).toFixed(2)}) × (${zAlpha.toFixed(3)} + ${zBeta.toFixed(3)})² / ${d}²`,
    `   n₁ = ${(1 + 1 / kappa).toFixed(2)} × ${(Math.pow(zAlpha + zBeta, 2)).toFixed(3)} / ${(Math.pow(d, 2)).toFixed(4)}`,
    `   n₁ = ${n1Raw.toFixed(2)} → ⌈${n1Raw.toFixed(2)}⌉ = ${n1.toLocaleString()} participants in Group 1`,
    `   n₂ = ⌈n₁ × κ⌉ = ${n2.toLocaleString()} participants in Group 2`,
    '',
    `2. Total Required Sample: ${totalRequired.toLocaleString()} participants (${n1.toLocaleString()} + ${n2.toLocaleString()})`,
    ...(drop > 0 ? [
      '',
      `3. Recommended Recruitment Target with ${(drop * 100).toFixed(0)}% Dropout:`,
      `   Target = ⌈${totalRequired} / (1 - ${drop.toFixed(2)})⌉ = ${totalRecruitment.toLocaleString()} total participants`
    ] : [])
  ].join('\n');

  const summary = `To detect a Cohen's d effect size of ${d} with ${(pwr * 100).toFixed(0)}% power at α = ${a} (${isTwoSided ? 'two-sided' : 'one-sided'}), you need ${n1.toLocaleString()} participants per group (${totalRequired.toLocaleString()} total).`;

  return {
    isValid: true,
    requiredSample: totalRequired,
    samplePerGroup: n1,
    sampleGroup2: n2,
    recruitmentTarget: totalRecruitment,
    breakdown,
    summary,
    stats: { zAlpha, zBeta, d, power: pwr, alpha: a, kappa }
  };
}

/**
 * 5. Compare Two Proportions (Two-Sample Binary Test)
 * Fleiss / standard pooled power analysis formula for comparing rates p1 and p2.
 */
export function calculateTwoProportionsSampleSize({
  p1 = 0.20,
  p2 = 0.30,
  power = 0.80,
  alpha = 0.05,
  isTwoSided = true,
  allocationRatio = 1,
  dropoutRate = 0
}) {
  const errors = [];
  const prop1 = Number(p1);
  const prop2 = Number(p2);
  const pwr = Number(power);
  const a = Number(alpha);
  const drop = Number(dropoutRate) || 0;

  if (prop1 <= 0 || prop1 >= 1) errors.push('Baseline / Control proportion must be between 0% and 100%.');
  if (prop2 <= 0 || prop2 >= 1) errors.push('Treatment proportion must be between 0% and 100%.');
  if (prop1 === prop2) errors.push('Control and Treatment proportions cannot be identical (effect size is 0).');
  if (pwr <= 0 || pwr >= 1) errors.push('Statistical power must be between 0% and 100%.');
  if (a <= 0 || a >= 1) errors.push('Significance level (α) must be between 0 and 1.');

  if (errors.length > 0) return { isValid: false, errors };

  const zAlpha = getCriticalZ(a, isTwoSided);
  const zBeta = getPowerZ(pwr);

  const pBar = (prop1 + prop2) / 2;
  const qBar = 1 - pBar;
  const q1 = 1 - prop1;
  const q2 = 1 - prop2;
  const delta = Math.abs(prop1 - prop2);

  // Standard normal comparison formula
  const numerator = Math.pow(
    zAlpha * Math.sqrt(2 * pBar * qBar) + zBeta * Math.sqrt(prop1 * q1 + prop2 * q2),
    2
  );
  const nRaw = numerator / Math.pow(delta, 2);
  const nPerGroup = Math.ceil(nRaw);
  const totalRequired = nPerGroup * 2;
  const totalRecruitment = applyDropoutAdjustment(totalRequired, drop);

  const breakdown = [
    `Control Proportion (p₁): ${(prop1 * 100).toFixed(1)}%`,
    `Treatment Proportion (p₂): ${(prop2 * 100).toFixed(1)}%`,
    `Difference (Δ): ${(delta * 100).toFixed(1)}%`,
    `Significance Level (α): ${a} (${isTwoSided ? 'Two-sided' : 'One-sided'}) → Z_α = ${zAlpha.toFixed(3)}`,
    `Statistical Power (1 - β): ${(pwr * 100).toFixed(0)}% → Z_β = ${zBeta.toFixed(3)}`,
    `Average Proportion (p̄): ${(pBar * 100).toFixed(1)}%`,
    '',
    '1. Power Formula for Comparing Two Proportions:',
    `   n = [ Z_α × √(2 × p̄ × (1 - p̄)) + Z_β × √(p₁q₁ + p₂q₂) ]² / (p₁ - p₂)²`,
    `   n = [ ${zAlpha.toFixed(3)} × √(${(2 * pBar * qBar).toFixed(4)}) + ${zBeta.toFixed(3)} × √(${(prop1 * q1 + prop2 * q2).toFixed(4)}) ]² / ${delta.toFixed(4)}²`,
    `   n = ${nRaw.toFixed(2)} → ⌈${nRaw.toFixed(2)}⌉ = ${nPerGroup.toLocaleString()} per group`,
    '',
    `2. Total Required Sample: ${totalRequired.toLocaleString()} subjects (${nPerGroup.toLocaleString()} in Control + ${nPerGroup.toLocaleString()} in Treatment)`,
    ...(drop > 0 ? [
      '',
      `3. Recommended Recruitment Target with ${(drop * 100).toFixed(0)}% Dropout:`,
      `   Target = ⌈${totalRequired} / (1 - ${drop.toFixed(2)})⌉ = ${totalRecruitment.toLocaleString()} total subjects`
    ] : [])
  ].join('\n');

  const summary = `You need at least ${nPerGroup.toLocaleString()} participants per group (${totalRequired.toLocaleString()} total) to reliably detect a difference between ${(prop1 * 100).toFixed(1)}% and ${(prop2 * 100).toFixed(1)}% with ${(pwr * 100).toFixed(0)}% power at α = ${a}.`;

  return {
    isValid: true,
    requiredSample: totalRequired,
    samplePerGroup: nPerGroup,
    recruitmentTarget: totalRecruitment,
    breakdown,
    summary,
    stats: { zAlpha, zBeta, prop1, prop2, delta, nRaw }
  };
}

/**
 * 6. Correlation Sample Size
 * Computes sample size to detect Pearson correlation coefficient r using Fisher's z-transformation.
 * Formula: N = ((Z_alpha + Z_beta) / C)^2 + 3, where C = 0.5 * ln((1 + r) / (1 - r))
 */
export function calculateCorrelationSampleSize({
  expectedCorrelation = 0.30,
  power = 0.80,
  alpha = 0.05,
  isTwoSided = true,
  dropoutRate = 0
}) {
  const errors = [];
  const r = Number(expectedCorrelation);
  const pwr = Number(power);
  const a = Number(alpha);
  const drop = Number(dropoutRate) || 0;

  if (Math.abs(r) <= 0 || Math.abs(r) >= 1) {
    errors.push('Correlation coefficient (r) must be between -1.0 and +1.0 (excluding 0).');
  }
  if (pwr <= 0 || pwr >= 1) errors.push('Statistical power must be between 0% and 100%.');
  if (a <= 0 || a >= 1) errors.push('Significance level (α) must be between 0 and 1.');

  if (errors.length > 0) return { isValid: false, errors };

  const zAlpha = getCriticalZ(a, isTwoSided);
  const zBeta = getPowerZ(pwr);
  const C = Math.abs(fisherZ(r));

  const nRaw = Math.pow((zAlpha + zBeta) / C, 2) + 3;
  const requiredSample = Math.ceil(nRaw);
  const recruitmentTarget = applyDropoutAdjustment(requiredSample, drop);

  const breakdown = [
    `Expected Correlation (r): ${r}`,
    `Significance Level (α): ${a} (${isTwoSided ? 'Two-sided' : 'One-sided'}) → Z_α = ${zAlpha.toFixed(3)}`,
    `Statistical Power (1 - β): ${(pwr * 100).toFixed(0)}% → Z_β = ${zBeta.toFixed(3)}`,
    '',
    "1. Fisher's z-Transformation:",
    `   C = 0.5 × ln((1 + |r|) / (1 - |r|))`,
    `   C = 0.5 × ln(${(1 + Math.abs(r)).toFixed(2)} / ${(1 - Math.abs(r)).toFixed(2)}) = ${C.toFixed(4)}`,
    '',
    '2. Required Sample Size Equation:',
    `   N = [ (Z_α + Z_β) / C ]² + 3`,
    `   N = [ (${zAlpha.toFixed(3)} + ${zBeta.toFixed(3)}) / ${C.toFixed(4)} ]² + 3`,
    `   N = [ ${(zAlpha + zBeta).toFixed(3)} / ${C.toFixed(4)} ]² + 3 = ${nRaw.toFixed(2)}`,
    '',
    `3. Minimum Required Sample: ⌈${nRaw.toFixed(2)}⌉ = ${requiredSample.toLocaleString()} paired observations`,
    ...(drop > 0 ? [
      '',
      `4. Non-Response Allowance (${(drop * 100).toFixed(0)}%):`,
      `   Target = ⌈${requiredSample} / (1 - ${drop.toFixed(2)})⌉ = ${recruitmentTarget.toLocaleString()} participants`
    ] : [])
  ].join('\n');

  const summary = `This sample size is designed to detect a correlation of approximately r = ${r} with ${(pwr * 100).toFixed(0)}% statistical power at α = ${a} (${isTwoSided ? 'two-sided' : 'one-sided'}).`;

  return {
    isValid: true,
    requiredSample,
    recruitmentTarget,
    breakdown,
    summary,
    stats: { zAlpha, zBeta, r, C, nRaw }
  };
}

/**
 * 7. A/B Test Sample Size & Duration Calculator
 * Supports absolute MDE (+1 percentage point) or relative MDE (+20%).
 * Computes required visitors per variant, total traffic, and test duration in days.
 */
export function calculateABTestSampleSize({
  baselineConversionRate = 0.05,
  mde = 0.20,
  mdeType = 'relative', // 'relative' or 'absolute'
  power = 0.80,
  alpha = 0.05,
  trafficSplit = 0.50, // 50/50
  dailyTraffic = 5000,
  isTwoSided = true,
  dropoutRate = 0
}) {
  const errors = [];
  const baseCR = Number(baselineConversionRate);
  const mdeVal = Number(mde);
  const pwr = Number(power);
  const a = Number(alpha);
  const split = Number(trafficSplit) || 0.5;
  const traffic = Number(dailyTraffic);

  if (baseCR <= 0 || baseCR >= 1) errors.push('Baseline conversion rate must be between 0% and 100%.');
  if (mdeVal <= 0) errors.push('Minimum Detectable Effect (MDE) must be a positive number.');
  if (pwr <= 0 || pwr >= 1) errors.push('Statistical power must be between 0% and 100%.');
  if (a <= 0 || a >= 1) errors.push('Significance level (α) must be between 0 and 1.');

  // Calculate variant conversion rate
  let variantCR = 0;
  if (mdeType === 'relative') {
    variantCR = baseCR * (1 + mdeVal);
  } else {
    // absolute percentage point increase
    variantCR = baseCR + mdeVal;
  }

  if (variantCR <= 0 || variantCR >= 1) {
    errors.push(`Expected variant conversion rate (${(variantCR * 100).toFixed(2)}%) must remain strictly between 0% and 100%.`);
  }

  if (errors.length > 0) return { isValid: false, errors };

  const twoPropResult = calculateTwoProportionsSampleSize({
    p1: baseCR,
    p2: variantCR,
    power: pwr,
    alpha: a,
    isTwoSided,
    allocationRatio: split / (1 - split),
    dropoutRate: 0
  });

  if (!twoPropResult.isValid) {
    return twoPropResult;
  }

  const perVariant = twoPropResult.samplePerGroup;
  const totalVisitors = perVariant * 2;
  const durationDays = traffic > 0 ? Math.ceil(totalVisitors / traffic) : null;

  const breakdown = [
    `Baseline Conversion Rate: ${(baseCR * 100).toFixed(2)}%`,
    `Minimum Detectable Effect (MDE): ${mdeType === 'relative' ? `+${(mdeVal * 100).toFixed(1)}% relative` : `+${(mdeVal * 100).toFixed(2)}% absolute`}`,
    `Expected Variant Conversion Rate: ${(variantCR * 100).toFixed(2)}%`,
    `Traffic Split: ${(split * 100).toFixed(0)}% / ${((1 - split) * 100).toFixed(0)}%`,
    `Statistical Power: ${(pwr * 100).toFixed(0)}%, Significance Level α: ${a}`,
    '',
    `1. Required Visitors Per Variant: ${perVariant.toLocaleString()} visitors`,
    `2. Total Experiment Sample: ${totalVisitors.toLocaleString()} visitors`,
    ...(traffic > 0 ? [
      '',
      `3. Estimated Experiment Duration at ${traffic.toLocaleString()} visitors/day:`,
      `   Duration = ⌈${totalVisitors.toLocaleString()} / ${traffic.toLocaleString()}⌉ = ${durationDays} days (~${(durationDays / 7).toFixed(1)} weeks)`
    ] : [])
  ].join('\n');

  const summary = `You will need approximately ${perVariant.toLocaleString()} visitors per variant (${totalVisitors.toLocaleString()} total visitors)${traffic > 0 ? `, which will take about ${durationDays} days at ${traffic.toLocaleString()} visitors/day` : ''} to reliably detect a ${mdeType === 'relative' ? `${(mdeVal * 100).toFixed(0)}% relative` : `${(mdeVal * 100).toFixed(2)}%`} lift in conversion rate.`;

  return {
    isValid: true,
    requiredSample: totalVisitors,
    samplePerVariant: perVariant,
    variantConversionRate: variantCR,
    durationDays,
    breakdown,
    summary,
    stats: {
      baselineCR: baseCR,
      variantCR,
      mde: mdeVal,
      mdeType,
      perVariant,
      totalVisitors,
      durationDays
    }
  };
}
