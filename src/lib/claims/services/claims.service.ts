import { PrismaClient } from '@prisma/client';
import {
  CreateClaimInput,
  CreateClaimLineInput,
  UpdateClaimInput,
  ClaimWithRelations,
  ClaimsFilter,
  ClaimsPaginationOptions,
  ClaimsResult,
  ClaimEventData,
  ClaimStatus,
  Claim,
  ClaimLine,
  ClaimEvent,
  InsurancePlan,
  User,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ClaimsError
} from '../types/claims.types';

// Define valid claim status values - updated to match Prisma schema
const CLAIM_STATUS_VALUES: ClaimStatus[] = [
  'DRAFT',
  'READY',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'DENIED',
  'PARTIALLY_PAID',
  'PAID',
  'APPEALED'
];

// Define custom types to handle Prisma client extensions
type PrismaClientWithExtensions = PrismaClient & {
  claim: any;
  claimLine: any;
  claimEvent: any;
  insurancePlan: any;
  user: any;
};

type PrismaClaimWhereInput = {
  id?: string | { in: string[] };
  userId?: string;
  status?: { in: string[] };
  insurancePlanId?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    claimNumber?: { contains: string; mode: 'insensitive' };
    insurancePlan?: { name: { contains: string; mode: 'insensitive' } };
  }>;
};

// Helper function to check if a value is a valid ClaimStatus
const isClaimStatus = (status: string): status is ClaimStatus => {
  return [
    'DRAFT', 'READY', 'SUBMITTED', 'ACCEPTED',
    'REJECTED', 'DENIED', 'PARTIALLY_PAID', 'PAID', 'APPEALED'
  ].includes(status);
};

// Error classes for claim-specific errors
export class ClaimNotFoundError extends NotFoundError {
  constructor() {
    super('Claim', 'specified');
    this.name = 'ClaimNotFoundError';
  }
}

export class ClaimNotDeletableError extends ClaimsError {
  constructor(status: ClaimStatus) {
    super(`Claim cannot be deleted in status: ${status}`, 'INVALID_STATUS', 400);
    this.name = 'ClaimNotDeletableError';
  }
}

export class ClaimAuthorizationError extends ClaimsError {
  constructor(message = 'Not authorized to access this claim') {
    super(message, 'UNAUTHORIZED', 403);
    this.name = 'ClaimAuthorizationError';
  }
}

export class ClaimNotEditableError extends ClaimsError {
  constructor() {
    super('Claim is not in an editable state', 'INVALID_STATUS', 400);
    this.name = 'ClaimNotEditableError';
  }
}

export class ClaimNotSubmittableError extends ClaimsError {
  constructor() {
    super('Claim cannot be submitted in its current state', 'INVALID_STATUS', 400);
    this.name = 'ClaimNotSubmittableError';
  }
}

class ClaimAlreadyExistsError extends ClaimsError {
  constructor(message = 'A similar claim already exists') {
    super(message, 'ALREADY_EXISTS', 400);
    this.name = 'ClaimAlreadyExistsError';
  }
}

class ClaimValidationError extends ClaimsError {
  constructor(message = 'Claim validation failed') {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ClaimValidationError';
  }
}

const CLAIM_NUMBER_PREFIX = 'CLM';
const CLAIM_NUMBER_LENGTH = 6;

export class ClaimsService {
  private prisma: PrismaClientWithExtensions;

  constructor(prisma?: PrismaClient) {
    this.prisma = (prisma || new PrismaClient()) as PrismaClientWithExtensions;
  }



  /**
   * Check if a claim is in an editable state
   */
  private isClaimEditable(status: ClaimStatus): boolean {
    // Updated to use Prisma schema enum values
    const editableStatuses = ['DRAFT', 'REJECTED', 'READY'] as const;
    return editableStatuses.includes(status as any);
  }

  /**
   * Check if a claim can be submitted in its current state
   */
  private isClaimSubmittable(status: ClaimStatus): boolean {
    // Updated to use Prisma schema enum values
    const submittableStatuses = ['DRAFT', 'REJECTED', 'READY'] as const;
    return submittableStatuses.includes(status as any);
  }

  /**
   * Check if a claim can be deleted in its current state
   */
  private isClaimDeletable(status: ClaimStatus): boolean {
    // Updated to use valid Prisma schema enum values only
    const deletableStatuses = ['DRAFT', 'REJECTED', 'READY'] as const;
    return deletableStatuses.includes(status as any);
  }

  private async generateClaimNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    // Get the latest claim number for today
    const latestClaim = await this.prisma.claim.findFirst({
      where: {
        claimNumber: {
          startsWith: `CLM${dateStr}`
        }
      },
      orderBy: {
        claimNumber: 'desc' as const
      },
      select: {
        claimNumber: true
      }
    });

