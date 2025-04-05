/**
 * Currency formatting utilities
 * 
 * Functions for formatting and calculating currency values consistently
 * throughout the application.
 */

/**
 * Formats a number as a USD price with dollar sign and decimal places
 * 
 * @param price - The price value to format
 * @returns Formatted price string (e.g., "$9.99")
 * 
 * @example
 * const displayPrice = formatPrice(9.99);
 * // Returns "$9.99"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Platform fee percentage to be applied on transactions
 */
export const PLATFORM_FEE_PERCENTAGE = 15;

/**
 * Percentage that goes to the instructor after platform fee
 */
export const INSTRUCTOR_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE;

/**
 * Calculates fee breakdown between platform and instructor
 * 
 * @param amount - The total transaction amount in cents
 * @returns Object containing platform fee and instructor amount in cents
 * 
 * @example
 * const { platformFee, instructorAmount } = calculateFees(1000);
 * // For a $10 transaction (1000 cents)
 * // Returns { platformFee: 150, instructorAmount: 850 }
 */
export function calculateFees(amount: number): {
  platformFee: number;
  instructorAmount: number;
} {
  const platformFee = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100);
  const instructorAmount = amount - platformFee;

  return {
    platformFee,
    instructorAmount,
  };
}
