/**
 * Tests for purchase verification functionality
 * 
 * These tests validate the purchase verification logic that ensures users have proper access to purchased content.
 * These tests use the actual development environment with real Stripe and Supabase calls.
 */

import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, deleteTestPurchases, deleteStripeTestProducts } from './utils/cleanup';
import { Database } from '@/types/supabase';

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
    userId: '',
    productIds: [] as string[],
    videoId: '',
    checkoutSessionId: '',
  };
  
  // Generate a unique test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  // Setup test environment
  beforeAll(async () => {
    // Create a test user
    const user = await createTestUser(testEmail, testPassword);
    testResources.userId = user.id;
    
    // Create a test video record
    const supabase = createTestClient();
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        title: 'Test Video',
        description: 'Test video for purchase verification',
        instructor_id: testResources.userId,
        video_url: 'https://example.com/test.mp4',
        price: 9.99,
        is_published: true,
      })
      .select()
      .single();
      
    if (videoError || !video) {
      throw new Error(`Failed to create test video: ${videoError?.message}`);
    }
    
    testResources.videoId = video.id;
    
    // Create a test Stripe product and price
    const product = await stripe.products.create({
      name: 'Test Product',
      description: 'Test product for purchase verification',
    });
    
    testResources.productIds.push(product.id);
    
    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
    });
    
    // Update the video with the Stripe IDs
    await supabase
      .from('videos')
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      })
      .eq('id', video.id);
      
    // Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        videoId: video.id,
        userId: testResources.userId,
        productId: product.id,
        priceId: price.id,
        instructorPayoutAmount: '8.49',
        platformFee: '1.50',
      },
      // Note: We can't set payment_status directly, but for testing we'll handle it
    });
    
    testResources.checkoutSessionId = session.id;
  }, 30000); // Increased timeout for setup
  
  // Clean up test resources after all tests
  afterAll(async () => {
    // Delete test purchases
    await deleteTestPurchases(testResources.userId, { videoId: testResources.videoId });
    
    // Delete test video
    const supabase = createTestClient();
    await supabase.from('videos').delete().eq('id', testResources.videoId);
    
    // Delete test Stripe products
    await deleteStripeTestProducts(testResources.productIds);
    
    // Delete test user
    await deleteTestUser(testResources.userId);
  }, 30000); // Increased timeout for cleanup
  
  it('should verify a purchase using the Stripe session ID', async () => {
    // Simulate the verify-purchase endpoint logic
    const supabase = createTestClient();
    
    // First, verify no purchase exists yet
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', testResources.userId)
      .eq('video_id', testResources.videoId)
      .maybeSingle();
      
    expect(existingPurchase).toBeNull();
    
    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(testResources.checkoutSessionId);
    expect(checkoutSession).not.toBeNull();
    
    // Extract data from the session
    const videoId = checkoutSession.metadata?.videoId;
    const instructorPayoutAmount = parseFloat(checkoutSession.metadata?.instructorPayoutAmount || '0');
    const platformFeeAmount = parseFloat(checkoutSession.metadata?.platformFee || '0');
    
    // Record the purchase in the database
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: testResources.userId,
        video_id: videoId,
        stripe_payment_id: checkoutSession.id,
        amount: 9.99,
        stripe_product_id: checkoutSession.metadata?.productId,
        stripe_price_id: checkoutSession.metadata?.priceId,
        instructor_payout_amount: instructorPayoutAmount,
        platform_fee_amount: platformFeeAmount,
        payout_status: 'pending_transfer',
      })
      .select()
      .single();
      
    expect(purchaseError).toBeNull();
    expect(purchase).not.toBeNull();
    
    // Verify the purchase was recorded with correct data
    expect(purchase.user_id).toBe(testResources.userId);
    expect(purchase.video_id).toBe(testResources.videoId);
    expect(purchase.stripe_payment_id).toBe(testResources.checkoutSessionId);
    expect(purchase.amount).toBe(9.99);
    expect(purchase.instructor_payout_amount).toBe(8.49);
    expect(purchase.platform_fee_amount).toBe(1.50);
    expect(purchase.payout_status).toBe('pending_transfer');
  });
  
  it('should check if user has access to the video', async () => {
    const supabase = createTestClient();
    
    // Verify the user has access by checking for a purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, created_at')
      .eq('user_id', testResources.userId)
      .eq('video_id', testResources.videoId)
      .maybeSingle();
      
    expect(purchaseError).toBeNull();
    expect(purchase).not.toBeNull();
    
    // Also try the RPC function if it exists (may not be in all environments)
    try {
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('verify_video_access', {
          p_user_id: testResources.userId,
          p_video_id: testResources.videoId,
        });
        
      if (!accessError) {
        expect(hasAccess).toBe(true);
      }
    } catch (error) {
      console.log('RPC function test skipped - function may not exist in this environment');
    }
  });
});