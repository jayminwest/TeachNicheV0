# Integration Testing Guide

This guide explains our approach to real integration testing without mocks for TeachNiche.

## Testing Philosophy

Our testing strategy follows these principles:

1. **Real is better than fake**: Tests use real APIs and real data whenever possible
2. **Development environment is for testing**: All tests run against the development environment
3. **Clean up after yourself**: Tests create and clean up their own test resources
4. **Unit tests when needed**: For pure logic functions, unit tests are still appropriate

## Test Types

We have two main types of tests:

### 1. Unit Tests

Unit tests verify the correctness of pure logic functions like fee calculations:

- Located in `/test/*.test.ts`
- No external dependencies or mocks
- Fast execution time
- Run with `pnpm test:unit`

### 2. Integration Tests

Integration tests verify real API interactions:

- Located in `/test/integration/*.test.ts`
- Use real Stripe API (test mode) and real Supabase (development project)
- Create temporary test data and clean it up afterward
- Run with `pnpm test:integration`

## Setup Requirements

1. **Development Supabase Project**: Tests run against your development Supabase project
2. **Stripe Test API Keys**: Tests use Stripe's test environment for real API calls
3. **Environment Variables**: Tests read from `.env.development` for configuration

## Running Tests

```bash
# Run all tests
pnpm test

# Run just unit tests (fast)
pnpm test:unit

# Run integration tests (requires dev environment)
pnpm test:integration

# Run tests with coverage report
pnpm test:coverage
```

## Writing New Tests

### Unit Tests

Unit tests should test pure logic functions:

```typescript
import { calculateFees } from '@/lib/stripe';

describe('Fee Calculation', () => {
  it('should calculate fees correctly', () => {
    const { platformFee, instructorAmount } = calculateFees(1000);
    expect(platformFee + instructorAmount).toBe(1000);
  });
});
```

### Integration Tests

Integration tests should test actual API behavior:

```typescript
import { stripe } from '@/lib/stripe';
import { createTestProductAndPrice, cleanupStripeTestResources } from '../helpers/stripe-test-helper';

describe('Checkout Flow', () => {
  const testResources = { productIds: [] };
  
  afterAll(async () => {
    await cleanupStripeTestResources(testResources.productIds);
  });
  
  it('should create a checkout session', async () => {
    const { product, price } = await createTestProductAndPrice('Test Product', 'Test description', 1000);
    testResources.productIds.push(product.id);
    
    // Test with real API calls
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    
    expect(session).toBeDefined();
    expect(session.id).toBeTruthy();
  });
});
```

## Test Helpers

We provide helper functions in `/test/helpers/` to simplify working with third-party APIs:

- `stripe-test-helper.ts`: Helpers for creating and cleaning up Stripe test resources
- `supabase-test-helper.ts`: Helpers for working with the development Supabase instance

## Troubleshooting

### Common Issues

1. **Authentication errors**: Make sure your Stripe API key and Supabase credentials are correctly set in `.env.development`

2. **Test timeouts**: If you see timeouts, try increasing the timeout setting:
   ```typescript
   jest.setTimeout(30000); // 30 seconds
   ```

3. **Resource cleanup failures**: If tests fail to clean up resources, check the logs for error messages and manually delete test data if needed.

4. **Development environment issues**: Make sure you've run `pnpm use-dev-env` to use the development environment.

## Guidelines for Test Data

1. Use clear naming conventions for test data (e.g., "Test Product for Checkout Flow")
2. Include timestamps in test emails and IDs to prevent collisions
3. Add relevant metadata to easily identify test resources (e.g., `test: true`)
4. Clean up all created resources in the `afterAll` hook
5. Keep test timeouts reasonable (30 seconds is a good default)