    let sequence = 1;
    if (latestClaim?.claimNumber) {
      const lastSequence = parseInt(latestClaim.claimNumber.slice(-4), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `CLM${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  private async validateClaimInput(input: CreateClaimInput): Promise<void> {
    // Validate required fields
    if (!input.userId) {
      throw new ClaimValidationError('User ID is required');
    }

    if (!input.insurancePlanId) {
      throw new ClaimValidationError('Insurance plan ID is required');
    }

    // Validate claim lines
    if (!input.claimLines || input.claimLines.length === 0) {
      throw new ClaimValidationError('At least one claim line is required');
    }

    // Validate claim line amounts and fields
    for (const line of input.claimLines) {
      if (!line.cptCode || line.cptCode.trim() === '') {
        throw new ClaimValidationError('Invalid CPT code');
      }
      if (line.charge <= 0) {
        throw new ClaimValidationError('Charge amount must be greater than 0');
      }
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (line.serviceDate < oneYearAgo) {
        throw new ClaimValidationError('Service date cannot be more than 1 year old');
      }
    }
  }

  /**
   * Create a new claim with line items
   */
  async createClaim(input: CreateClaimInput): Promise<ClaimWithRelations> {
    await this.validateClaimInput(input);
    const claimNumber = await this.generateClaimNumber();
    const totalCharge = input.claimLines.reduce(
      (sum: number, line: CreateClaimLineInput) => sum + line.charge * (line.units || 1),
      0
    );

    return (this.prisma as any).$transaction(async (prisma: any) => {
      // Create the claim
      const claim = await prisma.claim.create({
        data: {
          userId: input.userId,
          reportId: input.reportId,
          insurancePlanId: input.insurancePlanId,
          claimNumber,
          status: 'DRAFT',
          totalCharge,
          submissionDate: input.submissionDate || null,
        },
      });

      // Create claim lines
      const claimLines = await Promise.all(
        input.claimLines.map((line, index) =>
          prisma.claimLine.create({
            data: {
              claimId: claim.id,
              lineNumber: line.lineNumber || index + 1,
              cptCode: line.cptCode,
              description: line.description,
              icd10Codes: line.icd10Codes,
              charge: line.charge,
              units: line.units || 1,
              modifier: line.modifier,
              serviceDate: line.serviceDate,
              serviceFacilityName: line.serviceFacilityName,
              serviceFacilityNpi: line.serviceFacilityNpi,
              renderingProviderNpi: line.renderingProviderNpi,
              referringProviderNpi: line.referringProviderNpi,
            },
          })
        )
      );

      // Create initial claim event
      await prisma.claimEvent.create({
        data: {
          claimId: claim.id,
          eventType: 'CLAIM_CREATED',
          eventData: { status: 'DRAFT' },
        },
      });

      // Return the created claim with relations
      return this.getClaimById(claim.id, input.userId);
    });
  }

  /**
   * Get a claim by ID with all relations
   */
  async getClaimById(id: string, userId: string): Promise<ClaimWithRelations> {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        insurancePlan: true,
        claimLines: true,
        claimEvents: {
          orderBy: { createdAt: 'desc' } as const,
          take: 10, // Limit number of events to prevent over-fetching
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!claim) {
      throw new ClaimNotFoundError();
    }

    if (claim.userId !== userId) {
      throw new ClaimAuthorizationError();
    }

    return claim as unknown as ClaimWithRelations;
  }

  /**
   * Update a claim
   */
  async updateClaim(
    id: string,
    input: UpdateClaimInput & {
      userId: string;
      insurancePlanId?: string;
      reportId?: string | null;
      totalCharge?: number;
      submissionDate?: Date | null;
    }
  ): Promise<ClaimWithRelations> {
    // Get existing claim
    const existingClaim = await this.getClaimById(id, input.userId);

    // Check if claim is in an editable state
    if (!this.isClaimEditable(existingClaim.status)) {
      throw new ClaimNotEditableError();
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      insurancePlanId: input.insurancePlanId,
      reportId: input.reportId,
      status: input.status,
      totalCharge: input.totalCharge,
      allowedAmount: input.allowedAmount,
      paidAmount: input.paidAmount,
      patientResponsibility: input.patientResponsibility,
      denialReason: input.denialReason,
      submissionDate: input.submissionDate,
      processedDate: input.processedDate,
      ediFileLocation: input.ediFileLocation,
      clearinghouseId: input.clearinghouseId,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update claim
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        insurancePlan: true,
        claimLines: true,
        claimEvents: {
          orderBy: { createdAt: 'desc' } as const,
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log update event
    await this.addClaimEvent(id, {
      eventType: 'CLAIM_UPDATED',
      eventData: {
        updatedFields: Object.keys(input),
        userId: input.userId,
      },
      notes: 'Claim details updated',
      userId: input.userId,
    });

    return updatedClaim as unknown as ClaimWithRelations;
  }

  /**
   * Submit a claim
   */
  async submitClaim(claimId: string, userId: string): Promise<ClaimWithRelations> {
    const claim = await this.getClaimById(claimId, userId);

    if (!this.isClaimSubmittable(claim.status)) {
      throw new ClaimNotSubmittableError();
    }

    await this.addClaimEvent(claimId, {
      eventType: 'CLAIM_SUBMITTED',
      eventData: { status: 'SUBMITTED' },
      notes: 'Claim submitted for processing',
      userId,
    });

    return this.updateClaim(claimId, {
      status: 'SUBMITTED',
      submissionDate: new Date(),
      userId, // Include userId in the update data
    });
  }

  /**
   * Find claims with filtering and pagination
   */
  async getClaimsByUserId(
    userId: string,
    filter: ClaimsFilter = {},
    options: ClaimsPaginationOptions = { page: 1, pageSize: 10 }
  ): Promise<ClaimsResult> {
    const { page = 1, pageSize = 10, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const skip = (page - 1) * pageSize;

    const where: PrismaClaimWhereInput = { userId };

    if (filter.status) {
      where.status = { in: Array.isArray(filter.status) ? filter.status : [filter.status] };
    }

    if (filter.insurancePlanId) {
      where.insurancePlanId = filter.insurancePlanId;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    if (filter.searchTerm) {
      where.OR = [
        { claimNumber: { contains: filter.searchTerm, mode: 'insensitive' } },
        { insurancePlan: { name: { contains: filter.searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, claims] = await Promise.all([
      this.prisma.claim.count({ where }),
      this.prisma.claim.findMany({
        where,
        include: {
          insurancePlan: true,
          claimLines: true,
          claimEvents: {
            orderBy: { createdAt: 'desc' } as const,
            take: 1
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDirection } as const,
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: claims as unknown as ClaimWithRelations[],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Add an event to a claim
   */
  async addClaimEvent(claimId: string, eventData: ClaimEventData & { userId: string }): Promise<ClaimEvent> {
    const claim = await this.getClaimById(claimId, eventData.userId);

    // Extract status from eventData if it exists
    const status = eventData.eventData && typeof eventData.eventData === 'object' && 'status' in eventData.eventData
      ? eventData.eventData.status as ClaimStatus
      : null;

    // Validate status transition if status is being updated
    if (status) {
      if (!this.isValidStatusTransition(claim.status, status)) {
        throw new Error(`Invalid status transition from ${claim.status} to ${status}`);
      }
    }

    // Create the event with proper typing
    const event = await this.prisma.claimEvent.create({
      data: {
        claimId,
        eventType: eventData.eventType,
        eventData: status ? { status } : {},
        notes: eventData.notes || null,
        createdAt: new Date()
      },
    });

    // If status changed, update the claim status
    if (status) {
      await this.prisma.claim.update({
        where: { id: claimId },
        data: {
          status,
          updatedAt: new Date()
        },
      });
    }

    return event as unknown as ClaimEvent;
  }

  /**
   * Delete a claim (soft delete by marking as CANCELLED)
   */
  async deleteClaim(id: string, userId: string): Promise<ClaimWithRelations> {
    const claim = await this.getClaimById(id, userId);

    if (!this.isClaimDeletable(claim.status)) {
      throw new ClaimNotDeletableError(claim.status);
    }

    await this.addClaimEvent(id, {
      eventType: 'CLAIM_CANCELLED',
      eventData: { status: 'CANCELLED' },
      notes: 'Claim cancelled by user',
      userId,
    });

    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
      include: {
        insurancePlan: true,
        claimLines: true,
        claimEvents: {
          orderBy: { createdAt: 'desc' } as const,
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedClaim as unknown as ClaimWithRelations;
  }

  /**
   * Check if a status transition is valid
   */
  private isValidStatusTransition(fromStatus: ClaimStatus, toStatus: ClaimStatus): boolean {
    type StatusMap = Partial<Record<ClaimStatus, ClaimStatus[]>>;

    // Updated to match Prisma schema ClaimStatus enum values
    const validTransitions: StatusMap = {
      'DRAFT': ['READY', 'SUBMITTED'],
      'READY': ['DRAFT', 'SUBMITTED'],
      'SUBMITTED': ['ACCEPTED', 'REJECTED'],
      'ACCEPTED': ['PAID', 'PARTIALLY_PAID', 'DENIED'],
      'REJECTED': ['DRAFT', 'READY'],
      'DENIED': ['APPEALED'],
      'PARTIALLY_PAID': ['PAID', 'APPEALED'],
      'PAID': [],
      'APPEALED': ['PAID', 'DENIED']
    };

    const allowedTransitions = validTransitions[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }
}
