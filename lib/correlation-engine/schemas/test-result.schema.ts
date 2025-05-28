import { z } from 'zod';
import { BiomarkerSchema } from './biomarker.schema';

export const TestResultSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fileName: z.string(),
  fileType: z.enum(['pdf', 'csv', 'json']),
  uploadDate: z.date(),
  processedDate: z.date().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  biomarkers: z.array(BiomarkerSchema),
  metadata: z.object({
    labName: z.string().optional(),
    testType: z.string().optional(),
    originalFileName: z.string(),
    fileSize: z.number(),
    processingTime: z.number().optional(),
  }),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
  })).optional(),
});
