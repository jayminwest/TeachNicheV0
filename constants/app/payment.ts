/**
 * Payment-related Constants
 * 
 * This file defines constants specific to payment processing,
 * including Stripe configurations, fee structures, and currency formats.
 */

/**
 * Stripe API version
 */
export const STRIPE_API_VERSION = '2025-03-31.basil';

/**
 * Platform fee percentage charged on transactions
 */
export const PLATFORM_FEE_PERCENTAGE = 15;

/**
 * Percentage of the transaction that goes to the instructor
 */
export const INSTRUCTOR_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE;

/**
 * Standard Stripe processing fee (approximation)
 * Note: Actual fees may vary by country, payment method, etc.
 */
export const STRIPE_PROCESSING_FEE = {
  PERCENTAGE: 2.9,
  FIXED_AMOUNT: 0.30,
};

/**
 * Supported currencies
 */
export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
  JPY = 'jpy',
}

/**
 * Currency display information
 */
export const CurrencyDisplay = {
  [Currency.USD]: {
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  [Currency.EUR]: {
    symbol: '€',
    name: 'Euro',
    decimals: 2,
  },
  [Currency.GBP]: {
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
  },
  [Currency.CAD]: {
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
  },
  [Currency.AUD]: {
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
  },
  [Currency.JPY]: {
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
  },
};

/**
 * Default currency for the platform
 */
export const DEFAULT_CURRENCY = Currency.USD;

/**
 * Minimum amount that can be charged (in the smallest currency unit, e.g., cents)
 */
export const MINIMUM_CHARGE_AMOUNT = 50; // $0.50

/**
 * Payment methods to enable in Stripe Checkout
 */
export const PAYMENT_METHODS = ['card'];
