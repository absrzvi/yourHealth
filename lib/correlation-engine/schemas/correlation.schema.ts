import { z } from 'zod';

export const CorrelationSchema = z.object({
  id: z.string(),
  biomarkerA: z.object({ id: z.string(), name: z.string() }),
  biomarkerB: z.object({ id: z.string(), name: z.string() }),
  coefficient: z.number(),
  pValue: z.number(),
  confidence: z.number(),
  strength: z.enum(['weak', 'moderate', 'strong']),
  direction: z.enum(['positive', 'negative']),
  sampleSize: z.number(),
  significance: z.boolean(),
  insight: z.object({
    summary: z.string(),
    actionabilityScore: z.number(),
    disclaimer: z.string().optional(),
  }).optional(),
});
