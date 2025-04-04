import {
  createTestUser,
  createTestInstructorProfile,
  createTestLesson,
  cleanupSupabaseTestData,
  logTestData
} from '../utils/supabase';
import {
  createTestConnectAccount,
  createTestProduct,
  createTestPrice,
  cleanupStripeTestData,
  logTestTransaction
} from '../utils/stripe';

describe('Lesson Management Flow', () => {
  let testUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;
  let freeLessonId: string;
  let paidLessonId: string;
  let stripeProductId: string;
  let stripePriceId: string;

  beforeAll(async () => {
    // Create a test user with instructor role
    testUser = await createTestUser(
      `instructor-lesson-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
    
    // Create a Stripe Connect account
    const connectAccount = await createTestConnectAccount(testUser.email);
    stripeAccountId = connectAccount.id;
    
    // Create an instructor profile with the Stripe account ID
    const instructorProfile = await createTestInstructorProfile(
      testUser.id,
      stripeAccountId,
      true, // account enabled
      true  // onboarding complete
    );
    
    instructorProfileId = instructorProfile.id;
    
    // Create a test product in Stripe
    const product = await createTestProduct('Test Lesson Product');
    stripeProductId = product.id;
    
    // Create a test price in Stripe
    const price = await createTestPrice(product.id, 1500); // $15.00
    stripePriceId = price.id;
    
    // Log for debugging
    logTestTransaction('Test Setup', 'setup_complete', {
      userId: testUser.id,
      instructorProfileId,
      stripeAccountId,
      stripeProductId,
      stripePriceId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupSupabaseTestData(testUser?.id, instructorProfileId, freeLessonId);
    await cleanupSupabaseTestData(undefined, undefined, paidLessonId);
    await cleanupStripeTestData(undefined, stripeAccountId, undefined, stripeProductId, stripePriceId);
  });

  test('should create a free lesson correctly', async () => {
    // Create a free lesson
    const freeLesson = await createTestLesson(
      instructorProfileId,
      0, // Price is zero for free lessons
      'Free Test Lesson',
      'This is a free lesson for testing'
    );
    
    freeLessonId = freeLesson.id;
    
    // Log for debugging
    logTestData('Create Free Lesson', 'lesson', freeLesson);

    // Verify the free lesson
    expect(freeLesson).toBeDefined();
    expect(freeLesson.id).toBeDefined();
    expect(freeLesson.instructor_id).toBe(instructorProfileId);
    expect(freeLesson.price).toBe(0);
    expect(freeLesson.title).toBe('Free Test Lesson');
    expect(freeLesson.description).toBe('This is a free lesson for testing');
  });

  test('should create a paid lesson with Stripe product and price', async () => {
    // Create a paid lesson
    const paidLesson = await createTestLesson(
      instructorProfileId,
      1500, // $15.00
      'Paid Test Lesson',
      'This is a paid lesson for testing',
      stripeProductId,
      stripePriceId
    );
    
    paidLessonId = paidLesson.id;
    
    // Log for debugging
    logTestData('Create Paid Lesson', 'lesson', paidLesson, {
      stripeProductId,
      stripePriceId,
    });

    // Verify the paid lesson
    expect(paidLesson).toBeDefined();
    expect(paidLesson.id).toBeDefined();
    expect(paidLesson.instructor_id).toBe(instructorProfileId);
    expect(paidLesson.price).toBe(1500);
    expect(paidLesson.title).toBe('Paid Test Lesson');
    expect(paidLesson.description).toBe('This is a paid lesson for testing');
    expect(paidLesson.stripe_product_id).toBe(stripeProductId);
    expect(paidLesson.stripe_price_id).toBe(stripePriceId);
  });

  test('should update a lesson correctly', async () => {
    // Update the free lesson
    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update({
        title: 'Updated Free Lesson',
        description: 'This free lesson has been updated',
        updated_at: new Date().toISOString()
      })
      .eq('id', freeLessonId)
      .select()
      .single();
    
    // Log for debugging
    logTestData('Update Lesson', 'lesson', updatedLesson || {});

    // Verify the update
    expect(error).toBeNull();
    expect(updatedLesson).toBeDefined();
    expect(updatedLesson!.title).toBe('Updated Free Lesson');
    expect(updatedLesson!.description).toBe('This free lesson has been updated');
  });

  test('should add Stripe product/price to existing lesson', async () => {
    // Update the free lesson with Stripe product and price to make it paid
    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update({
        price: 999, // $9.99
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', freeLessonId)
      .select()
      .single();
    
    // Log for debugging
    logTestData('Add Stripe to Lesson', 'lesson', updatedLesson || {}, {
      previouslyFree: true,
      newPrice: 999,
      stripeProductId,
      stripePriceId,
    });

    // Verify the update
    expect(error).toBeNull();
    expect(updatedLesson).toBeDefined();
    expect(updatedLesson!.price).toBe(999);
    expect(updatedLesson!.stripe_product_id).toBe(stripeProductId);
    expect(updatedLesson!.stripe_price_id).toBe(stripePriceId);
  });
});
