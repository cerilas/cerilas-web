/**
 * High-Precision Statistical Distributions & Quantile Functions
 * Used for deterministic sample size and power calculations.
 */

/**
 * Standard Normal Cumulative Distribution Function Φ(z)
 * Abramowitz and Stegun approximation (formula 26.2.17) with absolute error < 7.5e-8
 */
export function normalCDF(z) {
  if (isNaN(z)) return NaN;
  if (z === -Infinity) return 0;
  if (z === Infinity) return 1;

  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = (((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t);
  const pdf = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * absZ * absZ);
  const cdf = 1.0 - pdf * poly;

  return z >= 0 ? cdf : 1.0 - cdf;
}

/**
 * Inverse Normal Cumulative Distribution Function (Probit / Quantile Function)
 * Algorithm by Peter J. Acklam (precision ~ 1.15e-9)
 * Maps probability p ∈ (0, 1) to standard normal deviate Z.
 */
export function normalInvCDF(p) {
  if (p <= 0 || p >= 1) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    return NaN;
  }

  // Coefficients in rational approximations
  const a1 = -3.969683028665376e+01;
  const a2 =  2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 =  1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 =  2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 =  1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 =  6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 =  4.374664141464968e+00;
  const c6 =  2.938163982698783e+00;

  const d1 =  7.784695709041462e-03;
  const d2 =  3.224671290700398e-01;
  const d3 =  2.445134137142996e+00;
  const d4 =  3.754408661907416e+00;

  // Break-points
  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q, r;

  // Rational approximation for lower region
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  // Rational approximation for upper region
  if (p > p_high) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  // Rational approximation for central region
  q = p - 0.5;
  r = q * q;
  return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
         (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
}

/**
 * Get standard critical two-sided Z-value for confidence level (e.g. 0.95 -> 1.960)
 */
export function getZForConfidence(confidenceLevel) {
  const p = 1 - (1 - confidenceLevel) / 2;
  return normalInvCDF(p);
}

/**
 * Get one-sided or two-sided critical Z for significance level alpha
 */
export function getCriticalZ(alpha, isTwoSided = true) {
  const p = isTwoSided ? 1 - alpha / 2 : 1 - alpha;
  return normalInvCDF(p);
}

/**
 * Get Z-value for statistical power (1 - beta)
 * For 80% power -> Z ≈ 0.8416; for 90% power -> Z ≈ 1.2816
 */
export function getPowerZ(power) {
  return normalInvCDF(power);
}

/**
 * Fisher's z-transformation for Pearson correlation coefficient r
 * z = 0.5 * ln((1 + r) / (1 - r))
 */
export function fisherZ(r) {
  if (Math.abs(r) >= 1) return NaN;
  return 0.5 * Math.log((1 + r) / (1 - r));
}

/**
 * Inverse Fisher's z-transformation
 * r = (exp(2z) - 1) / (exp(2z) + 1)
 */
export function invFisherZ(z) {
  const exp2z = Math.exp(2 * z);
  return (exp2z - 1) / (exp2z + 1);
}
