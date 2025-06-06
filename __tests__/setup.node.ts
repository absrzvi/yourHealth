// Mock any Node.js specific globals here
import { TextEncoder, TextDecoder } from 'util';
import { afterEach } from '@jest/globals';

// Add TextEncoder and TextDecoder to global scope for Node.js
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock any other Node.js specific globals as needed
global.console = {
  ...console,
  // Override any console methods if needed
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Set up test environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.NEXT_PUBLIC_APP_ENV = 'test';

// Mock data store
const mockData = {
  users: new Map<string, any>(),
  claims: new Map<string, any>(),
  claimLines: new Map<string, any>(),
  claimEvents: new Map<string, any>(),
  insurancePlans: new Map<string, any>(),
  reports: new Map<string, any>(),
};

// Helper function to create mock Prisma methods
const mockPrismaMethods = () => ({
  // User model
  user: {
    upsert: jest.fn().mockImplementation(async ({ where, create, update }) => {
      const existingUser = Array.from(mockData.users.values()).find(
        u => u.email === where.email
      );
      
      if (existingUser) {
        const updatedUser = { ...existingUser, ...update };
        mockData.users.set(updatedUser.id, updatedUser);
        return updatedUser;
      } else {
        const newUser = { 
          ...create, 
          id: create.id || `user_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date() 
        };
        mockData.users.set(newUser.id, newUser);
        return newUser;
      }
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id) {
        return mockData.users.get(where.id) || null;
      }
      if (where.email) {
        return Array.from(mockData.users.values()).find(u => u.email === where.email) || null;
      }
      return null;
    }),
  },
  
  // Report model
  report: {
    create: jest.fn().mockImplementation(({ data }) => {
      const report = { 
        ...data, 
        id: data.id || `report_${Date.now()}`,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      mockData.reports.set(report.id, report);
      return report;
    }),
  },
  
  // InsurancePlan model
  insurancePlan: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      return mockData.insurancePlans.get(where.id) || null;
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      const plan = { 
        ...data, 
        id: data.id || `ins_${Date.now()}`,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      mockData.insurancePlans.set(plan.id, plan);
      return plan;
    }),
  },
  
  // Claim model
  claim: {
    findFirst: jest.fn().mockImplementation(({ where, orderBy }) => {
      let claims = Array.from(mockData.claims.values());
      
      if (where?.claimNumber?.startsWith) {
        claims = claims.filter(c => c.claimNumber?.startsWith(where.claimNumber.startsWith));
      }
      
      if (orderBy?.createdAt === 'desc') {
        claims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      
      return claims[0] || null;
    }),
    findUnique: jest.fn().mockImplementation(({ where, include }) => {
      const claim = mockData.claims.get(where.id);
      if (!claim) return null;
      
      const result = { ...claim };
      
      if (include?.claimLines) {
        result.claimLines = Array.from(mockData.claimLines.values())
          .filter(cl => cl.claimId === claim.id);
      }
      
      if (include?.claimEvents) {
        result.claimEvents = Array.from(mockData.claimEvents.values())
          .filter(ce => ce.claimId === claim.id);
      }
      
      if (include?.insurancePlan && claim.insurancePlanId) {
        result.insurancePlan = mockData.insurancePlans.get(claim.insurancePlanId);
      }
      
      if (include?.user && claim.userId) {
        result.user = mockData.users.get(claim.userId);
      }
      
      return result;
    }),
    create: jest.fn().mockImplementation(({ data, include }) => {
      const claim = {
        ...data,
        id: data.id || `claim_${Date.now()}`,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockData.claims.set(claim.id, claim);
      
      // Create claim lines if provided
      if (data.claimLines?.createMany?.data) {
        data.claimLines.createMany.data.forEach((lineData: any, index: number) => {
          const lineId = `claim_line_${Date.now()}_${index}`;
          const claimLine = {
            ...lineData,
            id: lineId,
            claimId: claim.id,
            lineNumber: index + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockData.claimLines.set(lineId, claimLine);
        });
      }
      
      // Create initial claim event
      const eventId = `event_${Date.now()}`;
      const claimEvent = {
        id: eventId,
        claimId: claim.id,
        eventType: 'CLAIM_CREATED',
        eventData: { status: 'DRAFT' },
        notes: 'Claim created',
        userId: data.userId,
        createdAt: new Date(),
      };
      mockData.claimEvents.set(eventId, claimEvent);
      
      // Prepare result with included relations if requested
      const result = { ...claim };
      if (include?.claimLines) {
        result.claimLines = Array.from(mockData.claimLines.values())
          .filter(cl => cl.claimId === claim.id);
      }
      if (include?.claimEvents) {
        result.claimEvents = Array.from(mockData.claimEvents.values())
          .filter(ce => ce.claimId === claim.id);
      }
      if (include?.insurancePlan && claim.insurancePlanId) {
        result.insurancePlan = mockData.insurancePlans.get(claim.insurancePlanId);
      }
      if (include?.user && claim.userId) {
        result.user = mockData.users.get(claim.userId);
      }
      
      return result;
    }),
    update: jest.fn().mockImplementation(({ where, data, include }) => {
      const claim = mockData.claims.get(where.id);
      if (!claim) return null;
      
      const updatedClaim = {
        ...claim,
        ...data,
        updatedAt: new Date(),
      };
      
      mockData.claims.set(claim.id, updatedClaim);
      
      // Prepare result with included relations if requested
      const result = { ...updatedClaim };
      if (include?.claimLines) {
        result.claimLines = Array.from(mockData.claimLines.values())
          .filter(cl => cl.claimId === claim.id);
      }
      if (include?.claimEvents) {
        result.claimEvents = Array.from(mockData.claimEvents.values())
          .filter(ce => ce.claimId === claim.id);
      }
      if (include?.insurancePlan && updatedClaim.insurancePlanId) {
        result.insurancePlan = mockData.insurancePlans.get(updatedClaim.insurancePlanId);
      }
      if (include?.user && updatedClaim.userId) {
        result.user = mockData.users.get(updatedClaim.userId);
      }
      
      return result;
    }),
    findMany: jest.fn().mockImplementation(({ where, include, skip, take }) => {
      let claims = Array.from(mockData.claims.values());
      
      // Apply filters
      if (where?.userId) {
        claims = claims.filter(c => c.userId === where.userId);
      }
      
      if (where?.status?.in) {
        claims = claims.filter(c => where.status.in.includes(c.status));
      }
      
      if (where?.insurancePlanId) {
        claims = claims.filter(c => c.insurancePlanId === where.insurancePlanId);
      }
      
      // Apply pagination
      const total = claims.length;
      if (skip !== undefined) {
        claims = claims.slice(skip);
      }
      if (take !== undefined) {
        claims = claims.slice(0, take);
      }
      
      // Include relations if requested
      if (include) {
        claims = claims.map(claim => {
          const result = { ...claim };
          
          if (include.claimLines) {
            result.claimLines = Array.from(mockData.claimLines.values())
              .filter(cl => cl.claimId === claim.id);
          }
          
          if (include.claimEvents) {
            result.claimEvents = Array.from(mockData.claimEvents.values())
              .filter(ce => ce.claimId === claim.id);
          }
          
          if (include.insurancePlan && claim.insurancePlanId) {
            result.insurancePlan = mockData.insurancePlans.get(claim.insurancePlanId);
          }
          
          if (include.user && claim.userId) {
            result.user = mockData.users.get(claim.userId);
          }
          
          return result;
        });
      }
      
      return claims;
    }),
    delete: jest.fn().mockImplementation(({ where }) => {
      const claim = mockData.claims.get(where.id);
      if (!claim) return null;
      
      mockData.claims.delete(where.id);
      
      // Also delete related claim lines and events
      Array.from(mockData.claimLines.entries())
        .filter(([_, cl]) => cl.claimId === where.id)
        .forEach(([id]) => mockData.claimLines.delete(id));
        
      Array.from(mockData.claimEvents.entries())
        .filter(([_, ce]) => ce.claimId === where.id)
        .forEach(([id]) => mockData.claimEvents.delete(id));
      
      return claim;
    }),
  },
  
  // ClaimLine model
  claimLine: {
    createMany: jest.fn().mockImplementation(({ data }) => {
      if (!Array.isArray(data)) {
        data = [data];
      }
      
      const createdLines = data.map((lineData, index) => {
        const lineId = `claim_line_${Date.now()}_${index}`;
        const claimLine = {
          ...lineData,
          id: lineId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockData.claimLines.set(lineId, claimLine);
        return claimLine;
      });
      
      return { count: createdLines.length };
    }),
  },
  
  // ClaimEvent model
  claimEvent: {
    deleteMany: jest.fn().mockImplementation(async ({ where }) => {
      const events = Array.from(mockData.claimEvents.values());
      let deletedCount = 0;
      
      if (where?.claimId) {
        const toDelete = events.filter((e: any) => e.claimId === where.claimId);
        toDelete.forEach((e: any) => mockData.claimEvents.delete(e.id));
        deletedCount = toDelete.length;
      } else if (where?.claim?.userId) {
        const userClaims = Array.from(mockData.claims.values())
          .filter((c: any) => c.userId === where.claim.userId)
          .map((c: any) => c.id);
          
        const toDelete = events.filter((e: any) => userClaims.includes(e.claimId));
        toDelete.forEach((e: any) => mockData.claimEvents.delete(e.id));
        deletedCount = toDelete.length;
      }
      
      return { count: deletedCount };
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      const eventId = `event_${Date.now()}`;
      const claimEvent = {
        ...data,
        id: eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockData.claimEvents.set(eventId, claimEvent);
      return claimEvent;
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      let events = Array.from(mockData.claimEvents.values());
      
      if (where?.claimId) {
        events = events.filter(e => e.claimId === where.claimId);
      }
      
      return events;
    }),
  },
});

// Function to clear all test data
const clearTestData = () => {
  mockData.users.clear();
  mockData.claims.clear();
  mockData.claimLines.clear();
  mockData.claimEvents.clear();
  mockData.insurancePlans.clear();
  mockData.reports.clear();
};

// Register cleanup
afterEach(() => {
  clearTestData();
  jest.clearAllMocks();
});

// Add global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit with a non-zero code to fail the test run
  // process.exit(1);
});
