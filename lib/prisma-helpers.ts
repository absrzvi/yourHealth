/**
 * Prisma Helper Utilities
 * 
 * This file provides utility functions and type wrappers for working with Prisma,
 * especially to handle TypeScript model naming inconsistencies.
 */

import prisma from './prisma';
import { ExtendedPrismaClient } from './prisma-types';

// Cast the prisma client to our extended type that includes blood report models
const extendedPrisma = prisma as unknown as ExtendedPrismaClient;

/**
 * Prisma model accessor that safely handles model name casing issues
 * between TypeScript type checking and Prisma runtime behavior.
 */
export const models = {
  // Blood reports related models
  bloodTestReport: extendedPrisma.bloodTestReport,
  bloodBiomarker: extendedPrisma.bloodBiomarker,
  bloodReportSection: extendedPrisma.bloodReportSection,
  
  // Other application models
  user: prisma.user,
  report: prisma.report,
  healthMetric: prisma.healthMetric,
  chatSession: prisma.chatSession,
  chatMessage: prisma.chatMessage,
  weeklyInsight: prisma.weeklyInsight,
  dNASequence: prisma.dNASequence,
  microbiomeSample: prisma.microbiomeSample,
  microbiomeOrganism: prisma.microbiomeOrganism,
};

export default prisma;
