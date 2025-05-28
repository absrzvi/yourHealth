// Pearson correlation algorithm stub
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must be of equal length');
  }
  const n = x.length;
  if (n === 0) {
    throw new Error('Arrays must not be empty');
  }
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) {
    throw new Error('Zero variance');
  }
  return numerator / denominator;
}

