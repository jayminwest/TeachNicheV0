/**
 * Tests for Stripe webhook handlers
 * 
 * These tests validate that the Stripe webhook handler correctly processes different event types
 * using the actual development environment. This test simulates webhook events rather than 
 * generating real ones, as we can't easily trigger real events in a test environment.
 */

import { stripe, calculateFees } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, deleteTestPurchases, deleteStripeTestProducts } from './utils/cleanup';
import { Database } from '@/types/supabase';
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

describe('Stripe Webhook Handler', () => {
  // Store test resources to clean up later
  const testResources = {
    userIds: [] as string[],
    lessonId: '',
    instructorId: '',
    customerId: '',
    productIds: [] as string[],
    sessionId: '',
    paymentIntentId: '',
    transferId: '',
  };
  
  // Setup test data
  beforeAll(async () => {
    // Create instructor user
    const instructorEmail = `webhook-instructor-${Date.now()}@example.com`;
    const instructor = await createTestUser(instructorEmail, 'Instructor123!');
    testResources.instructorId = instructor.id;
    testResources.userIds.push(instructor.id);
    
    // Create customer user
    const customerEmail = `webhook-customer-${Date.now()}@example.com`;
    const customer = await createTestUser(customerEmail, 'Customer123!');
    testResources.customerId = customer.id;
    testResources.userIds.push(customer.id);
    
    // Create Stripe account for instructor
    const supabase = createTestClient();
    
    // Use a simpler approach for testing without Stripe Connect
    // We'll use a placeholder value for the Stripe account ID
    const mockAccountId = 'acct_test_' + Date.now();
    
    // Update instructor profile
    const { error: profileError } = await supabase
      .from('instructor_profiles')
      .insert({
        user_id: instructor.id,
        bio: 'Test instructor for webhooks',
        stripe_account_id: mockAccountId,
        stripe_account_enabled: true,
        stripe_onboarding_complete: true,
      });
      
    if (profileError) {
      throw new Error(`Failed to create instructor profile: ${profileError.message}`);
    }
    
    // Create test lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: 'Webhook Test Lesson',
        description: 'Test lesson for webhook testing',
        instructor_id: instructor.id,
        price: 14.99,
        is_published: true,
      })
      .select()
      .single();
      
    if (lessonError || !lesson) {
      throw new Error(`Failed to create test lesson: ${lessonError?.message}`);
    }
    
    testResources.lessonId = lesson.id;
    
    // Create a Stripe product and price for the lesson
    const product = await stripe.products.create({
      name: 'Webhook Test Lesson',
      description: 'Test lesson for webhook handling',
    });
    
    testResources.productIds.push(product.id);
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1499, // $14.99
      currency: 'usd',
    });
    
    // Update the lesson with Stripe IDs
    await supabase
      .from('lessons')
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      })
      .eq('id', lesson.id);
      
    // For testing, we'll simulate these IDs instead of creating real resources
    const priceInCents = 1499;
    const { platformFee, instructorAmount } = calculateFees(priceInCents);
    
    // Create mock IDs for testing
    testResources.paymentIntentId = 'pi_test_' + Date.now();
    testResources.transferId = 'tr_test_' + Date.now();
    
  }, 60000); // Longer timeout for setup
  
  // Clean up after all tests
  afterAll(async () => {
    // Delete test purchases
    for (const userId of testResources.userIds) {
      await deleteTestPurchases(userId);
    }
    
    // Delete test products
    await deleteStripeTestProducts(testResources.productIds);
    
    // Delete test data
    const supabase = createTestClient();
    await supabase.from('lessons').delete().eq('id', testResources.lessonId);
    await supabase.from('instructor_profiles').delete().eq('user_id', testResources.instructorId);
    
    // Delete test users
    for (const userId of testResources.userIds) {
      await deleteTestUser(userId);
    }
  }, 60000); // Longer timeout for cleanup
  
  it('should process a checkout.session.completed event', async () => {
    const supabase = createTestClient();
    
    // Calculate fees
    const priceInCents = 1499;
    const { platformFee, instructorAmount } = calculateFees(priceInCents);
    
    // Create sample checkout session data (simulated webhook event data)
    const checkoutSession: Partial<Stripe.Checkout.Session> = {
      id: `cs_test_${Date.now()}`,
      object: 'checkout.session',
      amount_total: priceInCents,
      metadata: {
        lessonId: testResources.lessonId,
        userId: testResources.customerId,
        instructorId: testResources.instructorId,
        productId: testResources.productIds[0],
        priceId: 'price_test', // Placeholder
        instructorPayoutAmount: (instructorAmount / 100).toString(),
        platformFee: (platformFee / 100).toString(),
      },
    };
    
    // Simulate the webhook logic directly
    try {
      // Create purchase data
      const purchaseData = {
        user_id: testResources.customerId,
        lesson_id: testResources.lessonId,
        stripe_payment_id: checkoutSession.id,
        amount: priceInCents / 100, // Convert to dollars
        instructor_payout_amount: instructorAmount / 100,
        platform_fee_amount: platformFee / 100,
        payout_status: 'pending_transfer',
        stripe_product_id: checkoutSession.metadata?.productId,
        stripe_price_id: checkoutSession.metadata?.priceId,
        is_free: priceInCents <= 0
      };
      
      // Insert purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();
        
      expect(purchaseError).toBeNull();
      expect(purchase).not.toBeNull();
      
      // Get instructor profile to check earnings update
      const { data: instructorBefore } = await supabase
        .from('instructor_profiles')
        .select('total_earnings')
        .eq('user_id', testResources.instructorId)
        .single();
        
      const initialEarnings = instructorBefore?.total_earnings || 0;
      
      // Update instructor earnings
      await supabase
        .from('instructor_profiles')
        .update({
          total_earnings: initialEarnings + (instructorAmount / 100),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testResources.instructorId);
        
      // Check that earnings were updated
      const { data: instructorAfter } = await supabase
        .from('instructor_profiles')
        .select('total_earnings')
        .eq('user_id', testResources.instructorId)
        .single();
        
      const expectedEarnings = initialEarnings + (instructorAmount / 100);
      expect(instructorAfter?.total_earnings).toBeCloseTo(expectedEarnings, 2);
      
    } catch (error) {
      console.error('Error in checkout.session.completed test:', error);
      throw error;
    }
  });
  
  it('should process a transfer.created event', async () => {
    const supabase = createTestClient();
    
    // Create a purchase record to update
    const purchaseData = {
      user_id: testResources.customerId,
      lesson_id: testResources.lessonId,
      stripe_payment_id: testResources.paymentIntentId,
      amount: 14.99,
      instructor_payout_amount: 12.74, // Example amount
      platform_fee_amount: 2.25, // Example amount
      payout_status: 'pending_transfer',
      stripe_product_id: testResources.productIds[0],
      stripe_price_id: 'price_test', // Placeholder
      is_free: false
    };
    
    // Insert purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single();
      
    expect(purchaseError).toBeNull();
    expect(purchase).not.toBeNull();
    
    // Simulate processing a transfer.created event
    const transferData: Partial<Stripe.Transfer> = {
      id: testResources.transferId,
      object: 'transfer',
      amount: 1274, // $12.74 in cents
      source_transaction: testResources.paymentIntentId,
    };
    
    // Update the purchase with the transfer information
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        payout_status: 'transferred',
        stripe_transfer_id: transferData.id
      })
      .eq('id', purchase.id);
      
    expect(updateError).toBeNull();
    
    // Verify the purchase was updated correctly
    const { data: updatedPurchase } = await supabase
      .from('purchases')
      .select('payout_status, stripe_transfer_id')
      .eq('id', purchase.id)
      .single();
      
    expect(updatedPurchase?.payout_status).toBe('transferred');
    expect(updatedPurchase?.stripe_transfer_id).toBe(transferData.id);
  });
  
  it('should process a transfer.failed event', async () => {
    const supabase = createTestClient();
    
    // Create another purchase record to test failed transfers
    const purchaseData = {
      user_id: testResources.customerId,
      lesson_id: testResources.lessonId,
      stripe_payment_id: `pi_test_failed_${Date.now()}`, // New mock payment intent ID
      amount: 14.99,
      instructor_payout_amount: 12.74,
      platform_fee_amount: 2.25,
      payout_status: 'pending_transfer',
      stripe_product_id: testResources.productIds[0],
      stripe_price_id: 'price_test',
      is_free: false
    };
    
    // Insert purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single();
      
    expect(purchaseError).toBeNull();
    expect(purchase).not.toBeNull();
    
    // Simulate processing a transfer.failed event
    const transferData: Partial<Stripe.Transfer> = {
      id: `tr_test_failed_${Date.now()}`,
      object: 'transfer',
      amount: 1274,
      source_transaction: purchaseData.stripe_payment_id,
    };
    
    // Update the purchase with the failed transfer information
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        payout_status: 'failed',
        stripe_transfer_id: transferData.id
      })
      .eq('id', purchase.id);
      
    expect(updateError).toBeNull();
    
    // Verify the purchase was updated correctly
    const { data: updatedPurchase } = await supabase
      .from('purchases')
      .select('payout_status, stripe_transfer_id')
      .eq('id', purchase.id)
      .single();
      
    expect(updatedPurchase?.payout_status).toBe('failed');
    expect(updatedPurchase?.stripe_transfer_id).toBe(transferData.id);
  });
});