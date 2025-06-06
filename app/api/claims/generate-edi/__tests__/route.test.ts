// @ts-ignore
import { ReadableStream } from 'web-streams-polyfill/ponyfill';
// @ts-ignore
if (!globalThis.ReadableStream) globalThis.ReadableStream = ReadableStream;

import { Request, Response } from 'undici';
// @ts-ignore
if (!globalThis.Request) globalThis.Request = Request;
// @ts-ignore
if (!globalThis.Response) globalThis.Response = Response;
import { POST } from "../route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    claim: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}));

jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn()
}));

jest.mock("fs", () => ({
  existsSync: jest.fn()
}));

describe("EDI Generation API", () => {
  const mockSession = {
    user: {
      id: "test-user-1"
    }
  };

  const mockClaim = {
    id: "test-claim-1",
    userId: "test-user-1",
    claimNumber: "CLM-123456",
    status: "DRAFT",
    totalCharge: 1500.00,
    user: {
      id: "test-user-1",
      name: "John Doe",
      email: "john@example.com",
      password: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    insurancePlan: {
      id: "test-plan-1",
      payerName: "Test Insurance",
      payerId: "TEST001",
      memberId: "M123456",
      groupNumber: "G789",
      planType: "PPO",
      isPrimary: true,
      isActive: true,
      effectiveDate: new Date(),
      termDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    claimLines: [
      {
        id: "line-1",
        claimId: "test-claim-1",
        lineNumber: 1,
        cptCode: "80053",
        description: "Comprehensive metabolic panel",
        icd10Codes: ["Z00.00"],
        charge: 500.00,
        units: 1,
        modifier: null,
        serviceDate: new Date()
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
    (prisma.claim.update as jest.Mock).mockResolvedValue({ ...mockClaim, status: "READY" });
    (existsSync as jest.Mock).mockReturnValue(false);
  });

  it("should generate EDI file for valid claim", async () => {
    const request = { method: 'POST', json: async () => ({ claimId: 'test-claim-1' }) } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileName).toBe("CLM-123456.edi");
    expect(data.ediContent).toBeDefined();

    // Verify file operations
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "test-claim-1" },
      data: {
        ediFileLocation: "CLM-123456.edi",
        status: "READY"
      }
    });
  });

  it("should return 401 for unauthenticated request", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = { method: 'POST', json: async () => ({ claimId: 'test-claim-1' }) } as any;

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 404 for non-existent claim", async () => {
    (prisma.claim.findUnique as jest.Mock).mockResolvedValue(null);

    const request = { method: 'POST', json: async () => ({ claimId: 'non-existent' }) } as any;

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("should return 404 for claim owned by different user", async () => {
    (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
      ...mockClaim,
      userId: "different-user"
    });

    const request = { method: 'POST', json: async () => ({ claimId: 'test-claim-1' }) } as any;

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("should handle file system errors", async () => {
    (writeFile as jest.Mock).mockRejectedValue(new Error("File system error"));

    const request = { method: 'POST', json: async () => ({ claimId: 'test-claim-1' }) } as any;

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
}); 