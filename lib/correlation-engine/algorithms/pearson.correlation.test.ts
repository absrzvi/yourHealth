import { describe, it, expect } from 'vitest';
import { pearsonCorrelation } from './pearson.correlation';

describe('pearsonCorrelation', () => {
  it('returns 1 for perfectly correlated data', () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });
  it('returns -1 for perfectly negatively correlated data', () => {
    expect(pearsonCorrelation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1);
  });
  it('throws for arrays of different lengths', () => {
    expect(() => pearsonCorrelation([1, 2], [1, 2, 3])).toThrow();
  });
});
