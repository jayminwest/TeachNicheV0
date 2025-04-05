/**
 * UI formatting utilities
 * 
 * Functions for formatting UI elements, class names, and styles.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges CSS class names using clsx and tailwind-merge
 * 
 * This utility helps manage conditional classes and prevents 
 * conflicting Tailwind CSS classes from being applied.
 * 
 * @param inputs - Array of class name values (strings, objects, arrays)
 * @returns Merged class name string
 * 
 * @example
 * // Basic usage
 * const className = cn("text-red-500", "bg-blue-200");
 * 
 * // With conditionals
 * const className = cn(
 *   "base-class",
 *   isActive && "active-class",
 *   isMobile ? "mobile-class" : "desktop-class"
 * );
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
