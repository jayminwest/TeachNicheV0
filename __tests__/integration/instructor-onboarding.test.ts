import {
  createTestUser,
  createTestInstructorProfile,
  supabase,
  cleanupSupabaseTestData,
  logTestData
} from '../utils/supabase';
import {
  createTestConnectAccount,
  createTestAccountLink,
  cleanupStripeTestData,
  logTestTransaction
} from '../utils/stripe';

describe('Instructor Onboarding Flow', () => {
  let testUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;

  beforeAll(async () => {
    // Create a test user with instructor role
    testUser = await createTestUser(
      `instructor-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupSupabaseTestData(testUser?.id, instructorProfileId);
    await cleanupStripeTestData(undefined, stripeAccountId);
  });

  test('should create a Stripe Connect account for an instructor', async () => {
    // Create a Stripe Connect account
    const connectAccount = await createTestConnectAccount(testUser.email);
    stripeAccountId = connectAccount.id;
    
    // Log transaction for debugging
    logTestTransaction('Create Stripe Connect Account', connectAccount.id, {
      email: connectAccount.email,
      country: connectAccount.country,
      created: new Date(connectAccount.created * 1000).toISOString(),
    });

    // Verify the Connect account was created
    expect(connectAccount).toBeDefined();
    expect(connectAccount.id).toContain('acct_');
    expect(connectAccount.type).toBe('express');
    expect(connectAccount.email).toBe(testUser.email);
  });

  test('should store Stripe account ID in instructor profile', async () => {
    // Create an instructor profile with the Stripe account ID
    const instructorProfile = await createTestInstructorProfile(
      testUser.id,
      stripeAccountId,
      false, // account not enabled yet
      false // onboarding not complete yet
    );
    
    instructorProfileId = instructorProfile.id;
    
    // Log data for debugging
    logTestData('Create Instructor Profile', 'instructor_profile', instructorProfile);

    // Verify the instructor profile
    expect(instructorProfile).toBeDefined();
    expect(instructorProfile.user_id).toBe(testUser.id);
    expect(instructorProfile.stripe_account_id).toBe(stripeAccountId);
    expect(instructorProfile.stripe_account_enabled).toBe(false);
    expect(instructorProfile.stripe_onboarding_complete).toBe(false);
  });

  test('should create an account link for onboarding', async () => {
    // Create an account link for onboarding
    const accountLink = await createTestAccountLink(stripeAccountId);
    
    // Log transaction for debugging
    logTestTransaction('Create Account Link', accountLink.object, {
      url: accountLink.url,
      created: new Date().toISOString(),
    });

    // Verify the account link
    expect(accountLink).toBeDefined();
    expect(accountLink.url).toContain('https://connect.stripe.com/');
    expect(accountLink.object).toBe('account_link');
  });

  test('should update onboarding status in database', async () => {
    // Update the instructor profile to simulate completed onboarding
    const { data: updatedProfile, error } = await supabase
      .from('instructor_profiles')
      .update({
        stripe_onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId)
      .select()
      .single();
    
    // Log data for debugging
    logTestData('Update Onboarding Status', 'instructor_profile', updatedProfile || {});

    // Verify the update
    expect(error).toBeNull();
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile!.stripe_onboarding_complete).toBe(true);
  });
});
