/**
 * @file Authentication hook for managing user authentication state
 * @description This hook provides a convenient way to access the current user's authentication state
 * and related functionality throughout the application.
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Authentication hook result type
 */
export interface UseAuthResult {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** Current session or null if not authenticated */
  session: Session | null;
  /** Loading state during authentication check */
  loading: boolean;
  /** Error that occurred during authentication check */
  error: Error | null;
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

/**
 * Hook for managing user authentication state
 * 
 * @example
 * ```tsx
 * const { user, session, loading, error, signOut } = useAuth();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorDisplay message={error.message} />;
 * 
 * return (
 *   <div>
 *     {user ? (
 *       <>
 *         <p>Welcome, {user.email}!</p>
 *         <button onClick={signOut}>Sign Out</button>
 *       </>
 *     ) : (
 *       <p>Please sign in</p>
 *     )}
 *   </div>
 * );
 * ```
 * 
 * @returns Authentication state and functions
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  
  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user || null);
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
  }, [supabase]);
  
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    } finally {
      setLoading(false);
    }
  };
  
  return { user, session, loading, error, signOut };
}
