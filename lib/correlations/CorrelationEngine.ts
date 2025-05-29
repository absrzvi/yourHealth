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

// Main correlation function
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
      if (a.length === b.length && a.length > 1) {
        results.push({
          variableA: biomarkerNames[i],
          variableB: biomarkerNames[j],
          coefficient: pearsonCorrelation(a, b),
          pValue: 0, // Placeholder, real p-value calculation would be more involved
          sampleSize: a.length,
          lastUpdated: new Date(),
        });
      }
    }
  }
  return results;
}
