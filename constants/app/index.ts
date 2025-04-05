/**
 * Application-wide Constants Entry Point
 * 
 * This file serves as the barrel file for application-wide constants
 * to provide a clean import interface.
 */

export * from './payment';

/**
 * Application name used in various places like titles, headers, and metadata
 */
export const APP_NAME = 'Teach Niche';

/**
 * Current application version
 */
export const APP_VERSION = '0.1.0';

/**
 * Application base URL based on environment
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * User roles within the application
 */
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

/**
 * Application routes
 */
export const Routes = {
  HOME: '/',
  ABOUT: '/about',
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: {
    INDEX: '/dashboard',
    PROFILE: '/dashboard/profile',
    LESSONS: '/dashboard/lessons',
    CREATE_LESSON: '/dashboard/create-lesson',
    ADD_VIDEOS: '/dashboard/add-videos-to-lesson',
    UPLOAD: '/dashboard/upload',
    STRIPE_CONNECT: '/dashboard/stripe-connect',
  },
  LESSONS: {
    INDEX: '/lessons',
    DETAIL: (id: string) => `/lessons/${id}`,
  },
  VIDEOS: {
    DETAIL: (id: string) => `/videos/${id}`,
  },
  LIBRARY: '/library',
  CHECKOUT: {
    SUCCESS: '/checkout/success',
    LESSON_SUCCESS: '/checkout/lesson-success',
  },
  LEGAL: {
    PRIVACY: '/legal/privacy',
    TERMS: '/legal/terms',
  },
  ADMIN: {
    SETUP: '/admin/setup',
  },
};
