/**
 * Array transformation utilities
 * 
 * Functions for transforming and manipulating array data.
 */

/**
 * Chunks an array into smaller arrays of specified size
 * 
 * @param array - The array to chunk
 * @param size - The size of each chunk
 * @returns Array of chunks
 * 
 * @example
 * const chunked = chunk([1, 2, 3, 4, 5], 2);
 * // Returns [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce((result, item, index) => {
    const chunkIndex = Math.floor(index / size);
    
    if (!result[chunkIndex]) {
      result[chunkIndex] = []; // Start a new chunk
    }
    
    result[chunkIndex].push(item);
    return result;
  }, [] as T[][]);
}

/**
 * Groups an array of objects by a specific key
 * 
 * @param array - Array of objects to group
 * @param key - Key to group by
 * @returns Object with grouped items
 * 
 * @example
 * const users = [
 *   { id: 1, role: 'admin', name: 'Alice' },
 *   { id: 2, role: 'user', name: 'Bob' },
 *   { id: 3, role: 'admin', name: 'Charlie' }
 * ];
 * 
 * const groupedByRole = groupBy(users, 'role');
 * // Returns {
 * //   admin: [
 * //     { id: 1, role: 'admin', name: 'Alice' },
 * //     { id: 3, role: 'admin', name: 'Charlie' }
 * //   ],
 * //   user: [
 * //     { id: 2, role: 'user', name: 'Bob' }
 * //   ]
 * // }
 */
export function groupBy<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Removes duplicate values from an array
 * 
 * @param array - The array to process
 * @returns Array with duplicates removed
 * 
 * @example
 * const unique = uniqueValues([1, 2, 2, 3, 1]);
 * // Returns [1, 2, 3]
 */
export function uniqueValues<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Sorts an array of objects by a specific object property
 * 
 * @param array - Array of objects to sort
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 * 
 * @example
 * const sorted = sortByProperty(
 *   [{ name: 'Z', age: 20 }, { name: 'A', age: 30 }],
 *   'name',
 *   'asc'
 * );
 * // Returns [{ name: 'A', age: 30 }, { name: 'Z', age: 20 }]
 */
export function sortByProperty<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sortedArray = [...array].sort((a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  });
  
  return order === 'desc' ? sortedArray.reverse() : sortedArray;
}

/**
 * Flattens a nested array structure
 * 
 * @param array - Array to flatten
 * @param depth - Maximum depth to flatten (default: Infinity)
 * @returns Flattened array
 * 
 * @example
 * const flat = flatten([1, [2, [3, 4], 5]]);
 * // Returns [1, 2, 3, 4, 5]
 * 
 * const flatDepth1 = flatten([1, [2, [3, 4], 5]], 1);
 * // Returns [1, 2, [3, 4], 5]
 */
export function flatten<T>(array: any[], depth: number = Infinity): T[] {
  return array.flat(depth);
}
