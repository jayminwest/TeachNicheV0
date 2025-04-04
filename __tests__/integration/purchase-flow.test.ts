import {
  createTestUser,
  createTestInstructorProfile,
  createTestLesson,
  createTestPurchase,
  supabase,
  cleanupSupabaseTestData,
  logTestData
} from '../utils/supabase';
import {
  createTestConnectAccount,
  createTestCustomer,
  createTestProduct,
  createTestPrice,
  createTestCheckoutSession,
  createTestPaymentIntent,
  createTestTransfer,
  cleanupStripeTestData,
  logTestTransaction
} from '../utils/stripe';

describe('Purchase Flow', () => {
  let buyerUser: any;
  let instructorUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;
  let lessonId: string;
  let stripeCustomerId: string;
  let stripeProductId: string;
  let stripePriceId: string;
  let checkoutSessionId: string;
  let purchaseId: string;
  let paymentIntentId: string;
  let transferId: string;

  beforeAll(async () => {
    // Create a test instructor user
    instructorUser = await createTestUser(
      `instructor-purchase-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
    
    // Create a test buyer user
    buyerUser = await createTestUser(
      `buyer-${Date.now()}@test.com`,
      'Password123!',
      'user'
    );
    
    // Create a Stripe Connect account for the instructor
    const connectAccount = await createTestConnectAccount(instructorUser.email);
    stripeAccountId = connectAccount.id;
    
    // Create an instructor profile with the Stripe account ID
    const instructorProfile = await createTestInstructorProfile(
      instructorUser.id,
      stripeAccountId,
      true, // account enabled
      true  // onboarding complete
    );
    
    instructorProfileId = instructorProfile.id;
    
    // Create a test product in Stripe
    const product = await createTestProduct('Test Purchase Product');
    stripeProductId = product.id;
    
    // Create a test price in Stripe
    const price = await createTestPrice(product.id, 1500); // $15.00
    stripePriceId = price.id;
    
    // Create a test customer in Stripe
    const customer = await createTestCustomer();
    stripeCustomerId = customer.id;
    
    // Create a test lesson
    const lesson = await createTestLesson(
      instructorProfileId,
      1500, // $15.00
      'Paid Lesson for Purchase Tests',
      'This is a test lesson for purchase flow testing',
      stripeProductId,
      stripePriceId
    );
    
    lessonId = lesson.id;
    
    // Log test setup for debugging
    logTestTransaction('Purchase Flow Setup', 'setup_complete', {
      buyerUserId: buyerUser.id,
      instructorUserId: instructorUser.id,
      stripeAccountId,
      lessonId,
      stripeCustomerId,
      stripeProductId,
      stripePriceId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupSupabaseTestData(buyerUser?.id);
    await cleanupSupabaseTestData(instructorUser?.id, instructorProfileId, lessonId, purchaseId);
    await cleanupStripeTestData(
      stripeCustomerId,
      stripeAccountId,
      undefined,
      stripeProductId,
      stripePriceId
    );
  });

  test('should create a checkout session for a lesson purchase', async () => {
    // Create a checkout session
    const session = await createTestCheckoutSession(
      stripePriceId,
      stripeCustomerId,
      {
        lessonId: lessonId,
        userId: buyerUser.id,
        instructorId: instructorUser.id,
        productId: stripeProductId,
        priceId: stripePriceId,
      }
    );
    
    checkoutSessionId = session.id;
    
    // Log for debugging
    logTestTransaction('Create Checkout Session', session.id, {
      customerId: stripeCustomerId,
      priceId: stripePriceId,
      url: session.url,
    });

    // Verify the checkout session
    expect(session).toBeDefined();
    expect(session.id).toContain('cs_');
    expect(session.payment_status).toBe('unpaid');
    expect(session.mode).toBe('payment');
    expect(session.metadata).toBeDefined();
    expect(session.metadata!.lessonId).toBe(lessonId);
    expect(session.metadata!.userId).toBe(buyerUser.id);
  });

  test('should record a pending purchase in the database', async () => {
    // Create a purchase record with pending status
    const purchase = await createTestPurchase(
      buyerUser.id,
      checkoutSessionId,
      1500, // $15.00
      lessonId,
      1275, // $12.75 (85% of $15.00)
      225,  // $2.25 (15% of $15.00)
      'pending',
      stripeProductId,
      stripePriceId
    );
    
    purchaseId = purchase.id;
    
    // Log for debugging
    logTestData('Create Pending Purchase', 'purchase', purchase, {
      buyerUserId: buyerUser.id,
      lessonId,
      checkoutSessionId,
    });

    // Verify the purchase record
    expect(purchase).toBeDefined();
    expect(purchase.id).toBeDefined();
    expect(purchase.user_id).toBe(buyerUser.id);
    expect(purchase.lesson_id).toBe(lessonId);
    expect(purchase.stripe_payment_id).toBe(checkoutSessionId);
    expect(purchase.amount).toBe(1500);
    expect(purchase.instructor_payout_amount).toBe(1275);
    expect(purchase.platform_fee_amount).toBe(225);
    expect(purchase.payout_status).toBe('pending');
  });

  test('should handle successful payment completion', async () => {
    // Simulate payment completion with a payment intent
    const paymentIntent = await createTestPaymentIntent(
      1500, // $15.00
      'usd',
      stripeCustomerId,
      {
        destination: stripeAccountId,
        amount: 1275, // $12.75 (85% of $15.00)
      }
    );
    
    paymentIntentId = paymentIntent.id;
    
    // Log for debugging
    logTestTransaction('Create Payment Intent', paymentIntent.id, {
      amount: paymentIntent.amount,
      customerId: stripeCustomerId,
      transferData: paymentIntent.transfer_data,
    });

    // Update the purchase to completed status
    const { data: updatedPurchase, error } = await supabase
      .from('purchases')
      .update({
        stripe_payment_id: paymentIntent.id, // Replace checkout session ID with payment intent ID
        payout_status: 'pending_transfer'
      })
      .eq('id', purchaseId)
      .select()
      .single();
    
    // Log for debugging
    logTestData('Update Purchase to Completed', 'purchase', updatedPurchase || {}, {
      previousSessionId: checkoutSessionId,
      newPaymentIntentId: paymentIntent.id,
    });

    // Verify the updated purchase
    expect(error).toBeNull();
    expect(updatedPurchase).toBeDefined();
    expect(updatedPurchase!.stripe_payment_id).toBe(paymentIntent.id);
    expect(updatedPurchase!.payout_status).toBe('pending_transfer');
  });

  test('should process instructor payout with transfer', async () => {
    // Create a transfer to the instructor's Connect account
    const transfer = await createTestTransfer(
      1275, // $12.75 (85% of $15.00)
      stripeAccountId,
      paymentIntentId
    );
    
    transferId = transfer.id;
    
    // Log for debugging
    logTestTransaction('Create Transfer', transfer.id, {
      amount: transfer.amount,
      destination: transfer.destination,
      sourceTransaction: transfer.source_transaction,
    });

    // Update the purchase with transfer information
    const { data: updatedPurchase, error } = await supabase
      .from('purchases')
      .update({
        payout_status: 'transferred',
        stripe_transfer_id: transfer.id
      })
      .eq('id', purchaseId)
      .select()
      .single();
    
    // Log for debugging
    logTestData('Update Purchase with Transfer', 'purchase', updatedPurchase || {}, {
      transferId: transfer.id,
    });

    // Verify the updated purchase
    expect(error).toBeNull();
    expect(updatedPurchase).toBeDefined();
    expect(updatedPurchase!.payout_status).toBe('transferred');
    expect(updatedPurchase!.stripe_transfer_id).toBe(transfer.id);
  });

  test('should handle failed payment scenario', async () => {
    // Create another checkout session for testing failure
    const failedSession = await createTestCheckoutSession(
      stripePriceId,
      stripeCustomerId,
      {
        lessonId: lessonId,
        userId: buyerUser.id,
        instructorId: instructorUser.id,
      }
    );
    
    // Create a purchase record with failed status
    const failedPurchase = await createTestPurchase(
      buyerUser.id,
      failedSession.id,
      1500, // $15.00
      lessonId,
      1275, // $12.75 (85% of $15.00)
      225,  // $2.25 (15% of $15.00)
      'failed'
    );
    
    // Log for debugging
    logTestData('Create Failed Purchase', 'purchase', failedPurchase, {
      sessionId: failedSession.id,
    });

    // Verify the failed purchase
    expect(failedPurchase).toBeDefined();
    expect(failedPurchase.payout_status).toBe('failed');
    
    // Clean up the failed purchase
    await supabase.from('purchases').delete().eq('id', failedPurchase.id);
  });
});
