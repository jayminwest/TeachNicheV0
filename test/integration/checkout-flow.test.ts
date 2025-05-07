/**
 * Integration tests for checkout flow
 * 
 * Tests the checkout process using real Stripe API calls against the development environment
 */

import { stripe, calculateFees, calculatePriceWithStripeFees } from '@/lib/stripe';
import { 
  createTestProductAndPrice, 
  createTestCustomer,
  createTestCheckoutSession,
  cleanupStripeTestResources
} from '../helpers/stripe-test-helper';

describe('Checkout Flow', () => {
  // Store test resources to clean up later
  const testResources = {
    productIds: [] as string[],
    customerIds: [] as string[],
    sessionIds: [] as string[],
  };
  
  // Clean up after all tests
  afterAll(async () => {
    await cleanupStripeTestResources(testResources.productIds, testResources.customerIds);
  }, 30000);
  
  it('should create a checkout session with correct metadata', async () => {
    // Create a test product and price
    const { product, price } = await createTestProductAndPrice(
      'Test Product for Checkout',
      'Test product for checkout flow tests',
      1999 // $19.99
    );
    testResources.productIds.push(product.id);
    
    // Create a test customer
    const customer = await createTestCustomer(
      `customer-${Date.now()}@example.com`,
      'Test Checkout Customer'
    );
    testResources.customerIds.push(customer.id);
    
    // Calculate price with fees and payout amounts
    const priceInCents = 1999;
    const priceWithFees = calculatePriceWithStripeFees(priceInCents);
    const { platformFee, instructorAmount } = calculateFees(priceWithFees);
    
    // Create a checkout session
    const session = await createTestCheckoutSession({
      priceId: price.id,
      customerId: customer.id,
      metadata: {
        lessonId: 'test-lesson-id',
        userId: 'test-user-id',
        instructorId: 'test-instructor-id',
        instructorPayoutAmount: (instructorAmount / 100).toString(),
        platformFee: (platformFee / 100).toString(),
        originalPrice: (priceInCents / 100).toString(),
      }
    });
    
    testResources.sessionIds.push(session.id);
    
    // Verify the session was created correctly
    expect(session).toBeDefined();
    expect(session.id).toBeTruthy();
    expect(session.payment_status).toBe('unpaid');
    
    // Verify the metadata
    expect(session.metadata?.lessonId).toBe('test-lesson-id');
    expect(session.metadata?.userId).toBe('test-user-id');
    expect(session.metadata?.instructorId).toBe('test-instructor-id');
    
    // Verify the instructor payout amount is correct
    const metadataInstructorAmount = parseFloat(session.metadata?.instructorPayoutAmount || '0');
    expect(metadataInstructorAmount).toBeCloseTo(instructorAmount / 100, 2);
    
    // Verify the platform fee is correct
    const metadataPlatformFee = parseFloat(session.metadata?.platformFee || '0');
    expect(metadataPlatformFee).toBeCloseTo(platformFee / 100, 2);
  });
  
  it('should calculate prices with fees correctly', async () => {
    // Test a range of base prices
    const testPrices = [
      500,   // $5
      1000,  // $10
      1500,  // $15
      2000,  // $20
    ];
    
    for (const basePrice of testPrices) {
      // Calculate price with fees
      const priceWithFees = calculatePriceWithStripeFees(basePrice);
      const { platformFee, instructorAmount } = calculateFees(priceWithFees);
      
      // Verify calculation outcomes
      expect(platformFee + instructorAmount).toBe(priceWithFees);
      
      // Create a test product and price with this base price
      const { product, price } = await createTestProductAndPrice(
        `Test Product ${basePrice/100}`,
        `Test product for $${basePrice/100}`,
        basePrice
      );
      testResources.productIds.push(product.id);
      
      // Create a checkout session
      const session = await createTestCheckoutSession({
        priceId: price.id,
        metadata: {
          instructorPayoutAmount: (instructorAmount / 100).toString(),
          platformFee: (platformFee / 100).toString(),
          originalPrice: (basePrice / 100).toString(),
        }
      });
      
      testResources.sessionIds.push(session.id);
      
      // Verify the session was created with the correct price
      expect(price.unit_amount).toBe(basePrice);
    }
  });
});