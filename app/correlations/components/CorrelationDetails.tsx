// Detailed view of a correlation
import { Correlation } from '../../../lib/correlation-engine/types/correlation.types';

export default function CorrelationDetails({ correlation }: { correlation: Correlation }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Correlation Details</h2>
      {/* TODO: Add scatter plot, statistics table, insight explanation, export options */}
      <pre>{JSON.stringify(correlation, null, 2)}</pre>
    </div>
  );
}
