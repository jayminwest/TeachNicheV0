# Custom React Hooks

This document provides an overview of the custom React hooks in the TeachNiche application. Our hooks are organized into categories to improve maintainability and reusability.

## Hook Directory Structure

Hooks are organized into the following categories:

```
hooks/
├── auth/         # Authentication-related hooks
├── form/         # Form handling hooks
├── data/         # Data fetching and state management hooks
├── ui/           # UI interaction and animation hooks
├── media/        # Media handling hooks
└── index.ts      # Main export file
```

## Importing Hooks

Hooks can be imported individually from their specific files or categories, or from the main hooks index:

```tsx
// Import from specific files
import { useAuth } from '@/hooks/auth/useAuth';
import { useForm } from '@/hooks/form/useForm';

// Import from categories
import { useAuth } from '@/hooks/auth';
import { useForm } from '@/hooks/form';

// Import from main index (recommended)
import { useAuth, useForm, useSupabaseQuery } from '@/hooks';
```

## Available Hooks

### Authentication Hooks

- **useAuth**: Manages user authentication state with Supabase Auth.
  ```tsx
  const { user, session, loading, error, signOut } = useAuth();
  ```

### Form Hooks

- **useForm**: Provides form state management, validation, and submission handling.
  ```tsx
  const { 
    values, handleChange, handleSubmit, errors, 
    isSubmitting, touched, handleBlur, resetForm 
  } = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors = {};
      if (!values.email) errors.email = 'Email is required';
      return errors;
    },
    onSubmit: async (values) => {
      // Submit form data
    }
  });
  ```

### Data Hooks

- **useSupabaseQuery**: Streamlines data fetching from Supabase with loading and error states.
  ```tsx
  const { data, loading, error, refetch } = useSupabaseQuery(
    (supabase) => supabase.from('lessons').select('*')
  );
  ```

### UI Hooks

- **useIsMobile**: Detects if the viewport is mobile-sized.
  ```tsx
  const isMobile = useIsMobile();
  ```

- **useToast**: Manages toast notifications throughout the application.
  ```tsx
  const { toast } = useToast();
  
  toast({
    title: "Success",
    description: "Operation completed successfully",
    variant: "default"
  });
  ```

### Media Hooks

- **useVideoUpload**: Handles video file uploads to Supabase storage.
  ```tsx
  const { 
    uploadVideo, progress, uploading, 
    error, videoMetadata, reset 
  } = useVideoUpload({
    bucketName: 'videos',
    folderPath: 'user-uploads/'
  });
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadVideo(file);
    }
  };
  ```

## Best Practices

1. **Hook Naming Convention**: All hooks should follow the `useXxx` naming convention.

2. **TypeScript Interfaces**: Define clear TypeScript interfaces for hook parameters and return values.

3. **Error Handling**: Include proper error handling in hooks that perform operations that might fail.

4. **Documentation**: Add JSDoc comments to all hooks, including examples of usage.

5. **Single Responsibility**: Each hook should have a single, well-defined responsibility.

6. **Composition**: Prefer composing primitive hooks rather than creating complex hooks that do too much.

7. **Memoization**: Use `useCallback` and `useMemo` to prevent unnecessary rerenders.

## Creating New Hooks

When creating a new hook:

1. Add it to the appropriate category folder based on its purpose.
2. Follow the naming convention: `useXxx.ts`.
3. Add comprehensive JSDoc comments with usage examples.
4. Define TypeScript interfaces for parameters and return values.
5. Export the hook from the category index file.
6. The main hooks index will automatically include it through the category export.

## Hook Conventions Reference

### Standard Hook Template

```tsx
/**
 * @file [Hook name] hook
 * @description [Brief description of what the hook does and when to use it]
 */

import { useState, useEffect } from 'react';

/**
 * Hook parameters
 */
export interface UseXxxParams {
  // Parameter definitions
}

/**
 * Hook return value
 */
export interface UseXxxResult {
  // Return value definitions
}

/**
 * [Detailed description of the hook]
 * 
 * @example
 * ```tsx
 * // Usage example
 * ```
 * 
 * @param params - Hook parameters
 * @returns Hook result
 */
export function useXxx(params: UseXxxParams): UseXxxResult {
  // Hook implementation
}
```
