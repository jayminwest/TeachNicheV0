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
    
    // Get the parameters from the query
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")
    const lessonId = searchParams.get("lessonId")
    const isFree = searchParams.get("free") === "true"
    
    // If this is a free lesson verification
    if (isFree && lessonId) {
      // Check if the lesson exists and is free
      const { data: lesson } = await supabase
        .from("lessons")
        .select("price")
        .eq("id", lessonId)
        .single()
      
      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found" },
          { status: 404 }
        )
      }
      
      // Verify the lesson is actually free
      if (parseFloat(lesson.price) > 0) {
        return NextResponse.json(
          { error: "This is not a free lesson" },
          { status: 400 }
        )
      }
      
      // Check if the user already has access
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle()
      
      if (!existingPurchase) {
        // Record the free access if not already recorded
        const purchaseData = {
          user_id: session.user.id,
          lesson_id: lessonId,
          stripe_payment_id: `free_${session.user.id}_${lessonId}_${Date.now()}`,
          amount: 0,
          stripe_product_id: null,
          stripe_price_id: null,
          instructor_payout_amount: 0,
          platform_fee_amount: 0,
          payout_status: 'free_lesson',
          is_free: true
        }
        
        const { error: purchaseError } = await supabase
          .from("purchases")
          .insert(purchaseData)
        
        if (purchaseError) {
          console.error("Error recording free lesson access:", purchaseError)
          return NextResponse.json(
            { error: `Failed to record free lesson access: ${purchaseError.message}` },
            { status: 500 }
          )
        }
      }
      
      return NextResponse.json({ 
        success: true,
        lessonId
      })
    }
    
    // For paid lessons, continue with the existing flow
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
    const lessonIdFromSession = checkoutSession.metadata?.lessonId
    
    if (!lessonIdFromSession) {
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
      .eq("lesson_id", lessonIdFromSession)
      .eq("stripe_payment_id", checkoutSession.id)
      .maybeSingle()
    
    if (existingPurchase) {
      // Purchase already recorded, return success
      return NextResponse.json({ 
        success: true,
        lessonId: lessonIdFromSession
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
    
    // Calculate platform fee
    const amountInCents = checkoutSession.amount_total || 0
    const { platformFee } = calculateFees(amountInCents)
    
    const purchaseData = {
      user_id: session.user.id,
      lesson_id: lessonIdFromSession,
      stripe_payment_id: checkoutSession.id,
      amount: checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0,
      stripe_product_id: checkoutSession.metadata?.productId,
      stripe_price_id: checkoutSession.metadata?.priceId,
      instructor_payout_amount: instructorPayoutAmount,
      platform_fee_amount: platformFee / 100, // Convert to dollars
      payout_status: 'pending_transfer', // Set initial status
      is_free: false
    }
    
    // Only add video_id if the column exists
    if (columnInfo) {
      (purchaseData as any)['video_id'] = null
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
