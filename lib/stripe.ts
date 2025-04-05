import Stripe from "stripe"
import { 
  STRIPE_API_VERSION, 
  APP_NAME, 
  APP_VERSION,
  PLATFORM_FEE_PERCENTAGE 
} from "@/constants/app"

// Initialize Stripe
let stripe: Stripe;

// Only initialize if we have a key
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    appInfo: {
      name: APP_NAME,
      version: APP_VERSION,
    },
  });
} else {
  console.error("STRIPE_SECRET_KEY is missing. Stripe functionality will be limited.");
  // Create a placeholder to avoid null errors
  stripe = new Stripe('sk_test_placeholder', {
    apiVersion: STRIPE_API_VERSION,
  });
}

export { stripe }

// Export Stripe-related constants
export { PLATFORM_FEE_PERCENTAGE } from "@/constants/app"
export { INSTRUCTOR_PERCENTAGE } from "@/constants/app"

// Helper function to calculate fee amounts
export function calculateFees(amount: number) {
  const platformFee = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100)
  const instructorAmount = amount - platformFee

  return {
    platformFee,
    instructorAmount,
  }
}

// Safe function to check if Stripe is initialized
export function isStripeInitialized(): boolean {
  return stripe !== null
}

/**
 * Fetches the latest Stripe account status and updates the database
 * @param supabase Supabase client
 * @param userId User ID
 * @param stripeAccountId Stripe account ID
 * @returns The updated account status
 */
export async function syncStripeAccountStatus(supabase: any, userId: string, stripeAccountId: string) {
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
