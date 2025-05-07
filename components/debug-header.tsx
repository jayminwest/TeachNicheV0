"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// Extract the project reference from the Supabase URL
const getProjectRef = () => {
  // Make sure we're accessing this on the client side only
  if (typeof window === 'undefined') return 'loading';
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  console.log('Supabase URL:', url); // Debug log
  
  const match = url.match(/https:\/\/([^.]+)/);
  return match ? match[1] : 'unknown';
}

// Get environment name
const getEnvironment = () => {
  const ref = getProjectRef();
  
  // Log to help with debugging
  if (typeof window !== 'undefined') {
    console.log('Project Ref:', ref);
  }
  
  if (ref.includes('nqmtr')) return 'DEVELOPMENT';
  if (ref.includes('fduuu')) return 'PRODUCTION';
  return process.env.NODE_ENV || 'unknown';
}

export default function DebugHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectRef, setProjectRef] = useState<string>('loading')
  const [environment, setEnvironment] = useState<string>('loading')
  const supabase = createClient()
  
  // Check if we're in development environment
  const isDev = environment === 'DEVELOPMENT'

  useEffect(() => {
    // Get environment information
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const match = url.match(/https:\/\/([^.]+)/);
    const ref = match ? match[1] : 'unknown';
    
    setProjectRef(ref);
    
    // Set environment based on project ref
    if (ref.includes('nqmtr')) {
      setEnvironment('DEVELOPMENT');
    } else if (ref.includes('fduuu')) {
      setEnvironment('PRODUCTION');
    } else {
      setEnvironment(process.env.NODE_ENV || 'unknown');
    }

    // Log for debugging
    console.log('Environment detection:');
    console.log('- URL:', url);
    console.log('- Ref:', ref);
    console.log('- Environment:', ref.includes('nqmtr') ? 'DEVELOPMENT' : 'PRODUCTION');
    
    const getUser = async () => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          setError(sessionError.message)
        }
        
        setUser(session?.user || null)
        setLoading(false)
      } catch (err) {
        console.error("Auth error:", err)
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }

    getUser()

    if (!supabase) {
      console.error("Supabase client not initialized");
      return () => {};
    }
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <>
      {/* Large environment indicator */}
      {isDev && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-center py-1 font-bold">
          DEVELOPMENT ENVIRONMENT - Project: {projectRef}
        </div>
      )}
      
      {/* Regular debug panel */}
      <div className="fixed top-8 right-0 z-50 p-4 bg-black/80 text-white text-xs rounded-bl-lg max-w-xs overflow-auto max-h-80">
        <h2 className="font-bold text-sm mb-2">Debug Info:</h2>
        <p className={isDev ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
          <strong>ENV:</strong> {environment}
        </p>
        <p><strong>Project:</strong> {projectRef}</p>
        
        <div className="border-t border-gray-600 my-2 pt-2">
          <h3 className="font-bold">Auth:</h3>
          <p><strong>Loading:</strong> {loading ? "true" : "false"}</p>
          <p><strong>User:</strong> {user ? "Logged in" : "Not logged in"}</p>
          {user && (
            <div className="mt-1">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id.slice(0, 8)}...</p>
            </div>
          )}
          {error && (
            <p className="text-red-400 mt-1"><strong>Error:</strong> {error}</p>
          )}
        </div>
      </div>
    </>
  )
}