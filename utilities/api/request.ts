/**
 * API request utilities
 * 
 * Functions for handling API requests, parsing parameters, and creating responses.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Parses JSON from a request body with error handling
 * 
 * @param request - The Next.js request object
 * @returns Parsed JSON data or null if parsing failed
 * 
 * @example
 * const data = await parseRequestBody(request);
 * if (!data) {
 *   return createErrorResponse(400, "Invalid request body");
 * }
 */
export async function parseRequestBody<T = unknown>(
  request: Request | NextRequest
): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch (error) {
    console.error("Error parsing request body:", error);
    return null;
  }
}

/**
 * Creates a standardized success response for API endpoints
 * 
 * @param data - The data to include in the response
 * @param status - HTTP status code (defaults to 200)
 * @returns NextResponse with the data
 * 
 * @example
 * return createSuccessResponse({ videoUrl, title });
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Gets a parameter from the URL search params
 * 
 * @param request - The Next.js request object
 * @param paramName - The name of the parameter to get
 * @returns The parameter value or null if not found
 * 
 * @example
 * const videoId = getQueryParam(request, 'videoId');
 * if (!videoId) {
 *   return createErrorResponse(400, "Missing videoId parameter");
 * }
 */
export function getQueryParam(
  request: NextRequest,
  paramName: string
): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(paramName);
}

/**
 * Gets headers with standardized format for API responses
 * 
 * @param options - Additional header options
 * @returns Headers object with standard headers 
 * 
 * @example
 * return NextResponse.json(data, { 
 *   status: 200,
 *   headers: getStandardHeaders({ 'Cache-Control': 'max-age=60' })
 * });
 */
export function getStandardHeaders(
  options: Record<string, string> = {}
): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    ...options
  };
}
