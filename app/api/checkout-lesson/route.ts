import { createServerClient } from "@/lib/supabase/server"
import { stripe, calculateFees } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { nextEnv } from "@/lib/env"

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

// Helper function to create a Stripe product and price
async function createStripeProduct({ name, description, price, images }: {
  name: string, 
  description: string, 
  price: number,
  images?: string[]
}) {
  try {
    // Create a product in Stripe
    const product = await stripe.products.create({
      name,
      description,
      images,
    });

    // Create a price for the product
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'usd',
    });

    return {
      productId: product.id,
      priceId: priceObj.id,
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw error;
  }
}

// Helper function to record a free lesson access
async function recordFreeLessonAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string,
  instructorId: string
) {
  try {
    // Check if this access has already been recorded
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();
    
    if (existingPurchase) {
      // Access already recorded, return success
      return { success: true, lessonId };
    }
    
    // Record the access in the database
    const { data: columnInfo } = await supabase.rpc('column_exists', {
      table_name: 'purchases',
      column_name: 'video_id'
    });
    
    // Define the purchase data with proper typing
    interface PurchaseData {
      user_id: string;
      lesson_id: string;
      stripe_payment_id: string;
      amount: number;
      stripe_product_id: null;
      stripe_price_id: null;
      instructor_payout_amount: number;
      platform_fee_amount: number;
      payout_status: string;
      is_free: boolean;
      [key: string]: any; // Allow for dynamic properties
    }
    
    const purchaseData: PurchaseData = {
      user_id: userId,
      lesson_id: lessonId,
      stripe_payment_id: `free_${userId}_${lessonId}_${Date.now()}`, // Generate a unique ID for free lessons
      amount: 0,
      stripe_product_id: null,
      stripe_price_id: null,
      instructor_payout_amount: 0,
      platform_fee_amount: 0,
      payout_status: 'free_lesson', // Mark as free lesson
      is_free: true // Add a flag to indicate this is a free lesson
    };
    
    // Only add video_id if the column exists
    if (columnInfo) {
      purchaseData['video_id'] = null;
    }
    
    const { error: purchaseError } = await supabase
      .from("purchases")
      .insert(purchaseData);
    
    if (purchaseError) {
      console.error("Error recording free lesson access:", purchaseError);
      throw new Error(`Failed to record free lesson access: ${purchaseError.message}`);
    }
    
    return { success: true, lessonId };
  } catch (error) {
    console.error("Error recording free lesson access:", error);
    throw error;
  }
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
        { error: "You must be logged in to purchase a lesson" },
        { status: 401 }
      )
    }
    
    // Get request body
    const { lessonId, price, title, isFree } = await request.json()
    
    if (!lessonId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Fetch the lesson to get instructor ID and verify price
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("stripe_product_id, stripe_price_id, instructor_id, price")
      .eq("id", lessonId)
      .single()
    
    if (lessonError || !lesson) {
      console.error("Error fetching lesson:", lessonError)
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      )
    }
    
    // Verify the price matches what's in the database (security check)
    const lessonPrice = parseFloat(lesson.price) || 0;
    const requestPrice = parseFloat(price) || 0;
    
    // Allow a small difference for floating point comparison
    if (Math.abs(lessonPrice - requestPrice) > 0.01) {
      return NextResponse.json(
        { error: "Price mismatch. Please refresh and try again." },
        { status: 400 }
      )
    }
    
    // Handle free lessons (price is 0)
    if (lessonPrice === 0 || isFree) {
      // For free lessons, we still need the instructor to have a Stripe account
      // but we don't need to create a checkout session
      const { accountId: instructorStripeAccountId } = 
        await getInstructorStripeAccountId(supabase, lesson.instructor_id);
      
      if (!instructorStripeAccountId) {
        return NextResponse.json(
          { error: "Instructor payment account not set up" },
          { status: 400 }
        )
      }
      
      // Record the free lesson access
      const result = await recordFreeLessonAccess(
        supabase, 
        session.user.id, 
        lessonId, 
        lesson.instructor_id
      );
      
      return NextResponse.json(result);
    }
    
    // For paid lessons, continue with the existing flow
    // Get the instructor's Stripe account ID
    const { accountId: instructorStripeAccountId, isEnabled: isAccountEnabled } = 
      await getInstructorStripeAccountId(supabase, lesson.instructor_id);
    
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
    
    // Validate that the lesson has the required Stripe IDs
    if (!lesson.stripe_product_id || !lesson.stripe_price_id) {
      console.error("Lesson missing Stripe product or price ID:", lesson)
      
      // Create a new Stripe product and price if missing
      const priceInCents = Math.round(Number(price) * 100)
      
      // Use direct API call instead of fetch to avoid URL issues
      const { productId, priceId } = await createStripeProduct({
        name: title,
        description: `Lesson: ${title}`,
        price: priceInCents,
      })
      
      if (!productId || !priceId) {
        throw new Error("Failed to create Stripe product and price")
      }
      
      // Update the lesson with the new Stripe IDs
      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          stripe_product_id: productId,
          stripe_price_id: priceId,
        })
        .eq("id", lessonId)
      
      if (updateError) {
        console.error("Error updating lesson with Stripe IDs:", updateError)
        throw new Error("Failed to update lesson with Stripe product information")
      }
      
      // Use the new IDs
      lesson.stripe_product_id = productId
      lesson.stripe_price_id = priceId
    }
    
    // Calculate the instructor payout amount
    const priceInCents = Math.round(Number(price) * 100)
    const { platformFee, instructorAmount } = calculateFees(priceInCents)
    const instructorPayoutAmount = instructorAmount / 100 // Convert back to dollars for database
    
    // Get the base URL for redirects from the centralized env config
    const baseUrl = nextEnv.appUrl
    
    // Create a Stripe Checkout Session with Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: lesson.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/checkout/lesson-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/lessons/${lessonId}`,
      metadata: {
        lessonId,
        userId: session.user.id,
        instructorId: lesson.instructor_id,
        productId: lesson.stripe_product_id,
        priceId: lesson.stripe_price_id,
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
