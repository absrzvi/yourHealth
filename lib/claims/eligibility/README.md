# Eligibility Verification Service

A modular and extensible service for verifying insurance eligibility in the For Your Health MVP application.

## Features

- **Multi-payer Support**: Easily add support for different insurance payers
- **Caching**: Built-in support for in-memory and Redis caching
- **Validation**: Comprehensive validation of insurance plans
- **Parsing**: Flexible parsing of eligibility responses from different payers
- **Real-time Checking**: Support for real-time eligibility verification
- **Type-safe**: Built with TypeScript for better developer experience

## Installation

```bash
npm install @prisma/client redis
```

## Usage

### Basic Setup

```typescript
import { PrismaClient } from '@prisma/client';
import { 
  EligibilityChecker, 
  DefaultEligibilityParser, 
  DefaultEligibilityValidator,
  CacheFactory
} from './lib/claims/eligibility';

// Initialize Prisma client
const prisma = new PrismaClient();

// Create an instance of the eligibility checker
const eligibilityChecker = new EligibilityChecker({
  prisma,
  cacheType: 'memory', // or 'redis' for Redis cache
  defaultCacheTtl: 3600, // 1 hour
});

// Register the default parser and validator
eligibilityChecker.registerParser(new DefaultEligibilityParser());
eligibilityChecker.registerValidator('payer-id', new DefaultEligibilityValidator());

// Configure a payer
eligibilityChecker.configurePayer({
  id: 'payer-id',
  name: 'Payer Name',
  supportsRealtime: true,
  defaultResponseTime: 1000,
});
```

### Checking Eligibility

```typescript
// Basic eligibility check
const result = await eligibilityChecker.checkEligibility('member-123');

// With service details
const serviceOptions = {
  serviceDate: new Date('2024-06-15'),
  serviceType: 'LAB',
  serviceCode: '80053',
  providerNpi: '1234567890',
};

const serviceResult = await eligibilityChecker.checkEligibility('member-123', serviceOptions);

// Force refresh the cache
const freshResult = await eligibilityChecker.checkEligibility('member-123', {
  ...serviceOptions,
  forceRefresh: true,
});

// Clear cache for a member
await eligibilityChecker.clearCache('member-123');
```

## API Reference

### `EligibilityChecker`

Main class for checking eligibility.

#### Constructor

```typescript
constructor(options: {
  prisma: PrismaClient;
  cacheType: 'memory' | 'redis';
  defaultCacheTtl?: number;
  redisOptions?: RedisClientOptions;
})
```

#### Methods

- `checkEligibility(memberId: string, options?: CheckEligibilityOptions): Promise<EligibilityResult>`
  - Check eligibility for a member
  
- `clearCache(memberId: string): Promise<void>`
  - Clear the cache for a member
  
- `registerParser(parser: IEligibilityParser): void`
  - Register a parser for a specific payer
  
- `registerValidator(payerId: string, validator: IEligibilityValidator): void`
  - Register a validator for a specific payer
  
- `configurePayer(config: PayerConfig): void`
  - Configure a payer

### `DefaultEligibilityParser`

Default implementation of `IEligibilityParser` that can be extended for specific payers.

### `DefaultEligibilityValidator`

Default implementation of `IEligibilityValidator` that validates insurance plans.

## Extending the Service

### Adding a Custom Parser

```typescript
import { BaseEligibilityParser } from './parsers/base.parser';

export class CustomPayerParser extends BaseEligibilityParser {
  canParse(response: unknown): boolean {
    // Return true if this parser can handle the response
    return response?.source === 'custom-payer';
  }

  async parse(response: unknown, plan: InsurancePlan): Promise<EligibilityResult> {
    // Parse the response and return an EligibilityResult
    return {
      isEligible: true,
      effectiveDate: new Date(),
      // ... other fields
    };
  }
}

// Register the custom parser
eligibilityChecker.registerParser(new CustomPayerParser());
```

### Adding a Custom Validator

```typescript
import { BaseEligibilityValidator } from './validators/base.validator';

export class CustomPayerValidator extends BaseEligibilityValidator {
  constructor() {
    super();
    this.initializeRules();
  }

  private initializeRules(): void {
    this.addRule({
      id: 'CUSTOM_RULE',
      description: 'Custom validation rule',
      validate: async (plan: InsurancePlan) => {
        // Add custom validation logic
        return true; // or false if validation fails
      },
    });
  }
}

// Register the custom validator
eligibilityChecker.registerValidator('custom-payer', new CustomPayerValidator());
```

## Testing

Run the tests with:

```bash
npm test
```

## License

MIT
