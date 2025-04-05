# Constants Management Guide

This guide outlines how constants are organized and used throughout the Teach Niche application.

## Directory Structure

Constants are organized in a dedicated `constants/` directory with subdirectories based on domain:

```
constants/
├── index.ts             # Main barrel file
├── app/                 # Application-wide constants
│   ├── index.ts         # App constants barrel file
│   └── payment.ts       # Payment-specific constants
├── api/                 # API-related constants
│   ├── index.ts         # API constants barrel file
│   ├── endpoints.ts     # API endpoint paths
│   └── http-status.ts   # HTTP status codes
├── ui/                  # UI-related constants
│   └── index.ts         # UI constants barrel file
├── validation/          # Validation rules and messages
│   └── index.ts         # Validation constants barrel file
├── feature-flags/       # Feature flags and toggles
│   └── index.ts         # Feature flags barrel file
└── analytics/           # Analytics event names and properties
    └── index.ts         # Analytics constants barrel file
```

## Naming Conventions

We follow these naming conventions for constants:

- **UPPER_CASE**: For simple primitive constants
  ```typescript
  export const MAX_FILE_SIZE = 5000000;
  export const DEFAULT_CURRENCY = 'usd';
  ```

- **PascalCase**: For enum-like objects and TypeScript enums
  ```typescript
  export enum UserRole {
    STUDENT = 'student',
    INSTRUCTOR = 'instructor',
    ADMIN = 'admin',
  }
  
  export const ApiEndpoints = {
    AUTH: {
      SIGN_IN: '/api/auth/sign-in',
      // ...
    },
    // ...
  };
  ```

## How to Import Constants

### Preferred Method: Use Barrel Files

The preferred way to import constants is through the barrel files to keep imports clean and consistent.

```typescript
// Import all constants from a specific domain
import { UserRole, PLATFORM_FEE_PERCENTAGE } from '@/constants/app';

// Import specific constants groups
import { HttpStatusCode, ApiEndpoints } from '@/constants/api';

// Import all constants (use sparingly to avoid large imports)
import { UserRole, HttpStatusCode, ValidationMessages } from '@/constants';
```

## Adding New Constants

When adding new constants:

1. Identify the appropriate subdirectory based on the constant's domain
2. Follow the naming conventions (UPPER_CASE or PascalCase)
3. Add comprehensive JSDoc comments to document purpose and usage
4. Update the barrel file if needed
5. Group related constants in objects or enums when appropriate

Example:

```typescript
/**
 * Maximum number of videos allowed per lesson
 */
export const MAX_VIDEOS_PER_LESSON = 10;

/**
 * Lesson status enum
 */
export enum LessonStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
```

## Best Practices

- **No Magic Values**: Never use "magic" strings or numbers directly in code. Always reference a named constant.
- **Documentation**: Always add JSDoc comments to explain what the constant represents.
- **Group Related Constants**: Use objects or enums to group related constants.
- **Environment Configuration**: For values that should be configurable based on environment, use the `getFeatureFlag` helper function.
- **Avoid Duplication**: Don't create multiple constants for the same value; instead, import the constant from its primary location.

## Feature Flags

The `feature-flags` module provides a system for toggling features. Feature flags can be:

1. Controlled through environment variables (via `.env` files)
2. Toggled at runtime for testing or gradual rollout

Example usage:

```typescript
import { isFeatureEnabled, FeatureFlags } from '@/constants/feature-flags';

// Check if a feature is enabled
if (isFeatureEnabled('MULTI_CURRENCY_SUPPORT')) {
  // Show multi-currency options
}
```

To define a new feature flag, add it to the `FeatureFlags` object in `constants/feature-flags/index.ts`.
