import { ClaimsProcessor } from './processor';
import { prisma } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  prisma: {
    report: {
      findUnique: jest.fn(),
    },
    claim: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('ClaimsProcessor', () => {
  let processor: ClaimsProcessor;

  beforeEach(() => {
    processor = new ClaimsProcessor();
    jest.clearAllMocks();
  });

  it('should create a claim from a report', async () => {
    const mockReport = { id: '1', user: { id: 'user1' } };
    const mockClaim = { id: 'claim1', claimLines: [] };

    (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
    (prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim);
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockClaim, {}]);

    const result = await processor.createClaimFromReport({
      reportId: '1',
      insurancePlanId: 'plan1',
      userId: 'user1',
    });

    expect(result).toEqual(mockClaim);
    expect(prisma.report.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { user: true },
    });
    expect(prisma.claim.create).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
}); 