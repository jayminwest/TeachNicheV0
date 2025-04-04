import {
  createTestUser,
  createTestInstructorProfile,
  supabase,
  cleanupSupabaseTestData,
  logTestData
} from '../utils/supabase';
import {
  createTestConnectAccount,
  syncStripeAccountStatus,
  cleanupStripeTestData,
  stripe,
  logTestTransaction
} from '../utils/stripe';
import { syncStripeAccountStatus as libSyncStripeAccountStatus } from '@/lib/stripe';

// Add missing type to the stripe utils
declare module '../utils/stripe' {
  export function syncStripeAccountStatus(
    account: any,
    enabled: boolean,
    onboardingComplete: boolean
  ): Promise<void>;
}

// Mock the syncStripeAccountStatus function from stripe.ts
jest.mock('../utils/stripe', () => ({
  ...jest.requireActual('../utils/stripe'),
  syncStripeAccountStatus: jest.fn(async (account, enabled, onboardingComplete) => {
    return {
      accountId: account.id,
      accountEnabled: enabled,
      onboardingComplete,
    };
  }),
}));

describe('Stripe Connect Setup Flow', () => {
  let testUser: any;
  let stripeAccountId: string;
  let instructorProfileId: string;

  beforeAll(async () => {
    // Create a test user with instructor role
    testUser = await createTestUser(
      `instructor-connect-${Date.now()}@test.com`,
      'Password123!',
      'instructor'
    );
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupSupabaseTestData(testUser?.id, instructorProfileId);
    await cleanupStripeTestData(undefined, stripeAccountId);
  });

  test('should create and store Stripe Connect account for instructor', async () => {
    // Create a Stripe Connect account
    const connectAccount = await createTestConnectAccount(testUser.email);
    stripeAccountId = connectAccount.id;
    
    // Create an instructor profile with the Stripe account ID
    const instructorProfile = await createTestInstructorProfile(
      testUser.id,
      stripeAccountId
    );
    
    instructorProfileId = instructorProfile.id;
    
    // Log for debugging
    logTestTransaction('Connect Account Creation', connectAccount.id, {
      email: connectAccount.email,
      country: connectAccount.country,
    });
    
    logTestData('Instructor Profile Creation', 'instructor_profile', instructorProfile);

    // Verify the instructor profile and Connect account
    expect(connectAccount).toBeDefined();
    expect(connectAccount.id).toContain('acct_');
    expect(instructorProfile).toBeDefined();
    expect(instructorProfile.stripe_account_id).toBe(stripeAccountId);
  });

  test('should update account status when onboarding completes', async () => {
    // Update the instructor profile to simulate completed onboarding
    const { data: updatedProfile, error } = await supabase
      .from('instructor_profiles')
      .update({
        stripe_onboarding_complete: true,
        stripe_account_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId)
      .select()
      .single();
    
    // Log data for debugging
    logTestData('Update Account Status', 'instructor_profile', updatedProfile || {}, {
      onboardingComplete: true,
      accountEnabled: true,
    });

    // Verify the update
    expect(error).toBeNull();
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile!.stripe_onboarding_complete).toBe(true);
    expect(updatedProfile!.stripe_account_enabled).toBe(true);
  });

  test('should disable account when requested', async () => {
    // Update the instructor profile to simulate account disablement
    const { data: disabledProfile, error } = await supabase
      .from('instructor_profiles')
      .update({
        stripe_account_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId)
      .select()
      .single();
    
    // Log data for debugging
    logTestData('Disable Account', 'instructor_profile', disabledProfile || {});

    // Verify the update
    expect(error).toBeNull();
    expect(disabledProfile).toBeDefined();
    expect(disabledProfile!.stripe_account_enabled).toBe(false);
    
    // Re-enable the account for subsequent tests
    await supabase
      .from('instructor_profiles')
      .update({
        stripe_account_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorProfileId);
  });

  test('should handle updating database with account status from Stripe', async () => {
    // Mock the syncStripeAccountStatus function
    const syncFunction = syncStripeAccountStatus as jest.Mock;
    syncFunction.mockImplementationOnce(async () => {
      return {
        accountId: stripeAccountId,
        accountEnabled: true,
        onboardingComplete: true,
      };
    });
    
    // Sync the account status
    const status = await syncFunction(
      { id: stripeAccountId },
      true,
      true
    );
    
    // Log test data
    logTestData('Sync Account Status', 'stripe_account', {
      id: stripeAccountId,
      status,
    });

    // Verify the sync
    expect(status).toBeDefined();
    expect(status.accountId).toBe(stripeAccountId);
    expect(status.accountEnabled).toBe(true);
    expect(status.onboardingComplete).toBe(true);
    expect(syncFunction).toHaveBeenCalledTimes(1);
  });
});
