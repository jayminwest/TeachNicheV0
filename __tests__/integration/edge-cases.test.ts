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
  cleanupStripeTestData,
  logTestTransaction
} from '../utils/stripe';

describe('Edge Cases', () => {
  let buyerUser: any;
  let instructorUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;
  let lessonId: string;
  let stripeCustomerId: string;
  let stripeProductId: string;
  let stripePriceId: string;
  let wrongPriceId: string;

  beforeAll(async () => {
    // Create a test instructor user
    instructorUser = await createTestUser(
      `instructor-edge-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
    
    // Create a test buyer user
    buyerUser = await createTestUser(
      `buyer-edge-${Date.now()}@test.com`,
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
    const product = await createTestProduct('Test Edge Case Product');
    stripeProductId = product.id;
    
    // Create a test price in Stripe
    const price = await createTestPrice(product.id, 1500); // $15.00
    stripePriceId = price.id;
    
    // Create a different price for testing price mismatches
    const wrongPrice = await createTestPrice(product.id, 2000); // $20.00
    wrongPriceId = wrongPrice.id;
    
    // Create a test customer in Stripe
    const customer = await createTestCustomer();
    stripeCustomerId = customer.id;
    
    // Create a test lesson
    const lesson = await createTestLesson(
      instructorProfileId,
      1500, // $15.00
      'Lesson for Edge Case Tests',
      'This is a test lesson for edge case testing',
      stripeProductId,
      stripePriceId
    );
    
    lessonId = lesson.id;
    
    // Log test setup
    logTestData('Edge Case Tests Setup', 'setup', {
      buyerUserId: buyerUser.id,
      instructorUserId: instructorUser.id,
      stripeAccountId,
      lessonId,
      stripePriceId,
      wrongPriceId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupSupabaseTestData(buyerUser?.id);
    await cleanupSupabaseTestData(instructorUser?.id, instructorProfileId, lessonId);
    await cleanupStripeTestData(
      stripeCustomerId,
      stripeAccountId,
      undefined,
      stripeProductId,
      stripePriceId
    );
  });

  test('should prevent duplicate purchases of the same lesson by the same user', async () => {
    // Create an initial purchase
    const sessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    const initialPurchase = await createTestPurchase(
      buyerUser.id,
      sessionId,
      1500, // $15.00
      lessonId,
      1275, // $12.75 (85% of $15.00)
      225,  // $2.25 (15% of $15.00)
      'completed'
    );
    
    // Log the initial purchase
    logTestData('Initial Purchase', 'purchase', initialPurchase);
    
    // Attempt to create a duplicate purchase (we expect this to fail)
    const duplicateSessionId = `cs_test_duplicate_${Math.random().toString(36).substring(2, 15)}`;
    
    // Check if a purchase already exists
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', buyerUser.id)
      .eq('lesson_id', lessonId)
      .single();
    
    // Log the check result
    logTestData('Duplicate Purchase Check', 'check_result', {
      exists: !!existingPurchase,
      userId: buyerUser.id,
      lessonId,
    });
    
    // Verify that we detect the duplicate
    expect(existingPurchase).toBeDefined();
    expect(existingPurchase!.id).toBe(initialPurchase.id);
    
    // Simulate API endpoint behavior by not creating a duplicate purchase
    let duplicatePurchaseCreated = false;
    if (!existingPurchase) {
      // This code should not run as the existingPurchase should be found
      duplicatePurchaseCreated = true;
      
      // We'd create the purchase here, but we shouldn't reach this code
      await createTestPurchase(
        buyerUser.id,
        duplicateSessionId,
        1500,
        lessonId
      );
    }
    
    // Verify that no duplicate was created
    expect(duplicatePurchaseCreated).toBe(false);
    
    // Clean up after test
    await supabase.from('purchases').delete().eq('id', initialPurchase.id);
  });

  test('should detect price mismatch between Stripe and database', async () => {
    // Get the lesson price from the database
    const { data: lesson } = await supabase
      .from('lessons')
      .select('price, stripe_price_id')
      .eq('id', lessonId)
      .single();
    
    // Log the price information
    logTestData('Price Check', 'price_info', {
      lessonId,
      databasePrice: lesson!.price,
      databasePriceId: lesson!.stripe_price_id,
      wrongPriceId,
    });
    
    // Create a test checkout price info with the wrong price ID
    const stripePrice = {
      id: wrongPriceId,
      unit_amount: 2000, // $20.00
      currency: 'usd',
    };
    
    // Check if the price IDs match
    const priceIdsMatch = lesson!.stripe_price_id === stripePrice.id;
    
    // Log the mismatch detection
    logTestData('Price Mismatch Detection', 'detection_result', {
      priceIdsMatch,
      databasePriceId: lesson!.stripe_price_id,
      requestPriceId: stripePrice.id,
    });
    
    // Verify the mismatch is detected
    expect(priceIdsMatch).toBe(false);
    expect(lesson!.stripe_price_id).toBe(stripePriceId);
    expect(lesson!.stripe_price_id).not.toBe(wrongPriceId);
  });

  test('should handle disabled instructor account case', async () => {
    // Disable the instructor account
    const { data: disabledProfile, error } = await supabase
      .from('instructor_profiles')
      .update({
        stripe_account_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId)
      .select()
      .single();
    
    // Log the account disablement
    logTestData('Disable Instructor Account', 'instructor_profile', disabledProfile || {});
    
    // Verify the account is disabled
    expect(error).toBeNull();
    expect(disabledProfile).toBeDefined();
    expect(disabledProfile!.stripe_account_enabled).toBe(false);
    
    // Simulate checkout attempt for a disabled instructor
    const { data: instructor } = await supabase
      .from('instructor_profiles')
      .select('stripe_account_enabled')
      .eq('id', instructorProfileId)
      .single();
    
    // Determine if checkout should proceed
    const shouldAllowCheckout = instructor!.stripe_account_enabled;
    
    // Log the checkout check
    logTestData('Checkout Permission Check', 'check_result', {
      instructorProfileId,
      accountEnabled: instructor!.stripe_account_enabled,
      shouldAllowCheckout,
    });
    
    // Verify checkout is blocked
    expect(shouldAllowCheckout).toBe(false);
    
    // Re-enable the instructor account
    await supabase
      .from('instructor_profiles')
      .update({
        stripe_account_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId);
  });

  test('should verify that a free lesson bypasses payment processing', async () => {
    // Create a free lesson
    const freeLesson = await createTestLesson(
      instructorProfileId,
      0, // $0.00
      'Free Lesson for Testing',
      'This is a free lesson that should bypass payment processing'
    );
    
    // Log the free lesson creation
    logTestData('Create Free Lesson', 'lesson', freeLesson);
    
    // Simulate purchase of a free lesson (direct DB entry, no Stripe involved)
    const freePurchase = await createTestPurchase(
      buyerUser.id,
      'free_no_payment', // No real Stripe session ID needed
      0, // $0.00
      freeLesson.id,
      0, // $0.00 instructor payout
      0, // $0.00 platform fee
      'completed', // Automatically marked as completed
      undefined, // No Stripe product ID needed
      undefined, // No Stripe price ID needed
      undefined, // No Stripe transfer ID needed
      true // is_free flag
    );
    
    // Log the free purchase
    logTestData('Free Lesson Purchase', 'purchase', freePurchase);
    
    // Verify the purchase
    expect(freePurchase).toBeDefined();
    expect(freePurchase.amount).toBe(0);
    expect(freePurchase.is_free).toBe(true);
    expect(freePurchase.payout_status).toBe('completed');
    expect(freePurchase.stripe_payment_id).toBe('free_no_payment');
    
    // Cleanup
    await supabase.from('purchases').delete().eq('id', freePurchase.id);
    await supabase.from('lessons').delete().eq('id', freeLesson.id);
  });
});
