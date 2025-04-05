/**
 * Feature Flags
 * 
 * This file defines feature flags used to enable or disable specific features
 * across the application. Feature flags allow for easier testing and 
 * gradual rollout of new functionality.
 * 
 * Environment-specific overrides can be defined using environment variables.
 */

/**
 * Helper function to get a feature flag value with environment override support
 * @param defaultValue The default value for the feature flag
 * @param envKey The environment variable key that can override the default
 * @returns The resolved feature flag value
 */
const getFeatureFlag = (defaultValue: boolean, envKey: string): boolean => {
  const envValue = process.env[envKey];
  if (envValue === undefined) return defaultValue;
  return envValue.toLowerCase() === 'true';
};

/**
 * Available feature flags
 */
export const FeatureFlags = {
  /**
   * Enable multi-currency support for payments
   */
  MULTI_CURRENCY_SUPPORT: getFeatureFlag(
    false, 
    'NEXT_PUBLIC_FEATURE_MULTI_CURRENCY'
  ),
  
  /**
   * Enable advanced analytics tracking
   */
  ADVANCED_ANALYTICS: getFeatureFlag(
    false, 
    'NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS'
  ),
  
  /**
   * Enable subscription-based payment model
   */
  SUBSCRIPTION_MODEL: getFeatureFlag(
    false, 
    'NEXT_PUBLIC_FEATURE_SUBSCRIPTION_MODEL'
  ),
  
  /**
   * Enable social login options (Google, Facebook, etc.)
   */
  SOCIAL_LOGIN: getFeatureFlag(
    false, 
    'NEXT_PUBLIC_FEATURE_SOCIAL_LOGIN'
  ),
  
  /**
   * Enable course bundling features
   */
  COURSE_BUNDLING: getFeatureFlag(
    false, 
    'NEXT_PUBLIC_FEATURE_COURSE_BUNDLING'
  ),
  
  /**
   * Enable instructor dashboard analytics
   */
  INSTRUCTOR_ANALYTICS: getFeatureFlag(
    true, 
    'NEXT_PUBLIC_FEATURE_INSTRUCTOR_ANALYTICS'
  ),
};

/**
 * Helper to check if a feature is enabled
 * @param feature The feature flag to check
 * @returns True if the feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FeatureFlags): boolean => {
  return FeatureFlags[feature];
};
