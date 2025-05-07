import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // If there's an error, redirect to sign-in with error params
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(
        error
      )}&error_description=${encodeURIComponent(error_description || '')}`
    )
  }

  if (code) {
    try {
      // In Next.js 15, cookies() returns a synchronous cookie store
      // Properly type the client
      const supabase = createRouteHandlerClient<Database>({ 
        cookies 
      })
      
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error("Session exchange error:", sessionError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=session_error&error_description=${encodeURIComponent(
            sessionError.message || "Session exchange failed"
          )}`
        )
      }
    } catch (err) {
      console.error("Error exchanging code for session:", err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=server_error&error_description=${encodeURIComponent(
          "Unable to complete sign-in process. Please try again."
        )}`
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}

