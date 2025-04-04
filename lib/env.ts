/**
 * Centralized Environment Configuration
 * 
 * This module provides a single source of truth for all environment variables
 * used throughout the application. It includes validation using Zod and 
 * provides proper TypeScript types for each variable.
 */

import { z } from 'zod';

// Schema for Supabase environment variables
const supabaseEnvSchema = z.object({
  /**
   * The URL of your Supabase project
   * Required for both client and server components
   * Format: https://your-project-ref.supabase.co
   */
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL"
  }),

  /**
   * The anonymous key for your Supabase project
   * Required for client-side Supabase access
   */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
  }),

  /**
   * The service role key for your Supabase project
   * Required for server-side privileged operations
   * WARNING: This key has admin privileges - never expose it on the client
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: "SUPABASE_SERVICE_ROLE_KEY is required"
  }),

  /**
   * The database password for your Supabase project
   * Used for database migrations and direct database access
   */
  SUPABASE_DB_PASSWORD: z.string().min(1, {
    message: "SUPABASE_DB_PASSWORD is required"
  }),
});

// Schema for Stripe environment variables
const stripeEnvSchema = z.object({
  /**
   * The publishable key for your Stripe account
   * Required for client-side Stripe Elements and checkout
   * Format: pk_test_... (for test mode) or pk_live_... (for live mode)
   */
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"
  }),

  /**
   * The secret key for your Stripe account
   * Required for server-side Stripe API calls
   * WARNING: Never expose this key on the client
   * Format: sk_test_... (for test mode) or sk_live_... (for live mode)
   */
  STRIPE_SECRET_KEY: z.string().min(1, {
    message: "STRIPE_SECRET_KEY is required"
  }),

  /**
   * The webhook secret for Stripe events
   * Required for validating webhook signatures
   * Format: whsec_...
   */
  STRIPE_WEBHOOK_SECRET: z.string().min(1, {
    message: "STRIPE_WEBHOOK_SECRET is required"
  }),

  /**
   * The URL for the Stripe webhook endpoint
   * Format: https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   */
  STRIPE_WEBHOOK_URL: z.string().url({
    message: "STRIPE_WEBHOOK_URL must be a valid URL"
  }),
});

// Schema for Stripe Connect environment variables
const stripeConnectEnvSchema = z.object({
  /**
   * The client ID for Stripe Connect
   * Required for OAuth integration with instructors' Stripe accounts
   * Format: ca_...
   */
  STRIPE_CONNECT_CLIENT_ID: z.string().min(1, {
    message: "STRIPE_CONNECT_CLIENT_ID is required"
  }),

  /**
   * The redirect URL after successful Stripe Connect onboarding
   * Format: http://localhost:3000/dashboard/stripe-connect/success (development)
   * or https://your-domain.com/dashboard/stripe-connect/success (production)
   */
  NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URL: z.string().url({
    message: "NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URL must be a valid URL"
  }),

  /**
   * The ID of your platform Stripe account
   * Required for Stripe Connect operations
   * Format: acct_...
   */
  STRIPE_PLATFORM_ACCOUNT_ID: z.string().min(1, {
    message: "STRIPE_PLATFORM_ACCOUNT_ID is required"
  }),

  /**
   * The percentage fee your platform takes from transactions
   * Default: 15 (meaning 15%)
   */
  STRIPE_APPLICATION_FEE_PERCENT: z.string().transform(val => parseInt(val, 10))
    .pipe(z.number().min(0).max(100))
    .optional()
    .default("15"),
});

// Schema for Next.js environment variables
const nextEnvSchema = z.object({
  /**
   * The site URL
   * Used for generating absolute URLs
   * Format: http://localhost:3000 (development)
   * or https://your-domain.com (production)
   */
  NEXT_PUBLIC_SITE_URL: z.string().url({
    message: "NEXT_PUBLIC_SITE_URL must be a valid URL"
  }),

  /**
   * The redirect URL after authentication
   * Format: http://localhost:3000/auth/callback (development)
   * or https://your-domain.com/auth/callback (production)
   */
  NEXT_PUBLIC_AUTH_REDIRECT_URL: z.string().url({
    message: "NEXT_PUBLIC_AUTH_REDIRECT_URL must be a valid URL"
  }),

  /**
   * The current node environment
   * Used for conditional logic based on environment
   * Values: development, production, test
   */
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

// Additional environment variables that don't fit into other categories
const miscEnvSchema = z.object({
  /**
   * The base URL of your application on Vercel
   * Format: your-project-name.vercel.app
   * This is set automatically by Vercel
   */
  VERCEL_URL: z.string().optional(),

  /**
   * The URL of your application
   * A convenience variable that can be set explicitly instead of relying on VERCEL_URL
   * Format: https://your-domain.com
   */
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// Combine all schemas into one
const envSchema = z.object({
  ...supabaseEnvSchema.shape,
  ...stripeEnvSchema.shape,
  ...stripeConnectEnvSchema.shape,
  ...nextEnvSchema.shape,
  ...miscEnvSchema.shape,
});

// Create a type from the schema
export type Env = z.infer<typeof envSchema>;

/**
 * Function to load and validate environment variables
 * Will throw an error if required variables are missing or invalid
 */
function loadEnv(): Env {
  try {
    // Process environment variables and validate against schema
    const env = envSchema.parse(process.env);
    
    // Return validated environment variables
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment variables, check console for details');
    }
    
    throw error;
  }
}

// Export the validated environment variables
export const env = loadEnv();

// Export convenient groups of environment variables
export const supabaseEnv = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  dbPassword: env.SUPABASE_DB_PASSWORD,
};

export const stripeEnv = {
  publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  webhookUrl: env.STRIPE_WEBHOOK_URL,
};

export const stripeConnectEnv = {
  clientId: env.STRIPE_CONNECT_CLIENT_ID,
  redirectUrl: env.NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URL,
  platformAccountId: env.STRIPE_PLATFORM_ACCOUNT_ID,
  applicationFeePercent: env.STRIPE_APPLICATION_FEE_PERCENT,
};

export const nextEnv = {
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  authRedirectUrl: env.NEXT_PUBLIC_AUTH_REDIRECT_URL,
  nodeEnv: env.NODE_ENV,
  appUrl: env.NEXT_PUBLIC_APP_URL || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000'),
};

// Define constants that are derived from environment variables
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Export the environment configuration as default
export default env;
