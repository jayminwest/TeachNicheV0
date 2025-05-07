import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "@/types/supabase"
import { isDevelopment } from "../env-utils"

// For Next.js 15, cookies() must be awaited
export const createServerClient = cache(() => {
  // The cookies function in Next.js 15 needs to be handled properly
  // We need to return a promise that resolves to the supabase client
  return (async () => {
    // Validate that we have the required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables missing for server client");
      
      // Options to allow build process to continue even without proper env vars
      // These will only be used during builds and will be replaced in real environments
      const dummyOptions = {
        cookies,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
      }
      
      // Create client with dummy values to allow builds to complete
      const dummyClient = createServerComponentClient<Database>(dummyOptions)
      
      // Create a proxy to handle requests safely during build time
      return new Proxy(dummyClient, {
        get(target, prop) {
          // Most methods should return mock responses for build time
          if (typeof target[prop as keyof typeof target] === 'function') {
            // Return a function that resolves with empty data
            return () => Promise.resolve({ data: null, error: { message: "Build-time mock" } })
          }
          return target[prop as keyof typeof target]
        }
      }) as typeof dummyClient
    }
    
    // Create the real client with proper cookies function for Next.js
    const client = createServerComponentClient<Database>({ 
      cookies
    })
    
    // In development mode, log the connection info (but only once)
    if (isDevelopment() && process.env.NEXT_PUBLIC_SUPABASE_URL && 
        typeof window === 'undefined') { // Only log on server-side
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
      if (projectRef) {
        console.log(`🔌 Server connected to Supabase project: ${projectRef}`);
      }
    }
    
    return client
  })()
})

