/**
 * Tests for Stripe fee calculation functions
 * 
 * These tests validate the fee calculation logic used for instructor payouts and platform fees.
 * Since these calculations don't rely on API calls, they don't need mocking.
 */

import { 
  calculateFees, 
  PLATFORM_FEE_PERCENTAGE, 
  INSTRUCTOR_PERCENTAGE,
  STRIPE_PERCENTAGE_FEE,
  STRIPE_FIXED_FEE_CENTS,
  calculatePriceWithStripeFees 
} from '@/lib/stripe';

describe('Stripe Fee Calculation', () => {
  // Test price points in cents (e.g., 1000 = $10.00)
  const testPrices = [
    500,   // $5
    1000,  // $10
    1500,  // $15
    2000,  // $20
    2500,  // $25
    5000,  // $50
    10000, // $100
  ];

  it('should have correct constants', () => {
    // Verify constants are as expected
    expect(PLATFORM_FEE_PERCENTAGE).toBe(15); // 15%
    expect(INSTRUCTOR_PERCENTAGE).toBe(85);   // 85%
    expect(STRIPE_PERCENTAGE_FEE).toBe(2.9);  // 2.9%
    expect(STRIPE_FIXED_FEE_CENTS).toBe(30);  // $0.30
  });

  it('should calculate price with Stripe fees correctly', () => {
    // For a $10 price:
    // (1000 + 30) / (1 - 0.029) ≈ 1030 / 0.971 ≈ 1061 cents ($10.61)
    const priceWithFees = calculatePriceWithStripeFees(1000);
    expect(priceWithFees).toBeCloseTo(1061, 0);
  });

  it('should calculate fee splits correctly for a range of prices', () => {
    for (const basePrice of testPrices) {
      // Calculate the price including fees that will be passed to Stripe
      const priceWithFees = calculatePriceWithStripeFees(basePrice);
      
      // Calculate the fee split
      const { platformFee, instructorAmount } = calculateFees(priceWithFees);

      // Calculate the total Stripe fee
      const stripeFee = Math.round(priceWithFees * STRIPE_PERCENTAGE_FEE / 100) + STRIPE_FIXED_FEE_CENTS;
      
      // Verify the sum of platformFee and instructorAmount equals the total amount minus Stripe fees
      expect(platformFee + instructorAmount).toBe(priceWithFees);
      
      // Calculate expected platform fee before Stripe costs
      const expectedBasePrice = Math.round(priceWithFees / (1 + STRIPE_PERCENTAGE_FEE / 100) - STRIPE_FIXED_FEE_CENTS);
      const expectedPlatformFeeBeforeStripeFees = Math.round(expectedBasePrice * PLATFORM_FEE_PERCENTAGE / 100);
      
      // Calculate platform's proportion and share of Stripe fees
      const platformProportion = expectedPlatformFeeBeforeStripeFees / expectedBasePrice;
      const platformShareOfStripeFee = Math.round(stripeFee * platformProportion);
      
      // Expected platform fee with Stripe costs
      const expectedPlatformFeeWithStripeCosts = expectedPlatformFeeBeforeStripeFees + platformShareOfStripeFee;
      
      // Allow for a 1 cent rounding error
      const difference = Math.abs(expectedPlatformFeeWithStripeCosts - platformFee);
      expect(difference).toBeLessThanOrEqual(1);
      
      // The instructor should get the remainder
      const expectedInstructorAmount = priceWithFees - expectedPlatformFeeWithStripeCosts;
      expect(Math.abs(expectedInstructorAmount - instructorAmount)).toBeLessThanOrEqual(1);
    }
  });

  it('should maintain correct fee proportions', () => {
    // For each test price, verify the instructor gets approximately 85% after all fees
    for (const basePrice of testPrices) {
      const priceWithFees = calculatePriceWithStripeFees(basePrice);
      const { platformFee, instructorAmount } = calculateFees(priceWithFees);
      
      // Convert to original base price equivalent
      const effectiveBasePriceForInstructor = Math.round(basePrice * INSTRUCTOR_PERCENTAGE / 100);
      
      // Allow for some variation due to rounding in calculations
      // Typically within 1-2% of expected amount
      const expectedRatio = effectiveBasePriceForInstructor / basePrice;
      const actualRatio = instructorAmount / priceWithFees;
      
      // Within 2% of expected proportion
      expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.02);
    }
  });
});