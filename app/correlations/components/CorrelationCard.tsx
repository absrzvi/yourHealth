// Card for displaying a single correlation
import { Correlation } from '../../../lib/correlation-engine/types/correlation.types';

export default function CorrelationCard({ correlation }: { correlation: Correlation }) {
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="font-semibold">{correlation.biomarkerA.name} &ndash; {correlation.biomarkerB.name}</div>
      <div>Coefficient: {correlation.coefficient}</div>
      <div>Strength: {correlation.strength}</div>
      <div>Significance: {correlation.significance ? 'Yes' : 'No'}</div>
      {/* TODO: Add badges, quick insight, and actions */}
    </div>
  );
}
