/**
 * Input validation utilities
 * 
 * Functions for validating user input, form data, and request parameters.
 */

/**
 * Validates an email address format
 * 
 * @param email - The email address to validate
 * @returns Boolean indicating if the email format is valid
 * 
 * @example
 * if (isValidEmail('user@example.com')) {
 *   // Process valid email
 * }
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Basic email validation regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validates a URL format
 * 
 * @param url - The URL to validate
 * @returns Boolean indicating if the URL format is valid
 * 
 * @example
 * if (isValidUrl('https://example.com')) {
 *   // Process valid URL
 * }
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Use URL constructor for validation
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validates if a string meets minimum length requirements
 * 
 * @param str - The string to check
 * @param minLength - Minimum required length
 * @returns Boolean indicating if the string meets the minimum length
 * 
 * @example
 * if (meetsMinLength(password, 8)) {
 *   // Password is long enough
 * }
 */
export function meetsMinLength(str: string, minLength: number): boolean {
  if (!str) return false;
  return str.length >= minLength;
}

/**
 * Validates if a value is within a numeric range
 * 
 * @param value - The number to check
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Boolean indicating if the value is within range
 * 
 * @example
 * if (isInRange(age, 18, 65)) {
 *   // Age is within valid range
 * }
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates if a price value is valid for processing
 * 
 * @param price - The price to validate
 * @returns Boolean indicating if the price is valid
 * 
 * @example
 * if (isValidPrice(product.price)) {
 *   // Price is valid for checkout
 * }
 */
export function isValidPrice(price: number): boolean {
  // Price must be a number, greater than zero, and have max 2 decimal places
  if (typeof price !== 'number' || price <= 0) return false;
  
  // Check decimal places (convert to string and check after decimal)
  const priceStr = price.toString();
  const decimalPart = priceStr.includes('.') ? priceStr.split('.')[1] : '';
  return decimalPart.length <= 2;
}
