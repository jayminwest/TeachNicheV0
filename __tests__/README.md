# TeachNiche Testing Infrastructure

This directory contains the testing infrastructure for the TeachNiche platform, focusing on the Stripe and Supabase integration tests.

## Overview

The testing infrastructure is designed to test the integration between our application, Stripe, and Supabase. It includes test utilities, mock functions, and end-to-end integration tests for various flows such as instructor onboarding, Stripe Connect setup, lesson management, purchase processing, webhook handling, and edge cases.

## Structure

- `__tests__/setup.ts` - Global setup for tests, including environment variable loading and mocks
- `__tests__/utils/` - Utilities for testing
  - `stripe.ts` - Stripe testing utilities
  - `supabase.ts` - Supabase testing utilities
- `__tests__/integration/` - Integration tests
  - `instructor-onboarding.test.ts` - Tests for instructor onboarding flow
  - `stripe-connect-setup.test.ts` - Tests for Stripe Connect setup
  - `lesson-management.test.ts` - Tests for lesson creation and management
  - `purchase-flow.test.ts` - Tests for the purchase flow
  - `webhook-processing.test.ts` - Tests for webhook processing
  - `edge-cases.test.ts` - Tests for edge cases and error scenarios

## Prerequisites

1. Local development environment with Node.js (v18+)
2. Supabase project with local or development environment set up
3. Stripe account with test API keys
4. Properly configured `.env` file with test credentials

## Environment Variables

Ensure your `.env` file has the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_test_stripe_publishable_key
STRIPE_SECRET_KEY=your_test_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_test_stripe_webhook_secret

# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID=your_test_stripe_connect_client_id
STRIPE_PLATFORM_ACCOUNT_ID=your_test_stripe_platform_account_id
STRIPE_APPLICATION_FEE_PERCENT=15
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- instructor-onboarding.test.ts
```

## Test Utilities

### Stripe Utilities

The `__tests__/utils/stripe.ts` file contains utilities for interacting with the Stripe API during tests:

- `createTestCustomer()` - Creates a test customer
- `createTestProduct()` - Creates a test product
- `createTestPrice()` - Creates a test price
- `createTestConnectAccount()` - Creates a test Connect account
- `createTestCheckoutSession()` - Creates a test checkout session
- `createTestPaymentIntent()` - Creates a test payment intent
- `createTestTransfer()` - Creates a test transfer
- `createTestWebhookEvent()` - Creates a mock webhook event
- `cleanupStripeTestData()` - Cleans up Stripe test data

### Supabase Utilities

The `__tests__/utils/supabase.ts` file contains utilities for interacting with Supabase during tests:

- `createTestUser()` - Creates a test user
- `createTestInstructorProfile()` - Creates a test instructor profile
- `createTestLesson()` - Creates a test lesson
- `createTestVideo()` - Creates a test video
- `createTestPurchase()` - Creates a test purchase record
- `cleanupSupabaseTestData()` - Cleans up Supabase test data

## Important Notes

1. **Test Environment Only**: These tests should only be run in a development or test environment, never in production.
2. **Data Cleanup**: Tests are designed to clean up after themselves, but if a test fails, manual cleanup may be required.
3. **Stripe Test Mode**: Always use Stripe test mode API keys to avoid accidentally creating real charges.
4. **Logging**: Tests include detailed logging for debugging purposes. These logs can be used to trace test execution and identify issues.

## Debugging

For debugging test failures, check the following:

1. Test transaction logs which include transaction IDs and timestamps
2. Test data logs which include entity IDs and related information
3. Stripe Dashboard (test mode) to verify API calls
4. Supabase Dashboard to check database records

## Contributing

When adding new tests:

1. Follow the existing patterns and structure
2. Use the utility functions for creating test data
3. Include proper cleanup in afterAll/afterEach blocks
4. Add detailed logging for important test steps
5. Handle edge cases appropriately
