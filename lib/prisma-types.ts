/**
 * Additional type definitions for Prisma to resolve TypeScript errors
 */
import { PrismaClient } from '@prisma/client';

/**
 * Extends the PrismaClient with proper type definitions for our models
 * This helps TypeScript recognize the model properties correctly
 */
export interface ExtendedPrismaClient extends PrismaClient {
  bloodTestReport: any;
  bloodBiomarker: any;
  bloodReportSection: any;
}
