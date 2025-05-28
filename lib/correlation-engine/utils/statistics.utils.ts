// General statistics utilities
export function mean(data: number[]): number {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

export function stddev(data: number[]): number {
  const m = mean(data);
  return Math.sqrt(data.reduce((a, b) => a + (b - m) ** 2, 0) / data.length);
}
