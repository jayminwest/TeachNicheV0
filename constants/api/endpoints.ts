/**
 * API Endpoints
 * 
 * This file defines all API endpoint paths used throughout the application.
 * Centralizing these values makes it easier to update API paths if needed.
 */

/**
 * Internal API endpoints
 */
export const ApiEndpoints = {
  // Auth related endpoints
  AUTH: {
    SIGN_IN: '/api/auth/sign-in',
    SIGN_UP: '/api/auth/sign-up',
    SIGN_OUT: '/api/auth/sign-out',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Checkout related endpoints
  CHECKOUT: {
    CREATE: '/api/checkout',
    VIDEO: '/api/checkout/video',
    LESSON: '/api/checkout-lesson',
    VERIFY_PURCHASE: '/api/verify-purchase',
    VERIFY_LESSON_PURCHASE: '/api/verify-lesson-purchase',
  },
  
  // Stripe related endpoints
  STRIPE: {
    ACCOUNT_STATUS: '/api/stripe/account-status',
    CREATE_CONNECT_ACCOUNT: '/api/stripe/create-connect-account',
    CREATE_LOGIN_LINK: '/api/stripe/create-login-link',
    CREATE_PRODUCT: '/api/stripe/create-product',
    WEBHOOKS: '/api/webhooks/stripe',
  },
  
  // Video related endpoints
  VIDEO: {
    GET_URL: '/api/get-video-url',
  },
  
  // Admin related endpoints
  ADMIN: {
    SETUP_STORAGE: '/api/setup-storage',
    SETUP_RLS_POLICIES: '/api/setup-rls-policies',
  },
};

/**
 * Supabase table names
 */
export const DatabaseTables = {
  LESSONS: 'lessons',
  VIDEOS: 'videos',
  PURCHASES: 'purchases',
  INSTRUCTOR_PROFILES: 'instructor_profiles',
  USERS: 'users',
};
