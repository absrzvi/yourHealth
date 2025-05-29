/**
 * Calculate Pearson correlation coefficient between two arrays of numbers
 */
export function calculatePearson(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Input arrays must have the same length');
  }

  const n = x.length;
  if (n === 0) return 0;

  // Calculate means
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate covariance and variances
  let cov = 0;
  let varX = 0;
  let varY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  // Handle edge cases
  if (varX === 0 || varY === 0) return 0;

  // Calculate correlation coefficient
  return cov / Math.sqrt(varX * varY);
}

/**
 * Calculate p-value for a Pearson correlation coefficient
 * using a two-tailed t-test
 */
export function calculatePValue(r: number, n: number): number {
  if (n <= 2) return 1;
  
  // Calculate t-statistic
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  
  // Degrees of freedom
  const df = n - 2;
  
  // Simplified p-value calculation
  // For a more accurate calculation, consider using a proper statistics library
  const tSquared = t * t;
  // This is a rough approximation for demonstration purposes
  const p = Math.exp(-0.5 * tSquared) / Math.sqrt(2 * Math.PI);
  
  // Two-tailed test with basic approximation
  return Math.min(1, Math.max(0, p * 2));
}
