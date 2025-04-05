/**
 * UI Constants Entry Point
 * 
 * This file defines constants related to the user interface,
 * such as colors, sizes, animation durations, etc.
 */

/**
 * Toast notification durations in milliseconds
 */
export const ToastDuration = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
};

/**
 * Common z-index values for consistent layering
 */
export const ZIndex = {
  BACKGROUND: 0,
  DEFAULT: 1,
  DROPDOWN: 1000,
  STICKY: 1200,
  FIXED: 1300,
  DRAWER: 1400,
  MODAL: 1500,
  POPOVER: 1600,
  TOOLTIP: 1700,
  TOAST: 1800,
};

/**
 * Breakpoints for responsive design (in pixels)
 */
export const Breakpoints = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

/**
 * Animation durations in milliseconds
 */
export const AnimationDuration = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
};

/**
 * Media file size limits
 */
export const MediaSizeLimits = {
  IMAGE_MAX_SIZE_MB: 5,
  VIDEO_MAX_SIZE_MB: 500,
  THUMBNAIL_MAX_SIZE_MB: 2,
};

/**
 * Common UI messages
 */
export const UiMessages = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SUCCESS: 'Success!',
  ERROR: 'An error occurred',
  EMPTY_STATE: 'No items found',
};
