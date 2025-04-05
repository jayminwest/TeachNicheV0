import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { stripe, syncStripeAccountStatus } from "@/utilities/api/stripe"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Pass the cookies function directly
    const supabase = createRouteHandlerClient({ cookies }) 

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = session.user

    // Get the user's Stripe account ID
    const { data: profile } = await supabase
      .from("instructor_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    // If no profile exists, create one
    if (!profile) {
      await supabase.from("instructor_profiles").insert({
        user_id: user.id,
        stripe_account_enabled: false,
        stripe_onboarding_complete: false,
      })
      
      return NextResponse.json({
        hasAccount: false,
        accountEnabled: false,
        onboardingComplete: false,
      })
    }

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        hasAccount: false,
        accountEnabled: false,
        onboardingComplete: false,
      })
    }

    // Sync the account status with Stripe
    const accountStatus = await syncStripeAccountStatus(supabase, user.id, profile.stripe_account_id);

    return NextResponse.json({
      hasAccount: true,
      ...accountStatus
    })
  } catch (error: any) {
    console.error("Stripe account status error:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
