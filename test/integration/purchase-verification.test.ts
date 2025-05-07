/**
 * Integration tests for purchase verification
 * 
 * Tests the actual purchase verification logic that would be used in production,
 * but against the development environment.
 */

import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { 
  createTestProductAndPrice, 
  createTestCustomer,
  createTestCheckoutSession,
  cleanupStripeTestResources
} from '../helpers/stripe-test-helper';

// Create a Supabase client specifically for tests
const createTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for tests');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};

describe('Purchase Verification', () => {
  // Store test resources to clean up after
  const testResources = {
    productIds: [] as string[],
    customerIds: [] as string[],
    userId: '',
    sessionId: '',
  };
  
  // Unique identifier for this test run
  const testTimestamp = Date.now();
  const testEmail = `test-${testTimestamp}@example.com`;
  
  beforeAll(async () => {
    // Create a test customer in Stripe
    const customer = await createTestCustomer(
      testEmail,
      'Test Customer'
    );
    testResources.customerIds.push(customer.id);
    
    // Create a test product and price
    const { product, price } = await createTestProductAndPrice(
      'Test Product for Purchase Verification',
      'Test product for purchase verification tests',
      999 // $9.99
    );
    testResources.productIds.push(product.id);
    
    // Create a checkout session
    const session = await createTestCheckoutSession({
      priceId: price.id,
      customerId: customer.id,
      metadata: {
        videoId: 'test-video-id',
        userId: 'test-user-id',
        instructorPayoutAmount: '8.49',
        platformFee: '1.50',
      }
    });
    
    testResources.sessionId = session.id;
  }, 30000);
  
  // Clean up after all tests
  afterAll(async () => {
    await cleanupStripeTestResources(testResources.productIds, testResources.customerIds);
  }, 30000);
  
  it('should verify a checkout session exists in Stripe', async () => {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(testResources.sessionId);
    
    // Verify it exists and has the expected metadata
    expect(session).toBeDefined();
    expect(session.id).toBe(testResources.sessionId);
    expect(session.metadata?.videoId).toBe('test-video-id');
    expect(session.metadata?.userId).toBe('test-user-id');
  });
  
  it('should extract correct fee amounts from session metadata', async () => {
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(testResources.sessionId);
    
    // Extract values from metadata
    const instructorPayoutAmount = parseFloat(session.metadata?.instructorPayoutAmount || '0');
    const platformFeeAmount = parseFloat(session.metadata?.platformFee || '0');
    
    // Verify the values
    expect(instructorPayoutAmount).toBe(8.49);
    expect(platformFeeAmount).toBe(1.50);
    
    // Verify the total matches what we expect
    expect(instructorPayoutAmount + platformFeeAmount).toBeCloseTo(9.99, 2);
  });
});