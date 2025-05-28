import { z } from 'zod';

export const BiomarkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceRange: z.object({
    min: z.number(),
    max: z.number(),
    optimalMin: z.number().optional(),
    optimalMax: z.number().optional(),
  }),
  category: z.enum(['hormone', 'vitamin', 'mineral', 'metabolic', 'genetic', 'inflammatory']),
  testDate: z.date(),
  labName: z.string().optional(),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()).optional(),
});
