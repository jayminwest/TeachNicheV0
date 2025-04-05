# Utilities Directory

This directory contains centralized utility functions organized by their purpose. The utilities are structured to provide consistent, reusable functionality throughout the application.

## Directory Structure

- `/api` - API-related utilities
  - `error-handling.ts` - Error response and handling utilities
  - `request.ts` - Request parsing and response utilities
  - `stripe.ts` - Stripe API utilities
  
- `/data-transform` - Data transformation utilities
  - `array.ts` - Array manipulation functions
  - `object.ts` - Object transformation functions
  
- `/file` - File handling utilities
  - `storage.ts` - Storage operations utilities
  - `video.ts` - Video file handling utilities
  
- `/formatting` - Formatting utilities
  - `currency.ts` - Currency formatting and calculation
  - `date.ts` - Date formatting
  - `string.ts` - String formatting and manipulation
  - `ui.ts` - UI class name utilities
  
- `/validation` - Validation utilities
  - `file-validation.ts` - File validation utilities
  - `input-validation.ts` - Input validation utilities

## Usage

You can import utilities in two ways:

### 1. From the main utilities index (recommended for most cases)

```typescript
import { formatPrice, isValidVideoFormat } from '@/utilities';
```

### 2. From specific subdirectory (when you need only a specific category)

```typescript
import { formatPrice } from '@/utilities/formatting';
import { isValidVideoFormat } from '@/utilities/validation';
```

### 3. From specific file (when you need precise imports)

```typescript
import { formatPrice } from '@/utilities/formatting/currency';
import { isValidVideoFormat } from '@/utilities/validation/file-validation';
```

## Best Practices

1. **Add JSDoc comments** to all new utility functions with examples.
2. **Include TypeScript types** for parameters and return values.
3. **Write unit tests** for each utility function in the corresponding test file.
4. **Keep utilities pure** - avoid side effects when possible.
5. **Maintain organization** - add new utilities to the appropriate category.

## Testing

Utility tests are located in the `/utilities/tests` directory. Run tests using:

```bash
npm test
```

## Adding New Utilities

1. Add the utility to the appropriate subdirectory
2. Export it from the subdirectory's index.ts
3. Add JSDoc comments with examples
4. Add tests in the corresponding test file
5. Update this README if adding a new category
