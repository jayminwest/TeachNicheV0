/**
 * String formatting utilities
 * 
 * Functions for formatting and manipulating strings consistently.
 */

/**
 * Capitalizes the first letter of each word in a string
 * 
 * @param str - The string to capitalize
 * @returns String with first letter of each word capitalized
 * 
 * @example
 * const title = capitalizeWords('hello world');
 * // Returns "Hello World"
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Truncates a string with ellipsis if it exceeds the max length
 * 
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 * 
 * @example
 * const shortDescription = truncateString('This is a very long description that needs to be shortened', 20);
 * // Returns "This is a very long..."
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Removes HTML tags from a string
 * 
 * @param html - String that may contain HTML tags
 * @returns String with all HTML tags removed
 * 
 * @example
 * const plainText = stripHtml('<p>This has <strong>HTML</strong> tags</p>');
 * // Returns "This has HTML tags"
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // Create a DOM element to safely parse the HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Converts a string to slug format (lowercase, hyphens instead of spaces)
 * 
 * @param str - The string to convert to slug
 * @returns Slugified string
 * 
 * @example
 * const slug = slugify('This is a Title!');
 * // Returns "this-is-a-title"
 */
export function slugify(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
