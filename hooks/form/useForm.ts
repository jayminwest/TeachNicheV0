/**
 * @file Custom form handling hook
 * @description Provides form state management with validation, submission handling,
 * and error management for form components.
 */

import { useState, useCallback, FormEvent } from 'react';

/**
 * Form values type - a record of string keys to any value
 */
export type FormValues = Record<string, any>;

/**
 * Validation errors type - a record of field names to error messages
 */
export type ValidationErrors = Partial<Record<string, string>>;

/**
 * Form validation function type
 */
export type ValidateFn<T extends FormValues> = (values: T) => ValidationErrors;

/**
 * Form submission handler type
 */
export type SubmitHandler<T extends FormValues> = (values: T) => Promise<void> | void;

/**
 * Hook parameters for useForm
 */
export interface UseFormParams<T extends FormValues> {
  /** Initial form values */
  initialValues: T;
  /** Optional validation function */
  validate?: ValidateFn<T>;
  /** Form submission handler */
  onSubmit: SubmitHandler<T>;
}

/**
 * Hook return type for useForm
 */
export interface UseFormResult<T extends FormValues> {
  /** Current form values */
  values: T;
  /** Form errors by field name */
  errors: ValidationErrors;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether the form has been touched */
  touched: Record<keyof T, boolean>;
  /** Set a specific form value */
  setValue: (name: keyof T, value: any) => void;
  /** Handle form submission */
  handleSubmit: (e: FormEvent) => void;
  /** Handle field change */
  handleChange: (e: { target: { name: string; value: any } }) => void;
  /** Handle field blur to mark as touched */
  handleBlur: (name: keyof T) => void;
  /** Reset form to initial values */
  resetForm: () => void;
}

/**
 * Custom hook for form state management with validation
 * 
 * @example
 * ```tsx
 * const LoginForm = () => {
 *   const { 
 *     values, 
 *     handleChange, 
 *     handleSubmit, 
 *     errors, 
 *     isSubmitting 
 *   } = useForm({
 *     initialValues: { email: '', password: '' },
 *     validate: (values) => {
 *       const errors: ValidationErrors = {};
 *       if (!values.email) errors.email = 'Email is required';
 *       if (!values.password) errors.password = 'Password is required';
 *       return errors;
 *     },
 *     onSubmit: async (values) => {
 *       try {
 *         await loginUser(values);
 *         router.push('/dashboard');
 *       } catch (err) {
 *         console.error('Login failed:', err);
 *       }
 *     }
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         name="email"
 *         value={values.email}
 *         onChange={handleChange}
 *       />
 *       {errors.email && <p>{errors.email}</p>}
 *       
 *       <input
 *         type="password"
 *         name="password"
 *         value={values.password}
 *         onChange={handleChange}
 *       />
 *       {errors.password && <p>{errors.password}</p>}
 *       
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Logging in...' : 'Log In'}
 *       </button>
 *     </form>
 *   );
 * };
 * ```
 * 
 * @param params Form configuration parameters
 * @returns Form state and handlers
 */
export function useForm<T extends FormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseFormParams<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(() => {
    // Initialize all fields as untouched
    const touchedState = {} as Record<keyof T, boolean>;
    Object.keys(initialValues).forEach((key) => {
      touchedState[key as keyof T] = false;
    });
    return touchedState;
  });

  const validateForm = useCallback(() => {
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  }, [values, validate]);

  const handleChange = useCallback((e: { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate on blur if validate function exists
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  }, [validate, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
    
    // Reset touched state
    const resetTouched = {} as Record<keyof T, boolean>;
    Object.keys(initialValues).forEach((key) => {
      resetTouched[key as keyof T] = false;
    });
    setTouched(resetTouched);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      
      const isValid = validateForm();
      
      if (!isValid) {
        // Mark all fields as touched when there's a submission attempt with errors
        const allTouched = {} as Record<keyof T, boolean>;
        Object.keys(initialValues).forEach((key) => {
          allTouched[key as keyof T] = true;
        });
        setTouched(allTouched);
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [initialValues, onSubmit, validateForm, values]
  );

  return {
    values,
    errors,
    isSubmitting,
    touched,
    setValue,
    handleChange,
    handleSubmit,
    handleBlur,
    resetForm,
  };
}
