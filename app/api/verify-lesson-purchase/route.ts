import { createServerClient } from "@/lib/supabase/server"
import { stripe, calculateFees } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to verify a purchase" },
        { status: 401 }
      )
    }
    
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      )
    }
    
    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      )
    }
    
    // Verify the payment status
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      )
    }
    
    // Get the lesson ID from the metadata
    const lessonId = checkoutSession.metadata?.lessonId
    
    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID not found in session metadata" },
        { status: 400 }
      )
    }
    
    // Check if this purchase has already been recorded
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("lesson_id", lessonId)
      .eq("stripe_payment_id", checkoutSession.id)
      .maybeSingle()
    
    if (existingPurchase) {
      // Purchase already recorded, return success
      return NextResponse.json({ 
        success: true,
        lessonId
      })
    }
    
    // Record the purchase in the database
    // First check if the purchases table has a video_id column with a not-null constraint
    const { data: columnInfo } = await supabase.rpc('column_exists', {
      table_name: 'purchases',
      column_name: 'video_id'
    })
    
    // Calculate instructor payout if not provided in metadata
    let instructorPayoutAmount = null
    if (checkoutSession.metadata?.instructorPayoutAmount) {
      instructorPayoutAmount = parseFloat(checkoutSession.metadata.instructorPayoutAmount) / 100
    } else if (checkoutSession.amount_total) {
      const amountInCents = checkoutSession.amount_total
      const { instructorAmount } = calculateFees(amountInCents)
      instructorPayoutAmount = instructorAmount / 100
    }
    
    const purchaseData = {
      user_id: session.user.id,
      lesson_id: lessonId,
      stripe_payment_id: checkoutSession.id,
      amount: checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0,
      stripe_product_id: checkoutSession.metadata?.productId,
      stripe_price_id: checkoutSession.metadata?.priceId,
      instructor_payout_amount: instructorPayoutAmount
    }
    
    // Only add video_id if the column exists
    if (columnInfo) {
      purchaseData['video_id'] = null
    }
    
    const { error: purchaseError } = await supabase
      .from("purchases")
      .insert(purchaseData)
    
    if (purchaseError) {
      console.error("Error recording purchase:", purchaseError)
      return NextResponse.json(
        { error: `Failed to record purchase: ${purchaseError.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      lessonId
    })
  } catch (error: any) {
    console.error("Error verifying purchase:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify purchase" },
      { status: 500 }
    )
  }
}
