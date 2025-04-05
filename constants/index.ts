/**
 * Constants Module Entry Point
 * 
 * This file serves as the main barrel file for constants across the application.
 * It re-exports all constants from subdirectories to provide a clean import interface.
 * 
 * Naming Convention:
 * - UPPER_CASE for simple constants (e.g., MAX_FILE_SIZE)
 * - PascalCase for enum-like objects (e.g., HttpStatusCode)
 */

// Re-export all constants from subdirectories
export * from './app';
export * from './ui';
export * from './api';
export * from './validation';
export * from './feature-flags';
export * from './analytics';
