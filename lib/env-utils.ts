/**
 * Environment variable validation and utilities
 */

// Required environment variables
const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'URL of your Supabase project',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Anonymous key for Supabase client',
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Publishable key for Stripe client',
  STRIPE_SECRET_KEY: 'Secret key for Stripe API',
  
  // Application
  NEXT_PUBLIC_SITE_URL: 'Base URL of your application',
}

// Optional environment variables with default values
const OPTIONAL_ENV_VARS = {
  STRIPE_APPLICATION_FEE_PERCENT: {
    default: '15',
    description: 'Platform fee percentage (0-100)',
  },
  NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URL: {
    default: (env: NodeJS.ProcessEnv) => `${env.NEXT_PUBLIC_SITE_URL}/dashboard/stripe-connect/success`,
    description: 'Redirect URL after Stripe Connect onboarding',
  },
  NODE_ENV: {
    default: 'development',
    description: 'Node environment (development, production, test)',
  },
}

/**
 * Validates all required environment variables
 * @returns An object with a valid flag and any missing variables
 */
export function validateEnv(): { valid: boolean; missing: string[]; message: string } {
  const missing = Object.keys(REQUIRED_ENV_VARS).filter(
    (envVar) => !process.env[envVar]
  )

  const valid = missing.length === 0
  const message = valid
    ? 'All required environment variables are set'
    : `Missing required environment variables: ${missing.join(', ')}`

  return { valid, missing, message }
}

/**
 * Gets an environment variable with fallback to default value
 * @param key The environment variable key
 * @param fallback Optional fallback value if not found
 * @returns The environment variable value or fallback
 */
export function getEnv(key: string, fallback?: string): string | undefined {
  const value = process.env[key]
  
  if (value) return value
  
  // Check if it's an optional variable with a default
  if (OPTIONAL_ENV_VARS[key as keyof typeof OPTIONAL_ENV_VARS]) {
    const optional = OPTIONAL_ENV_VARS[key as keyof typeof OPTIONAL_ENV_VARS]
    
    if (typeof optional.default === 'function') {
      return optional.default(process.env)
    }
    
    return optional.default
  }
  
  return fallback
}

/**
 * Checks if the current environment is production
 * @returns true if in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Checks if the current environment is development
 * @returns true if in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}

/**
 * Gets the current environment name
 * @returns The environment name (development, production, test)
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || 'development'
}

/**
 * Gets descriptive information about a required environment variable
 * @param key The environment variable key
 * @returns The description or undefined if not found
 */
export function getEnvDescription(key: string): string | undefined {
  return REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS] || 
         OPTIONAL_ENV_VARS[key as keyof typeof OPTIONAL_ENV_VARS]?.description
}

/**
 * Logs the current environment configuration (safe version without secrets)
 */
export function logEnvironment(): void {
  if (isDevelopment()) {
    console.log(`Environment: ${getEnvironment()}`)
    console.log(`Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`)
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`Using Stripe: ${!!process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`)
    
    const { valid, missing } = validateEnv()
    if (!valid) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`)
    }
  }
}

/**
 * Checks if the current context is during a build process (not at runtime)
 * Useful for conditionally disabling functionality when building without env vars
 */
export function isBuildTime(): boolean {
  // In build time, we don't have browser globals and certain env vars might be missing
  return (
    typeof window === 'undefined' && 
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

/**
 * Checks if required environment variables are set
 * Useful for feature flags based on environment configuration
 */
export function hasRequiredEnvVars(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const envUtils = {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment,
  getEnvironment,
  getEnvDescription,
  logEnvironment,
  isBuildTime,
  hasRequiredEnvVars,
};

export default envUtils;