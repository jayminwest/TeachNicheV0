import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with test/dev credentials
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

/**
 * Creates a test user in Supabase Auth and the users table
 */
export const createTestUser = async (
  email: string = `test-${uuidv4()}@example.com`,
  password: string = 'Test123456!',
  role: string = 'user'
) => {
  // Create the user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Failed to create test user in auth: ${authError.message}`);
  }

  // Create the user in the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      name: `Test User ${uuidv4().substring(0, 8)}`,
      bio: 'This is a test user created for integration testing',
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) {
    // Clean up the auth user if the user table insert fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to create test user in users table: ${userError.message}`);
  }

  return {
    ...authData.user,
    ...userData,
  };
};

/**
 * Creates a test instructor profile
 */
export const createTestInstructorProfile = async (
  userId: string,
  stripeAccountId?: string,
  accountEnabled: boolean = false,
  onboardingComplete: boolean = false
) => {
  const { data, error } = await supabase
    .from('instructor_profiles')
    .insert({
      user_id: userId,
      stripe_account_id: stripeAccountId,
      stripe_account_enabled: accountEnabled,
      stripe_onboarding_complete: onboardingComplete,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test instructor profile: ${error.message}`);
  }

  return data;
};

/**
 * Creates a test lesson for an instructor
 */
export const createTestLesson = async (
  instructorId: string,
  price: number = 0,
  title: string = `Test Lesson ${uuidv4().substring(0, 8)}`,
  description: string = 'This is a test lesson created for integration testing',
  stripeProductId?: string,
  stripePriceId?: string
) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      instructor_id: instructorId,
      title,
      description,
      price,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test lesson: ${error.message}`);
  }

  return data;
};

/**
 * Creates a test video for a lesson
 */
export const createTestVideo = async (
  instructorId: string,
  lessonId?: string,
  price: number = 0,
  title: string = `Test Video ${uuidv4().substring(0, 8)}`,
  videoUrl: string = `https://example.com/test-video-${uuidv4()}.mp4`
) => {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      instructor_id: instructorId,
      lesson_id: lessonId,
      title,
      description: 'This is a test video created for integration testing',
      video_url: videoUrl,
      price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test video: ${error.message}`);
  }

  return data;
};

/**
 * Creates a test purchase record
 */
export const createTestPurchase = async (
  userId: string,
  stripePaymentId: string,
  amount: number = 1000, // $10.00
  lessonId?: string,
  instructorPayoutAmount: number = 850, // $8.50 (85% of $10)
  platformFeeAmount: number = 150, // $1.50 (15% of $10)
  payoutStatus: string = 'pending', // 'pending', 'transferred', 'failed'
  stripeProductId?: string,
  stripePriceId?: string,
  stripeTransferId?: string,
  isFree: boolean = false
) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      stripe_payment_id: stripePaymentId,
      amount,
      instructor_payout_amount: instructorPayoutAmount,
      platform_fee_amount: platformFeeAmount,
      payout_status: payoutStatus,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      stripe_transfer_id: stripeTransferId,
      is_free: isFree,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test purchase: ${error.message}`);
  }

  return data;
};

/**
 * Cleans up test data from Supabase after tests
 */
export const cleanupSupabaseTestData = async (
  userId?: string,
  instructorProfileId?: string,
  lessonId?: string,
  purchaseId?: string,
  videoId?: string
) => {
  try {
    if (purchaseId) {
      await supabase.from('purchases').delete().eq('id', purchaseId);
    }
    if (videoId) {
      await supabase.from('videos').delete().eq('id', videoId);
    }
    if (lessonId) {
      await supabase.from('lessons').delete().eq('id', lessonId);
    }
    if (instructorProfileId) {
      await supabase.from('instructor_profiles').delete().eq('id', instructorProfileId);
    }
    if (userId) {
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
    }
  } catch (error) {
    console.error('Error cleaning up Supabase test data:', error);
  }
};

/**
 * Validates that the given user has access to a lesson
 */
export const verifyLessonAccess = async (userId: string, lessonId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
};

/**
 * Logs test data to console for debugging
 */
export const logTestData = (
  testName: string,
  entityType: string,
  data: any,
  additionalInfo: Record<string, any> = {}
) => {
  console.log(`
    ======= TEST DATA =======
    Test: ${testName}
    Entity: ${entityType}
    ID: ${data.id}
    Time: ${new Date().toISOString()}
    Data: ${JSON.stringify(data, null, 2)}
    ${Object.entries(additionalInfo)
      .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
      .join('\n    ')}
    ===============================
  `);
};
