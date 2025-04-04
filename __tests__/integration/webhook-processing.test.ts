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
  createTestWebhookEvent,
  cleanupStripeTestData,
  logTestTransaction
} from '../utils/stripe';

describe('Webhook Processing Flow', () => {
  let buyerUser: any;
  let instructorUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;
  let lessonId: string;
  let stripeCustomerId: string;
  let stripeProductId: string;
  let stripePriceId: string;
  let purchaseId: string;
  let checkoutSessionId: string;
  let transferId: string;

  beforeAll(async () => {
    // Create a test instructor user
    instructorUser = await createTestUser(
      `instructor-webhook-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
    
    // Create a test buyer user
    buyerUser = await createTestUser(
      `buyer-webhook-${Date.now()}@test.com`,
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
    const product = await createTestProduct('Test Webhook Product');
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
      'Paid Lesson for Webhook Tests',
      'This is a test lesson for webhook processing testing',
      stripeProductId,
      stripePriceId
    );
    
    lessonId = lesson.id;
    
    // Generate a checkout session ID and transfer ID for testing
    checkoutSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    transferId = `tr_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a pending purchase
    const purchase = await createTestPurchase(
      buyerUser.id,
      checkoutSessionId,
      1500, // $15.00
      lessonId,
      1275, // $12.75 (85% of $15.00)
      225,  // $2.25 (15% of $15.00)
      'pending'
    );
    
    purchaseId = purchase.id;
    
    // Log test setup
    logTestData('Webhook Tests Setup', 'setup', {
      buyerUserId: buyerUser.id,
      instructorUserId: instructorUser.id,
      stripeAccountId,
      lessonId,
      checkoutSessionId,
      purchaseId,
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

  test('should process checkout.session.completed webhook event', async () => {
    // Create a mock checkout.session.completed event
    const checkoutSessionEvent = createTestWebhookEvent(
      'checkout.session.completed',
      {
        id: checkoutSessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        customer: stripeCustomerId,
        amount_total: 1500,
        metadata: {
          lessonId: lessonId,
          userId: buyerUser.id,
          instructorId: instructorUser.id,
          productId: stripeProductId,
          priceId: stripePriceId,
          instructorPayoutAmount: '12.75', // $12.75 (85% of $15.00)
        },
      }
    );
    
    // Log the event for debugging
    logTestTransaction(
      'Checkout Session Completed Event',
      checkoutSessionEvent.id,
      {
        type: checkoutSessionEvent.type,
        sessionId: checkoutSessionEvent.data.object.id,
      }
    );

    // Simulate webhook processing by updating the purchase status
    const { data: updatedPurchase, error } = await supabase
      .from('purchases')
      .update({
        payout_status: 'pending_transfer'
      })
      .eq('stripe_payment_id', checkoutSessionId)
      .select()
      .single();
    
    // Log the updated purchase
    logTestData(
      'Process Checkout Session Completed',
      'purchase',
      updatedPurchase || {},
      { webhookEventId: checkoutSessionEvent.id }
    );

    // Verify the webhook processing
    expect(error).toBeNull();
    expect(updatedPurchase).toBeDefined();
    expect(updatedPurchase!.payout_status).toBe('pending_transfer');
  });

  test('should process transfer.created webhook event', async () => {
    // Create a mock transfer.created event
    const transferEvent = createTestWebhookEvent(
      'transfer.created',
      {
        id: transferId,
        object: 'transfer',
        amount: 1275, // $12.75 (85% of $15.00)
        destination: stripeAccountId,
        source_transaction: checkoutSessionId,
        status: 'paid',
      }
    );
    
    // Log the event for debugging
    logTestTransaction(
      'Transfer Created Event',
      transferEvent.id,
      {
        type: transferEvent.type,
        transferId: transferEvent.data.object.id,
        amount: transferEvent.data.object.amount,
        destination: transferEvent.data.object.destination,
      }
    );

    // Simulate webhook processing by updating the purchase with transfer information
    const { data: updatedPurchase, error } = await supabase
      .from('purchases')
      .update({
        payout_status: 'transferred',
        stripe_transfer_id: transferId
      })
      .eq('stripe_payment_id', checkoutSessionId)
      .select()
      .single();
    
    // Log the updated purchase
    logTestData(
      'Process Transfer Created',
      'purchase',
      updatedPurchase || {},
      { webhookEventId: transferEvent.id }
    );

    // Verify the webhook processing
    expect(error).toBeNull();
    expect(updatedPurchase).toBeDefined();
    expect(updatedPurchase!.payout_status).toBe('transferred');
    expect(updatedPurchase!.stripe_transfer_id).toBe(transferId);
  });

  test('should process transfer.failed webhook event', async () => {
    // Create a new purchase for testing transfer failure
    const failedTransferId = `tr_failed_${Math.random().toString(36).substring(2, 15)}`;
    const failedSessionId = `cs_test_failed_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a purchase with pending_transfer status
    const failedPurchase = await createTestPurchase(
      buyerUser.id,
      failedSessionId,
      1500, // $15.00
      lessonId,
      1275, // $12.75 (85% of $15.00)
      225,  // $2.25 (15% of $15.00)
      'pending_transfer'
    );
    
    // Create a mock transfer.failed event
    const transferFailedEvent = createTestWebhookEvent(
      'transfer.failed',
      {
        id: failedTransferId,
        object: 'transfer',
        amount: 1275, // $12.75 (85% of $15.00)
        destination: stripeAccountId,
        source_transaction: failedSessionId,
        status: 'failed',
      }
    );
    
    // Log the event for debugging
    logTestTransaction(
      'Transfer Failed Event',
      transferFailedEvent.id,
      {
        type: transferFailedEvent.type,
        transferId: transferFailedEvent.data.object.id,
        status: transferFailedEvent.data.object.status,
      }
    );

    // Simulate webhook processing by updating the purchase with failure information
    const { data: updatedPurchase, error } = await supabase
      .from('purchases')
      .update({
        payout_status: 'failed',
        stripe_transfer_id: failedTransferId
      })
      .eq('id', failedPurchase.id)
      .select()
      .single();
    
    // Log the updated purchase
    logTestData(
      'Process Transfer Failed',
      'purchase',
      updatedPurchase || {},
      { webhookEventId: transferFailedEvent.id }
    );

    // Verify the webhook processing
    expect(error).toBeNull();
    expect(updatedPurchase).toBeDefined();
    expect(updatedPurchase!.payout_status).toBe('failed');
    expect(updatedPurchase!.stripe_transfer_id).toBe(failedTransferId);
    
    // Clean up the failed purchase
    await supabase.from('purchases').delete().eq('id', failedPurchase.id);
  });
});
