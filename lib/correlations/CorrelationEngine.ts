import { Biomarker, CorrelationResult } from '../../types/health';

// Helper: Calculate Pearson correlation coefficient for two numeric arrays
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;
  const numerator = x.map((xi, i) => (xi - avgX) * (y[i] - avgY)).reduce((a, b) => a + b, 0);
  const denominator = Math.sqrt(
    x.map(xi => Math.pow(xi - avgX, 2)).reduce((a, b) => a + b, 0) *
    y.map(yi => Math.pow(yi - avgY, 2)).reduce((a, b) => a + b, 0)
  );
  return denominator === 0 ? 0 : numerator / denominator;
}

// Helper: Calculate p-value for Pearson correlation
function pearsonPValue(r: number, n: number): number {
  if (n < 3) return 1;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  // Two-tailed p-value using t-distribution (approximate for large n)
  const df = n - 2;
  const p = 2 * (1 - tCDF(Math.abs(t), df));
  return p;
}

// Approximate cumulative distribution function for t-distribution
function tCDF(t: number, df: number): number {
  // For small sample sizes, use a library like jstat for accuracy.
  // Here, we use a normal approximation for simplicity.
  // You can replace this with a more accurate calculation if needed.
  const z = t / Math.sqrt(df);
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// Error function approximation
function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Main correlation function (updated)
export function calculateCorrelations(biomarkers: Biomarker[]): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  const grouped: Record<string, Biomarker[]> = {};

  // Group by biomarker name
  for (const bm of biomarkers) {
    if (!grouped[bm.name]) grouped[bm.name] = [];
    grouped[bm.name].push(bm);
  }

  const biomarkerNames = Object.keys(grouped);

  // Compare all pairs
  for (let i = 0; i < biomarkerNames.length; i++) {
    for (let j = i + 1; j < biomarkerNames.length; j++) {
      const a = grouped[biomarkerNames[i]].map(b => b.value);
      const b = grouped[biomarkerNames[j]].map(b => b.value);
      if (a.length === b.length && a.length > 2) {
        const r = pearsonCorrelation(a, b);
        const pValue = pearsonPValue(r, a.length);
        results.push({
          variableA: biomarkerNames[i],
          variableB: biomarkerNames[j],
          coefficient: r,
          pValue,
          sampleSize: a.length,
          lastUpdated: new Date(),
        });
      }
    }
  }
  return results;
}

// Filter correlations by significance
export function filterSignificantCorrelations(
  correlations: CorrelationResult[],
  alpha = 0.05
): CorrelationResult[] {
  return correlations.filter(c => c.pValue < alpha);
}

// Return top N correlations by absolute value
export function topCorrelations(
  correlations: CorrelationResult[],
  n = 5
): CorrelationResult[] {
  return [...correlations]
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, n);
}
