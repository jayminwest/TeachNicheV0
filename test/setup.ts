/**
 * Jest setup file for integration tests that run against the development environment
 */
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
// This ensures we're always using the development environment for tests
config({ path: path.resolve(process.cwd(), '.env.development') });

// Set NODE_ENV to development for tests
// Use Object.defineProperty to avoid the readonly error
Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });

// Log environment setup
console.log('🧪 Test environment initialized');
console.log(`Using Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}`);
console.log(`Using Stripe in ${process.env.NODE_ENV} mode`);

// Global setup
beforeAll(() => {
  console.log('Starting test suite');
  // Add any global setup here (database connections, etc.)
});

// Global teardown
afterAll(() => {
  console.log('Test suite complete');
  // Add any global teardown here (closing connections, etc.)
});

// Increase timeout for all tests - helpful for API calls
jest.setTimeout(30000);