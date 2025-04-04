"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { supabaseEnv } from "@/lib/env"

export const createClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: supabaseEnv.url,
    supabaseKey: supabaseEnv.anonKey,
  })
}
