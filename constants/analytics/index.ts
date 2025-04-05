/**
 * Analytics Constants
 * 
 * This file defines constants related to analytics tracking, 
 * including event names, properties, and dimensions.
 */

/**
 * User action events to track
 */
export const AnalyticsEvents = {
  // Page view events
  PAGE_VIEW: 'page_view',
  
  // User authentication events
  AUTH: {
    SIGN_UP: 'sign_up',
    SIGN_IN: 'sign_in',
    SIGN_OUT: 'sign_out',
    PASSWORD_RESET: 'password_reset',
    PROFILE_UPDATE: 'profile_update',
  },
  
  // Content interaction events
  CONTENT: {
    LESSON_VIEW: 'lesson_view',
    VIDEO_PLAY: 'video_play',
    VIDEO_COMPLETE: 'video_complete',
    VIDEO_PROGRESS: 'video_progress',
    SEARCH: 'search',
    FILTER_APPLY: 'filter_apply',
  },
  
  // Purchase funnel events
  PURCHASE: {
    CHECKOUT_START: 'checkout_start',
    CHECKOUT_COMPLETE: 'checkout_complete',
    PAYMENT_ERROR: 'payment_error',
  },
  
  // Instructor events
  INSTRUCTOR: {
    LESSON_CREATE: 'lesson_create',
    VIDEO_UPLOAD: 'video_upload',
    CONNECT_SETUP: 'stripe_connect_setup',
    PAYOUT_RECEIVED: 'payout_received',
  },
};

/**
 * Common properties to include with analytics events
 */
export const AnalyticsProperties = {
  // User properties
  USER: {
    ID: 'user_id',
    TYPE: 'user_type',
    SIGNUP_DATE: 'signup_date',
  },
  
  // Content properties
  CONTENT: {
    LESSON_ID: 'lesson_id',
    LESSON_TITLE: 'lesson_title',
    VIDEO_ID: 'video_id',
    VIDEO_TITLE: 'video_title',
    CATEGORY: 'category',
    DURATION: 'duration',
    PROGRESS_PERCENT: 'progress_percent',
  },
  
  // Purchase properties
  PURCHASE: {
    TRANSACTION_ID: 'transaction_id',
    AMOUNT: 'amount',
    CURRENCY: 'currency',
    ITEM_ID: 'item_id',
    ITEM_NAME: 'item_name',
    PAYMENT_METHOD: 'payment_method',
  },
};

/**
 * Analytics dimensions for data segmentation
 */
export const AnalyticsDimensions = {
  DEVICE_TYPE: 'device_type',
  BROWSER: 'browser',
  OPERATING_SYSTEM: 'operating_system',
  COUNTRY: 'country',
  LANGUAGE: 'language',
  REFERRER: 'referrer',
  UTM_SOURCE: 'utm_source',
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
};
