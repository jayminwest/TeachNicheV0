/**
 * Stripe API utilities
 * 
 * Functions for interacting with Stripe API and handling Stripe-related operations.
 */

import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stripe client instance for making API calls
 */
let stripe: Stripe;

/**
 * Initialize Stripe client with proper configuration
 * 
 * Uses the secret key from environment variables and configures
 * with app info and expected API version.
 */
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil", // Update to expected version
    appInfo: {
      name: "Teach Niche",
      version: "0.1.0",
    },
  });
} else {
  console.error("STRIPE_SECRET_KEY is missing. Stripe functionality will be limited.");
  // Create a placeholder to avoid null errors in development
  stripe = new Stripe('sk_test_placeholder', {
    apiVersion: "2025-03-31.basil",
  });
}

/**
 * Checks if Stripe is properly initialized with a valid API key
 * 
 * @returns Boolean indicating if Stripe client is initialized
 * 
 * @example
 * if (isStripeInitialized()) {
 *   // Safe to perform Stripe operations
 * }
 */
export function isStripeInitialized(): boolean {
  return Boolean(stripe);
}

/**
 * Fetches the latest Stripe account status and updates the database
 * 
 * @param supabase - Supabase client
 * @param userId - User ID in the application
 * @param stripeAccountId - Stripe Connect account ID
 * @returns The updated account status with detailed information
 * 
 * @example
 * const accountStatus = await syncStripeAccountStatus(supabase, userId, stripeAccountId);
 * if (accountStatus.accountEnabled) {
 *   // Account is ready to process payments
 * }
 */
export async function syncStripeAccountStatus(
  supabase: SupabaseClient, 
  userId: string, 
  stripeAccountId: string
): Promise<{
  accountId: string;
  accountEnabled: boolean;
  onboardingComplete: boolean;
  account: {
    email: string | null;
    business_type: Stripe.Account.BusinessType | null;
    country: string | null;
    default_currency: string | null;
  };
}> {
  try {
    if (!stripe) {
      throw new Error("Stripe is not initialized");
    }
    
    // Fetch the account details from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    // Check if the account is fully enabled
    const accountEnabled = account.charges_enabled && account.payouts_enabled;
    const onboardingComplete = account.details_submitted;
    
    // Update the database with the latest status
    await supabase
      .from("instructor_profiles")
      .update({
        stripe_account_enabled: accountEnabled,
        stripe_onboarding_complete: onboardingComplete,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    
    return {
      accountId: stripeAccountId,
      accountEnabled,
      onboardingComplete,
      account: {
        email: account.email,
        business_type: account.business_type,
        country: account.country,
        default_currency: account.default_currency,
      },
    };
  } catch (error) {
    console.error("Error syncing Stripe account status:", error);
    throw error;
  }
}

/**
 * Export the Stripe instance for direct access when needed
 */
export { stripe };
