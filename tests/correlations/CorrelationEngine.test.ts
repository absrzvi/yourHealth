import { describe, it, expect } from 'vitest';
import { calculateCorrelations } from '../../lib/correlations/CorrelationEngine';
import { Biomarker } from '../../types/health';

describe('calculateCorrelations', () => {
  it('calculates correlation between two biomarkers', () => {
    const biomarkers: Biomarker[] = [
      { name: 'A', value: 1, unit: '', date: new Date(), source: 'USER_INPUT' },
      { name: 'A', value: 2, unit: '', date: new Date(), source: 'USER_INPUT' },
      { name: 'A', value: 3, unit: '', date: new Date(), source: 'USER_INPUT' },
      { name: 'B', value: 2, unit: '', date: new Date(), source: 'USER_INPUT' },
      { name: 'B', value: 4, unit: '', date: new Date(), source: 'USER_INPUT' },
      { name: 'B', value: 6, unit: '', date: new Date(), source: 'USER_INPUT' },
    ];
    const results = calculateCorrelations(biomarkers);
    expect(results).toHaveLength(1);
    expect(results[0].variableA).toBe('A');
    expect(results[0].variableB).toBe('B');
    expect(Math.abs(results[0].coefficient - 1)).toBeLessThan(0.01); // Perfect positive correlation
  });
});
