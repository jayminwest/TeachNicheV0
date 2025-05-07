# Testing Guide for TeachNiche Platform

This guide explains how to run integration tests against the development environment, which test real Stripe and Supabase integrations without mocks.

## Testing Philosophy

Our testing approach prioritizes realistic tests over mocks:

1. **Real Services**: Tests run against real development services (Supabase, Stripe) for accurate verification
2. **Isolated Test Data**: Test utilities handle creating and cleaning up test data
3. **Clean Up On Finish**: Tests clean up after themselves, leaving no testing artifacts
4. **Environment Separation**: Tests only run against the development environment

## Prerequisites

Before running tests, make sure you have:

1. Set up the development environment properly (see `docs/environment-setup-guide.md`)
2. Configured your `.env.development` file with development API keys
3. Switched to the development environment using `pnpm use-dev-env`
4. Run `pnpm install` to install all dependencies including Jest

## Running Tests

The following test commands are available:

```bash
# Run all tests
pnpm test

# Run tests in watch mode (automatically reruns when files change)
pnpm test:watch

# Generate test coverage report
pnpm test:coverage
```

### Test Types

Our test suite includes the following types of tests:

1. **Utility Function Tests** (`stripe-fees.test.ts`)  
   Tests fee calculation logic without API calls.

2. **Purchase Verification Tests** (`purchase-verification.test.ts`)  
   Tests purchase record creation and access verification logic.

3. **Checkout Flow Tests** (`checkout-flow.test.ts`)  
   Tests the Stripe checkout process for lessons and videos.

4. **Webhook Handler Tests** (`stripe-webhook.test.ts`)  
   Tests handling of Stripe webhook events.

## Test Structure

Each test file follows this structure:

1. **Setup**: Creates necessary test data (users, products, etc.)
2. **Tests**: Runs actual test cases against the development environment
3. **Cleanup**: Removes all test data and resources

## Creating New Tests

When creating new tests:

1. Place them in the `/test` directory with a `.test.ts` extension
2. Use the existing utility functions in `/test/utils` for test data cleanup
3. Follow the pattern of creating isolated test data for each test suite
4. Ensure tests clean up after themselves using `afterAll` hooks

## Test Utilities

The `/test/utils` directory contains helper functions for:

- Creating test users
- Deleting test users and associated data
- Cleaning up Stripe test products
- Cleaning up purchase records

## Troubleshooting

### Common Issues

1. **Test timeouts**: Some Stripe operations may take longer than expected. If you see test timeouts, try increasing the timeout in the test file:
   ```typescript
   jest.setTimeout(60000); // Increase timeout to 60 seconds
   ```

2. **Supabase connection issues**: Make sure your development environment is properly set up:
   ```bash
   pnpm check-env
   ```

3. **Stripe API key issues**: Verify your Stripe test API keys are correctly set in `.env.development`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Database Cleanup

If tests fail to clean up properly, you can manually clean up test data:

1. Check the Supabase database for records with test emails (usually containing the timestamp)
2. Delete test products in the Stripe dashboard (search for "Test" in products)

## Testing Guidelines

1. **Focus on critical paths**: Prioritize tests for payment flows, user access, and security features
2. **Use real data**: Avoid mocks when testing integrations with external services
3. **Clean up data**: Always clean up test data, even if tests fail
4. **Keep tests isolated**: Test files should be able to run independently
5. **Test failure cases**: Include tests for error handling and edge cases