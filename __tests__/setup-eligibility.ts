// Mock console methods to keep test output clean
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockInsurancePlan = {
    findFirst: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      insurancePlan: mockInsurancePlan,
      $on: jest.fn(),
    })),
    Prisma: {
      PrismaClientKnownRequestError: class {}
    },
    mockInsurancePlan, // Expose for test setup
  };
});

// Mock Redis client with proper error handling
jest.mock('redis', () => {
  interface MockRedisClient {
    connect: jest.Mock<Promise<void>, []>;
    get: jest.Mock<Promise<string | null>, [string]>;
    set: jest.Mock<Promise<'OK'>, [string, string, any?]>;
    del: jest.Mock<Promise<number>, [string]>;
    flushAll: jest.Mock<Promise<'OK'>, []>;
    on: jest.Mock<MockRedisClient, [string, () => void]>;
    isReady: boolean;
    data: Map<string, string>;
  }

  const mockRedis: MockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedis.data.get(key) || null);
    }),
    set: jest.fn().mockImplementation((key: string, value: string) => {
      mockRedis.data.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedis.data.delete(key) ? 1 : 0);
    }),
    flushAll: jest.fn().mockImplementation(() => {
      mockRedis.data.clear();
      return Promise.resolve('OK');
    }),
    on: jest.fn((event: string, callback: () => void) => {
      // Simulate successful connection
      if (event === 'connect' || event === 'ready') {
        process.nextTick(() => callback());
      }
      return mockRedis;
    }),
    isReady: true,
    data: new Map<string, string>(), // Internal storage for mock data
  };

  // Reset mock data before each test
  beforeEach(() => {
    mockRedis.data.clear();
    jest.clearAllMocks();
  });

  return {
    createClient: jest.fn(() => mockRedis),
    mockRedis, // Expose for test setup
  };
}, { virtual: true }); // Mark as virtual to avoid actual import
