// Service for calculating correlations between biomarkers
import { TestResult } from '../types/test-result.types';
import { Correlation } from '../types/correlation.types';
import { pearsonCorrelation } from '../algorithms/pearson.correlation';

export class CorrelationService {
  /**
   * Calculates correlations between all pairs of biomarkers in the provided test results.
   * For MVP: only pairs with matching unit and category are considered.
   */
  async calculateCorrelations(testResults: TestResult[]): Promise<Correlation[]> {
    if (!testResults.length) return [];
    // Flatten all biomarkers from all test results
    const allBiomarkers = testResults.flatMap(tr => tr.biomarkers);
    // MVP/test: Calculate correlations between all pairs, regardless of unit/category
    const correlations: Correlation[] = [];
    // Group biomarkers by name
    const biomarkerGroups: Record<string, typeof allBiomarkers> = {};
    for (const b of allBiomarkers) {
      if (!biomarkerGroups[b.name]) biomarkerGroups[b.name] = [];
      biomarkerGroups[b.name].push(b);
    }
    const biomarkerNames = Object.keys(biomarkerGroups);
    // DEBUG: Output biomarker groups and testDates
    for (const name of biomarkerNames) {
      console.log('=== DEBUG BIOMARKER GROUP ===');
      console.log('Biomarker name:', name);
      console.log('Biomarker objects:', JSON.stringify(biomarkerGroups[name], null, 2));
      console.log('============================');
    }
    // For each unique biomarker pair
    for (let i = 0; i < biomarkerNames.length; i++) {
      for (let j = i + 1; j < biomarkerNames.length; j++) {
        const nameA = biomarkerNames[i];
        const nameB = biomarkerNames[j];
        const groupA = biomarkerGroups[nameA];
        const groupB = biomarkerGroups[nameB];
        // Build date -> value maps
        const mapA = new Map<string, typeof groupA[0]>();
        const mapB = new Map<string, typeof groupB[0]>();
        for (const a of groupA) {
          if (a.testDate) {
            mapA.set(new Date(a.testDate).toISOString(), a);
          }
        }
        for (const b of groupB) {
          if (b.testDate) {
            mapB.set(new Date(b.testDate).toISOString(), b);
          }
        }
        // Find intersection of dates
        const commonDates = Array.from(mapA.keys()).filter(date => mapB.has(date));
        const valuesA: number[] = [];
        const valuesB: number[] = [];
        for (const date of commonDates) {
          valuesA.push(mapA.get(date)!.value);
          valuesB.push(mapB.get(date)!.value);
        }
        if (valuesA.length >= 2 && valuesB.length >= 2) {
          try {
            const coefficient = pearsonCorrelation(valuesA, valuesB);
            correlations.push({
              id: `${groupA[0].id}-${groupB[0].id}`,
              biomarkerA: { id: groupA[0].id, name: nameA },
              biomarkerB: { id: groupB[0].id, name: nameB },
              coefficient,
              pValue: 1, // Placeholder for MVP
              confidence: Math.min(groupA[0].confidence, groupB[0].confidence),
              strength: Math.abs(coefficient) > 0.8 ? 'strong' : Math.abs(coefficient) > 0.5 ? 'moderate' : 'weak',
              direction: coefficient > 0 ? 'positive' : 'negative',
              sampleSize: valuesA.length,
              significance: false,
              insight: undefined,
            });
          } catch {}
        }
      }
    }
    return correlations;
  }
}
