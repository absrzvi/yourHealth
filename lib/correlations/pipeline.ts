import { BloodTestParser } from '../parsers/BloodTestParser';
import { calculateCorrelations, filterSignificantCorrelations, topCorrelations } from './CorrelationEngine';
import { Biomarker, CorrelationResult } from '../../types/health';

export async function analyzeBloodTestReport(csvContent: string): Promise<CorrelationResult[]> {
  const parser = new BloodTestParser();
  const biomarkers: Biomarker[] = await parser.parse(csvContent);

  // Calculate all correlations
  const allCorrelations = calculateCorrelations(biomarkers);

  // Filter for statistically significant correlations (p < 0.05)
  const significant = filterSignificantCorrelations(allCorrelations, 0.05);

  // Return top 5 correlations
  return topCorrelations(significant, 5);
}
