/**
 * API error handling utilities
 * 
 * Functions for handling API errors, error responses, and error logging.
 */

import { NextResponse } from "next/server";

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Error codes for common error scenarios
 */
export enum ErrorCode {
  BAD_REQUEST = "bad_request",
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  INTERNAL_SERVER_ERROR = "internal_server_error",
  SERVICE_UNAVAILABLE = "service_unavailable",
  VALIDATION_ERROR = "validation_error",
  PAYMENT_ERROR = "payment_error",
}

/**
 * Creates a standardized error response for API endpoints
 * 
 * @param status - HTTP status code
 * @param message - Error message
 * @param code - Optional error code
 * @param details - Optional error details
 * @returns NextResponse with error information
 * 
 * @example
 * // Return a 404 error response
 * return createErrorResponse(
 *   404, 
 *   "Video not found", 
 *   ErrorCode.NOT_FOUND
 * );
 */
export function createErrorResponse(
  status: number,
  message: string,
  code?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Handles common API errors and returns appropriate responses
 * 
 * @param error - The error object to handle
 * @returns NextResponse with appropriate error information
 * 
 * @example
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleApiError(error);
 * }
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error("API Error:", error);
  
  // Handle known error types
  if (error instanceof Error) {
    // Handle Stripe errors
    if ('type' in (error as any) && (error as any).type?.startsWith('Stripe')) {
      return createErrorResponse(
        400,
        error.message || "Payment processing error",
        ErrorCode.PAYMENT_ERROR,
        { type: (error as any).type }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return createErrorResponse(
        400,
        error.message || "Validation failed",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    // Return generic error with the error message
    return createErrorResponse(
      500,
      error.message || "Internal server error",
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
  
  // Handle unknown errors
  return createErrorResponse(
    500,
    "An unexpected error occurred",
    ErrorCode.INTERNAL_SERVER_ERROR
  );
}

/**
 * Logs an error with consistent formatting
 * 
 * @param context - Context where the error occurred
 * @param error - The error object
 * @param additionalInfo - Optional additional information
 * 
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   logError("videoUpload", error, { userId, videoId });
 *   throw error;
 * }
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  console.error(
    `[ERROR][${context}]`,
    error instanceof Error ? { message: error.message, stack: error.stack } : error,
    additionalInfo || {}
  );
}
