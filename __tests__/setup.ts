import '@testing-library/jest-dom';
import { loadEnvConfig } from '@next/env';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Set up any global test environment configuration here
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Suppress specific console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React does not recognize the') ||
      args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('The code generator has')) // Suppress ts-jest warnings
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Set up global before/after hooks
beforeAll(() => {
  console.log('TEST ENVIRONMENT:', process.env.NODE_ENV);
  console.log('RUNNING IN TEST MODE');
});

afterAll(() => {
  console.log('ALL TESTS COMPLETED');
});
