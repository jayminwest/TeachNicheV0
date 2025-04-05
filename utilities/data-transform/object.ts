/**
 * Object transformation utilities
 * 
 * Functions for transforming and manipulating object data.
 */

/**
 * Removes null or undefined values from an object
 * 
 * @param obj - The object to clean
 * @returns New object with null/undefined values removed
 * 
 * @example
 * const cleanData = removeNullValues({ id: 1, name: 'John', age: null });
 * // Returns { id: 1, name: 'John' }
 */
export function removeNullValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  ) as Partial<T>;
}

/**
 * Picks specified keys from an object to create a new object
 * 
 * @param obj - Source object
 * @param keys - Array of keys to pick
 * @returns New object with only the specified keys
 * 
 * @example
 * const userData = { id: 1, name: 'Jane', email: 'jane@example.com', password: 'secret' };
 * const publicData = pick(userData, ['id', 'name']);
 * // Returns { id: 1, name: 'Jane' }
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Creates a new object by omitting specified keys from the source object
 * 
 * @param obj - Source object
 * @param keys - Array of keys to omit
 * @returns New object without the specified keys
 * 
 * @example
 * const userData = { id: 1, name: 'Jane', password: 'secret' };
 * const safeData = omit(userData, ['password']);
 * // Returns { id: 1, name: 'Jane' }
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;
}

/**
 * Deeply merges two objects recursively
 * 
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns Merged object
 * 
 * @example
 * const defaults = { theme: { color: 'blue', size: 'medium' } };
 * const userPrefs = { theme: { color: 'red' } };
 * const merged = deepMerge(defaults, userPrefs);
 * // Returns { theme: { color: 'red', size: 'medium' } }
 */
export function deepMerge<
  T extends Record<string, any>,
  S extends Record<string, any>
>(target: T, source: S): T & S {
  const output = { ...target } as T & S;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Checks if a value is an object (not null, not array)
 * 
 * @param item - Value to check
 * @returns Boolean indicating if the value is an object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
