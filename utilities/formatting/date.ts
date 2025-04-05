/**
 * Date formatting utilities
 * 
 * Functions for formatting and manipulating dates consistently
 * throughout the application.
 */

/**
 * Formats a date object or string into a localized date string
 * 
 * @param date - Date object or string to format
 * @param locale - Optional locale string (defaults to en-US)
 * @returns Formatted date string
 * 
 * @example
 * const formattedDate = formatDate(new Date());
 * // Returns "Apr 12, 2025"
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
}

/**
 * Formats a date with time into a localized string
 * 
 * @param date - Date object or string to format
 * @param locale - Optional locale string (defaults to en-US)
 * @returns Formatted date and time string
 * 
 * @example
 * const formattedDateTime = formatDateTime(new Date());
 * // Returns "Apr 12, 2025, 3:30 PM"
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(dateObj);
}

/**
 * Calculates the relative time between a date and now (e.g., "2 days ago")
 * 
 * @param date - Date object or string to calculate relative time from
 * @param locale - Optional locale string (defaults to en-US)
 * @returns Formatted relative time string
 * 
 * @example
 * const relativeTime = getRelativeTimeFromNow(new Date(Date.now() - 86400000));
 * // Returns "1 day ago"
 */
export function getRelativeTimeFromNow(
  date: Date | string,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  // Define time units
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  // Return appropriate relative format
  if (Math.abs(diffInSeconds) < minute) {
    return rtf.format(Math.round(diffInSeconds), 'second');
  } else if (Math.abs(diffInSeconds) < hour) {
    return rtf.format(Math.round(diffInSeconds / minute), 'minute');
  } else if (Math.abs(diffInSeconds) < day) {
    return rtf.format(Math.round(diffInSeconds / hour), 'hour');
  } else if (Math.abs(diffInSeconds) < week) {
    return rtf.format(Math.round(diffInSeconds / day), 'day');
  } else if (Math.abs(diffInSeconds) < month) {
    return rtf.format(Math.round(diffInSeconds / week), 'week');
  } else if (Math.abs(diffInSeconds) < year) {
    return rtf.format(Math.round(diffInSeconds / month), 'month');
  } else {
    return rtf.format(Math.round(diffInSeconds / year), 'year');
  }
}
