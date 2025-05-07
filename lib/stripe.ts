import Stripe from "stripe"
import { getEnv, isDevelopment } from "./env-utils"

// Initialize Stripe
let stripe: Stripe;

// Only initialize if we have a key
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil", // Update to expected version
    appInfo: {
      name: "Teach Niche",
      version: "0.1.0",
      // AppInfo doesn't support environment in the type definition
    },
  });
  
  if (isDevelopment()) {
    console.log(`🔌 Stripe initialized in ${isDevelopment() ? 'TEST' : 'LIVE'} mode`);
  }
} else {
  console.error("STRIPE_SECRET_KEY is missing. Stripe functionality will be limited.");
  // Create a placeholder to avoid null errors
  stripe = new Stripe('sk_test_placeholder', {
    apiVersion: "2025-03-31.basil", // Update to expected version
  });
}

export { stripe }

// Constants for the platform fee percentage - read from env with fallback
export const PLATFORM_FEE_PERCENTAGE = parseInt(getEnv('STRIPE_APPLICATION_FEE_PERCENT', '15') || '15', 10)
export const INSTRUCTOR_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE

// Standard Stripe processing fee in the US
export const STRIPE_PERCENTAGE_FEE = 2.9
export const STRIPE_FIXED_FEE_CENTS = 30

// Helper function to calculate fee amounts
export function calculateFees(amount: number) {
  // First calculate the Stripe fee for the whole transaction
  const stripeFeePercentage = Math.round((amount * STRIPE_PERCENTAGE_FEE) / 100);
  const totalStripeFee = stripeFeePercentage + STRIPE_FIXED_FEE_CENTS;
  
  // Calculate how much remains after Stripe takes their fee
  const amountAfterStripeFee = amount - totalStripeFee;
  
  // Calculate the platform's share of the remaining amount
  // The platform gets 15% of the base price (before Stripe fees)
  const basePrice = Math.round(amount / (1 + STRIPE_PERCENTAGE_FEE/100) - STRIPE_FIXED_FEE_CENTS);
  const basePlatformFee = Math.round((basePrice * PLATFORM_FEE_PERCENTAGE) / 100);
  
  // Calculate the platform's proportion of the total amount and apply to Stripe fees
  const platformProportion = basePlatformFee / basePrice;
  const platformShareOfStripeFee = Math.round(totalStripeFee * platformProportion);
  
  // The platform fee includes both the base fee and the platform's share of Stripe fees
  const platformFeeWithStripeCosts = basePlatformFee + platformShareOfStripeFee;
  
  // The instructor gets the remainder (automatically accounts for rounding errors)
  const instructorAmount = amount - platformFeeWithStripeCosts;
  
  return {
    platformFee: platformFeeWithStripeCosts,
    instructorAmount,
  }
}

// Calculate price with Stripe fees included
// This allows us to pass the Stripe fees to the customer
export function calculatePriceWithStripeFees(basePrice: number): number {
  // Formula: (base_price + fixed_fee) / (1 - percentage_fee/100)
  const priceWithFees = (basePrice + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENTAGE_FEE / 100)
  // Round to 2 decimal places and convert to cents
  return Math.round(priceWithFees)
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

