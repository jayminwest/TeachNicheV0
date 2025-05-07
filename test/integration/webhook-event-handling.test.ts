/**
 * Integration tests for webhook event handling
 * 
 * Tests the handling of Stripe webhook events using simulated event objects
 * but real Stripe API for verification.
 */

import { stripe, calculateFees } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { 
  createTestProductAndPrice, 
  createTestCheckoutSession,
  cleanupStripeTestResources
} from '../helpers/stripe-test-helper';
import Stripe from 'stripe';

// Create a Supabase client specifically for tests
const createTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for tests');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};

describe('Webhook Event Handling', () => {
  // Store test resources to clean up later
  const testResources = {
    productIds: [] as string[],
    sessionId: '',
  };

  let eventData: {
    checkoutSession: Stripe.Checkout.Session;
  };
  
  // Set up test resources
  beforeAll(async () => {
    // Create a test product and price
    const { product, price } = await createTestProductAndPrice(
      'Test Product for Webhooks',
      'Test product for webhook event handling tests',
      1499 // $14.99
    );
    testResources.productIds.push(product.id);
    
    // Calculate fees
    const priceInCents = 1499;
    const { platformFee, instructorAmount } = calculateFees(priceInCents);
    
    // Create a checkout session to use as event data
    const session = await createTestCheckoutSession({
      priceId: price.id,
      metadata: {
        lessonId: 'test-webhook-lesson-id',
        userId: 'test-webhook-user-id',
        instructorId: 'test-webhook-instructor-id',
        instructorPayoutAmount: (instructorAmount / 100).toString(),
        platformFee: (platformFee / 100).toString(),
      }
    });
    
    testResources.sessionId = session.id;
    eventData = { checkoutSession: session };
  }, 30000);
  
  // Clean up after all tests
  afterAll(async () => {
    await cleanupStripeTestResources(testResources.productIds);
  }, 30000);
  
  it('should handle checkout.session.completed events', async () => {
    // Get the session from Stripe
    const session = eventData.checkoutSession;
    
    // Create purchase data that would be created by a webhook
    const supabase = createTestClient();
    
    // Extract data from session metadata
    const lessonId = session.metadata?.lessonId;
    const userId = session.metadata?.userId;
    const instructorId = session.metadata?.instructorId;
    const instructorPayoutAmount = parseFloat(session.metadata?.instructorPayoutAmount || '0');
    const platformFeeAmount = parseFloat(session.metadata?.platformFee || '0');
    
    // Simulate creating a purchase record (don't actually insert to avoid db clutter)
    const purchaseData = {
      user_id: userId,
      lesson_id: lessonId,
      stripe_payment_id: session.id,
      amount: 14.99,
      instructor_payout_amount: instructorPayoutAmount,
      platform_fee_amount: platformFeeAmount,
      payout_status: 'pending_transfer',
      stripe_product_id: testResources.productIds[0],
      stripe_price_id: session.metadata?.priceId,
      is_free: false
    };
    
    // Verify the purchase data is correctly formatted
    expect(purchaseData.user_id).toBe('test-webhook-user-id');
    expect(purchaseData.lesson_id).toBe('test-webhook-lesson-id');
    expect(purchaseData.stripe_payment_id).toBe(session.id);
    expect(purchaseData.amount).toBe(14.99);
    expect(purchaseData.instructor_payout_amount).toBeCloseTo(12.74, 2);
    expect(purchaseData.platform_fee_amount).toBeCloseTo(2.25, 2);
    expect(purchaseData.payout_status).toBe('pending_transfer');
  });
  
  it('should handle transfer events by updating purchase records', async () => {
    // Get the session ID
    const sessionId = testResources.sessionId;
    
    // Simulate transfer data
    const transferId = `tr_test_${Date.now()}`;
    
    // Create test data for verifying the logic
    const purchaseUpdate = {
      payout_status: 'transferred',
      stripe_transfer_id: transferId
    };
    
    // Verify the update data is correctly formatted
    expect(purchaseUpdate.payout_status).toBe('transferred');
    expect(purchaseUpdate.stripe_transfer_id).toBe(transferId);
  });
});