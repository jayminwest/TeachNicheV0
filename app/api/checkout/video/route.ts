import { createServerClient } from "@/lib/supabase/server"
import { stripe } from "@/utilities/api/stripe"
import { calculateFees } from "@/utilities/formatting/currency"
import { NextResponse } from "next/server"

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Helper function to get the instructor's Stripe account ID
async function getInstructorStripeAccountId(
  supabase: SupabaseClient<Database>, 
  instructorId: string
) {
  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("stripe_account_id, stripe_account_enabled")
    .eq("user_id", instructorId)
    .single();
  
  if (error || !data) {
    return { accountId: null, isEnabled: false };
  }
  
  return { 
    accountId: data.stripe_account_id, 
    isEnabled: data.stripe_account_enabled 
  };
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    
    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase a video" },
        { status: 401 }
      )
    }
    
    // Get request body
    const { videoId, price, title } = await request.json()
    
    if (!videoId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Fetch the video to get Stripe product and price IDs
    let video;
    const { data: videoData } = await supabase
      .from("videos")
      .select("stripe_product_id, stripe_price_id, instructor_id")
      .eq("id", videoId)
      .single()
    
    if (!videoData) {
      // Try lessons table
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("stripe_product_id, stripe_price_id, instructor_id")
        .eq("id", videoId)
        .single()
      
      if (!lessonData) {
        return NextResponse.json(
          { error: "Video not found" },
          { status: 404 }
        )
      }
      
      video = lessonData
    } else {
      video = videoData
    }
    
    // Get the instructor's Stripe account ID
    const { accountId: instructorStripeAccountId, isEnabled: isAccountEnabled } = 
      await getInstructorStripeAccountId(supabase, video.instructor_id);
    
    if (!instructorStripeAccountId) {
      return NextResponse.json(
        { error: "Instructor payment account not set up" },
        { status: 400 }
      )
    }
    
    if (!isAccountEnabled) {
      return NextResponse.json(
        { error: "Instructor payment account is not fully enabled" },
        { status: 400 }
      )
    }
    
    // Calculate the instructor payout amount
    const priceInCents = Math.round(price * 100)
    const { platformFee, instructorAmount } = calculateFees(priceInCents)
    
    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    // Create a Stripe Checkout Session with Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: video.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/videos/${videoId}`,
      metadata: {
        videoId,
        userId: session.user.id,
        instructorId: video.instructor_id,
        productId: video.stripe_product_id,
        priceId: video.stripe_price_id,
        instructorPayoutAmount: instructorAmount
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: instructorStripeAccountId,
        },
      },
    })
    
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
