/**
 * Type declarations to fix TypeScript issues with the Prisma client
 * Adds missing model types through declaration merging
 */
import { PrismaClient } from '@prisma/client'

declare global {
  // Extend PrismaClient with our model properties
  namespace PrismaClient {
    export interface PrismaClient {
      bloodTestReport: any;
      bloodBiomarker: any;
      bloodReportSection: any;
    }
  }
}
