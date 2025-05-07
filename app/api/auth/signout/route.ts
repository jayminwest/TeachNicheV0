import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = cookies()
  const supabase = await createServerClient()
  
  // Server-side signout that properly clears cookies
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error("Error during server-side signout:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  // In Next.js 15, cookies() doesn't support getAll or delete directly
  // The signOut function above will handle cookie clearing automatically through Supabase
  // No need for manual cookie manipulation
  
  return NextResponse.json({ success: true })
}