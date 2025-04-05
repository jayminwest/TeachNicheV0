/**
 * API Constants Entry Point
 * 
 * This file serves as the barrel file for API-related constants
 * to provide a clean import interface.
 */

export * from './http-status';
export * from './endpoints';
// Re-export payment methods from app constants for API usage
export { PAYMENT_METHODS } from '../app/payment';

/**
 * Common API response messages
 */
export const ApiMessages = {
  SUCCESS: 'Operation completed successfully',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  MISSING_PARAMETERS: 'Missing required parameters',
  
  // Auth specific messages
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_CREATED: 'Account created successfully',
    ACCOUNT_EXISTS: 'An account with this email already exists',
    PASSWORD_RESET_SENT: 'Password reset instructions sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  },
  
  // Payment specific messages
  PAYMENT: {
    PURCHASE_SUCCESS: 'Purchase completed successfully',
    ALREADY_PURCHASED: 'You have already purchased this item',
    PAYMENT_FAILED: 'Payment processing failed',
    INSTRUCTOR_ACCOUNT_MISSING: 'Instructor payment account not set up',
    INSTRUCTOR_ACCOUNT_DISABLED: 'Instructor payment account is not fully enabled',
    INCOMPLETE_SETUP: 'Payment setup is incomplete',
  },
};

/**
 * Standard set of HTTP headers
 */
export const ApiHeaders = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
};
