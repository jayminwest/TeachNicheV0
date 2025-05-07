/**
 * Tests for the checkout flow
 * 
 * These tests validate the checkout process for lessons and videos, testing the actual
 * Stripe integration in the development environment.
 */

import { stripe, calculateFees, calculatePriceWithStripeFees } from '@/lib/stripe';
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

describe('Checkout Flow', () => {
  // Store test resources to clean up later
  const testResources = {
    userIds: [] as string[],
    lessonId: '',
    videoId: '',
    instructorId: '',
    productIds: [] as string[],
    sessionIds: [] as string[],
  };
  
  // Create test instructor and customer
  beforeAll(async () => {
    // Create instructor user
    const instructorEmail = `instructor-${Date.now()}@example.com`;
    const instructor = await createTestUser(instructorEmail, 'Instructor123!');
    testResources.instructorId = instructor.id;
    testResources.userIds.push(instructor.id);
    
    // Create customer user
    const customerEmail = `customer-${Date.now()}@example.com`;
    const customer = await createTestUser(customerEmail, 'Customer123!');
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
        bio: 'Test instructor',
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
        title: 'Test Lesson',
        description: 'Test lesson for checkout',
        instructor_id: instructor.id,
        price: 19.99,
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
      name: 'Test Lesson',
      description: 'Test lesson for checkout',
    });
    
    testResources.productIds.push(product.id);
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1999, // $19.99
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
      
    // Create test video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        title: 'Test Video',
        description: 'Test video for checkout',
        video_url: 'https://example.com/test.mp4',
        instructor_id: instructor.id,
        price: 9.99,
        is_published: true,
      })
      .select()
      .single();
      
    if (videoError || !video) {
      throw new Error(`Failed to create test video: ${videoError?.message}`);
    }
    
    testResources.videoId = video.id;
    
    // Create a Stripe product and price for the video
    const videoProduct = await stripe.products.create({
      name: 'Test Video',
      description: 'Test video for checkout',
    });
    
    testResources.productIds.push(videoProduct.id);
    
    const videoPrice = await stripe.prices.create({
      product: videoProduct.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
    });
    
    // Update the video with Stripe IDs
    await supabase
      .from('videos')
      .update({
        stripe_product_id: videoProduct.id,
        stripe_price_id: videoPrice.id,
      })
      .eq('id', video.id);
  }, 60000); // Longer timeout for setup
  
  // Clean up after all tests
  afterAll(async () => {
    // Delete test purchases
    for (const userId of testResources.userIds) {
      await deleteTestPurchases(userId);
    }
    
    // Delete test sessions if needed
    for (const sessionId of testResources.sessionIds) {
      try {
        // Can't actually delete sessions, but we can log them
        console.log(`Would cleanup session: ${sessionId}`);
      } catch (error) {
        console.error(`Error with test session ${sessionId}:`, error);
      }
    }
    
    // Delete test products
    await deleteStripeTestProducts(testResources.productIds);
    
    // Delete test data
    const supabase = createTestClient();
    await supabase.from('videos').delete().eq('id', testResources.videoId);
    await supabase.from('lessons').delete().eq('id', testResources.lessonId);
    await supabase.from('instructor_profiles').delete().eq('user_id', testResources.instructorId);
    
    // Delete test users
    for (const userId of testResources.userIds) {
      await deleteTestUser(userId);
    }
  }, 60000); // Longer timeout for cleanup
  
  it('should create a checkout session for a lesson', async () => {
    // Test the lesson checkout process
    const lessonId = testResources.lessonId;
    const customerId = testResources.userIds[1]; // Use the customer user
    
    const supabase = createTestClient();
    
    // Get the lesson details
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*, instructor_profiles:instructor_id(stripe_account_id)')
      .eq('id', lessonId)
      .single();
      
    expect(lesson).not.toBeNull();
    
    // Calculate the price with fees
    const priceInCents = Math.round(lesson.price * 100);
    const { platformFee, instructorAmount } = calculateFees(priceInCents);
    
    // Calculate price with fees
    const priceWithFees = calculatePriceWithStripeFees(priceInCents) / 100;
    const priceWithFeesInCents = Math.round(priceWithFees * 100);
    
    // Create checkout product and price
    const checkoutProduct = await stripe.products.create({
      name: lesson.title,
      description: `${lesson.title} (includes processing fees)`,
    });
    
    testResources.productIds.push(checkoutProduct.id);
    
    const checkoutPrice = await stripe.prices.create({
      product: checkoutProduct.id,
      unit_amount: priceWithFeesInCents,
      currency: 'usd',
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: checkoutPrice.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/lessons/${lessonId}`,
      metadata: {
        lessonId: lessonId,
        userId: customerId,
        instructorId: lesson.instructor_id,
        stripeProductId: lesson.stripe_product_id,
        stripePriceId: lesson.stripe_price_id,
        originalPrice: lesson.price.toString(),
        instructorPayoutAmount: (instructorAmount / 100).toString(),
        platformFee: (platformFee / 100).toString(),
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: lesson.instructor_profiles.stripe_account_id,
        },
      },
    });
    
    testResources.sessionIds.push(session.id);
    
    expect(session).not.toBeNull();
    expect(session.url).toBeTruthy();
    
    // Verify the session metadata
    expect(session.metadata?.lessonId).toBe(lessonId);
    expect(session.metadata?.userId).toBe(customerId);
    expect(session.metadata?.instructorId).toBe(lesson.instructor_id);
    
    // Verify the payment intent data if it exists
    // Cast to PaymentIntent to access fields since payment_intent can be string or PaymentIntent
    const paymentIntent = typeof session.payment_intent === 'string' 
      ? null 
      : session.payment_intent;
    
    if (paymentIntent) {
      expect(paymentIntent.application_fee_amount).toBe(platformFee);
      expect(paymentIntent.transfer_data?.destination).toBe(
        lesson.instructor_profiles.stripe_account_id
      );
    }
  });
  
  it('should create a checkout session for a video', async () => {
    // Test the video checkout process
    const videoId = testResources.videoId;
    const customerId = testResources.userIds[1]; // Use the customer user
    
    const supabase = createTestClient();
    
    // Get the video details
    const { data: video } = await supabase
      .from('videos')
      .select('*, instructor_profiles:instructor_id(stripe_account_id)')
      .eq('id', videoId)
      .single();
      
    expect(video).not.toBeNull();
    
    // Calculate the price with fees
    const priceInCents = Math.round(video.price * 100);
    const { platformFee, instructorAmount } = calculateFees(priceInCents);
    
    // Calculate price with fees
    const priceWithFees = calculatePriceWithStripeFees(priceInCents) / 100;
    const priceWithFeesInCents = Math.round(priceWithFees * 100);
    
    // Create checkout product and price
    const checkoutProduct = await stripe.products.create({
      name: video.title,
      description: `${video.title} (includes processing fees)`,
    });
    
    testResources.productIds.push(checkoutProduct.id);
    
    const checkoutPrice = await stripe.prices.create({
      product: checkoutProduct.id,
      unit_amount: priceWithFeesInCents,
      currency: 'usd',
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: checkoutPrice.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/videos/${videoId}`,
      metadata: {
        videoId: videoId,
        userId: customerId,
        instructorId: video.instructor_id,
        stripeProductId: video.stripe_product_id,
        stripePriceId: video.stripe_price_id,
        originalPrice: video.price.toString(),
        instructorPayoutAmount: (instructorAmount / 100).toString(),
        platformFee: (platformFee / 100).toString(),
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: video.instructor_profiles.stripe_account_id,
        },
      },
    });
    
    testResources.sessionIds.push(session.id);
    
    expect(session).not.toBeNull();
    expect(session.url).toBeTruthy();
    
    // Verify the session metadata
    expect(session.metadata?.videoId).toBe(videoId);
    expect(session.metadata?.userId).toBe(customerId);
    expect(session.metadata?.instructorId).toBe(video.instructor_id);
    
    // Verify the payment intent data if it exists
    // Cast to PaymentIntent to access fields since payment_intent can be string or PaymentIntent
    const paymentIntent = typeof session.payment_intent === 'string' 
      ? null 
      : session.payment_intent;
    
    if (paymentIntent) {
      expect(paymentIntent.application_fee_amount).toBe(platformFee);
      expect(paymentIntent.transfer_data?.destination).toBe(
        video.instructor_profiles.stripe_account_id
      );
    }
  });
});