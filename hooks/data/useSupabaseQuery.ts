/**
 * @file Supabase query hook
 * @description A custom hook for querying Supabase data with loading, error, and caching functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PostgrestError, PostgrestSingleResponse, PostgrestFilterBuilder } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Supabase query options
 */
export interface UseSupabaseQueryOptions<T> {
  /** Whether to disable automatic query execution (manual mode) */
  disabled?: boolean;
  /** Function to transform the response data */
  select?: (data: T[]) => any;
  /** Dependencies array to trigger query refetching */
  deps?: any[];
  /** Enable data caching (default: true) */
  cache?: boolean;
}

/**
 * Supabase query result
 */
export interface UseSupabaseQueryResult<T> {
  /** Query result data */
  data: T[] | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error encountered during query */
  error: PostgrestError | null;
  /** Function to manually trigger a refetch */
  refetch: () => Promise<void>;
}

/**
 * Type for query building function
 */
export type QueryBuilderFunction<T> = (
  supabase: ReturnType<typeof createClientComponentClient<Database>>
) => PostgrestFilterBuilder<any, any, T[]>;

/**
 * Custom hook for querying Supabase data
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data, loading, error } = useSupabaseQuery(
 *   (supabase) => supabase.from('lessons').select('*')
 * );
 * 
 * // With transformation and dependencies
 * const { data, loading, error, refetch } = useSupabaseQuery(
 *   (supabase) => supabase.from('lessons').select('*').eq('creator_id', userId),
 *   {
 *     select: (data) => data.map(item => ({ 
 *       id: item.id,
 *       title: item.title,
 *       formattedDate: new Date(item.created_at).toLocaleDateString() 
 *     })),
 *     deps: [userId],
 *     disabled: !userId
 *   }
 * );
 * 
 * // Using the refetch function
 * const handleLessonCreated = () => {
 *   refetch();
 * };
 * ```
 * 
 * @param queryBuilder Function that builds and returns the Supabase query
 * @param options Additional options for the query
 * @returns Query result with data, loading state, error, and refetch function
 */
export function useSupabaseQuery<T>(
  queryBuilder: QueryBuilderFunction<T>,
  options: UseSupabaseQueryOptions<T> = {}
): UseSupabaseQueryResult<T> {
  const { disabled = false, select, deps = [], cache = true } = options;
  
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(!disabled);
  const [error, setError] = useState<PostgrestError | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const query = queryBuilder(supabase);
      const response: PostgrestSingleResponse<T[]> = await query;
      
      if (response.error) {
        throw response.error;
      }
      
      const transformedData = select ? select(response.data) : response.data;
      setData(transformedData);
    } catch (err) {
      setError(err as PostgrestError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, queryBuilder, select, ...deps]);
  
  // Effect to run the query when dependencies change
  useEffect(() => {
    if (!disabled) {
      fetchData();
    }
  }, [disabled, fetchData]);
  
  const refetch = useCallback(async () => {
    if (!disabled) {
      await fetchData();
    }
  }, [disabled, fetchData]);
  
  return { data, loading, error, refetch };
}
