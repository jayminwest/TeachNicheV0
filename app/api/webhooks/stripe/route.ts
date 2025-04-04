import { type NextRequest, NextResponse } from "next/server"
import { stripe, calculateFees } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import Stripe from "stripe"
import { supabaseEnv, stripeEnv } from "@/lib/env"

// Initialize Supabase client with service role for admin access
// This is needed for webhook operations where we don't have a user session
const supabase = createClient<Database>(
  supabaseEnv.url,
  supabaseEnv.serviceRoleKey
)

export async function POST(request: NextRequest) {
  let event

  // Verify webhook signature
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature")

  try {
    event = stripe.webhooks.constructEvent(payload, signature || "", stripeEnv.webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  try {
    // Use type assertion to handle all Stripe event types
    switch (event.type as string) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Check if this is a video or lesson purchase
        const lessonId = session.metadata?.lessonId
        const videoId = session.metadata?.videoId
        const userId = session.metadata?.userId
        
        if (!userId) {
          console.error("No user ID in session metadata")
          return NextResponse.json({ error: "No user ID found" }, { status: 400 })
        }
        
        // Calculate platform fee and instructor amount
        const amount = session.amount_total ? session.amount_total / 100 : 0
        const amountInCents = session.amount_total || 0
        const { platformFee, instructorAmount } = calculateFees(amountInCents)
        const instructorPayoutAmount = instructorAmount / 100 // Convert back to dollars
        
        // Set payout status to 'pending' since we're using Connect
        const payoutStatus = 'pending_transfer'
        
        if (lessonId) {
          // This is a lesson purchase
          // First check if the purchases table has a video_id column with a not-null constraint
          const { data: columnInfo } = await supabase.rpc('column_exists', {
            table_name: 'purchases',
            column_name: 'video_id'
          })
          
          // Create purchase data with proper typing
          const purchaseData: {
            user_id: string;
            lesson_id: string;
            stripe_payment_id: string;
            amount: number;
            instructor_payout_amount: number;
            platform_fee_amount: number;
            payout_status: string;
            stripe_product_id?: string;
            stripe_price_id?: string;
            video_id?: null;
          } = {
            user_id: userId,
            lesson_id: lessonId,
            stripe_payment_id: session.id,
            amount: amount,
            instructor_payout_amount: instructorPayoutAmount,
            platform_fee_amount: platformFee / 100, // Convert to dollars
            payout_status: payoutStatus,
            stripe_product_id: session.metadata?.productId,
            stripe_price_id: session.metadata?.priceId,
          }
          
          // Only add video_id if the column exists
          if (columnInfo) {
            purchaseData.video_id = null
          }
          
          const { error: purchaseError } = await supabase
            .from("purchases")
            .insert(purchaseData)
          
          if (purchaseError) {
            console.error("Error recording lesson purchase:", purchaseError)
          }
          
          // If there's an instructor ID, update their earnings
          const instructorId = session.metadata?.instructorId
          if (instructorId) {
            // Get current earnings first
            const { data: instructorProfile } = await supabase
              .from("instructor_profiles")
              .select("total_earnings")
              .eq("user_id", instructorId)
              .single()
            
            const currentEarnings = instructorProfile?.total_earnings || 0
            const newEarnings = currentEarnings + instructorPayoutAmount
            
            const { error: instructorError } = await supabase
              .from("instructor_profiles")
              .update({
                total_earnings: newEarnings,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", instructorId)
            
            if (instructorError) {
              console.error("Error updating instructor earnings:", instructorError)
            }
          }
        } else if (videoId) {
          // This is a video purchase
          const { error: purchaseError } = await supabase
            .from("purchases")
            .insert({
              user_id: userId,
              video_id: videoId,
              stripe_payment_id: session.id,
              amount: amount,
              instructor_payout_amount: instructorPayoutAmount,
              platform_fee_amount: platformFee / 100, // Convert to dollars
              payout_status: payoutStatus,
              stripe_product_id: session.metadata?.productId,
              stripe_price_id: session.metadata?.priceId,
            })
          
          if (purchaseError) {
            console.error("Error recording video purchase:", purchaseError)
          }
          
          // If there's an instructor ID, update their earnings
          const instructorId = session.metadata?.instructorId
          if (instructorId) {
            // Get current earnings first
            const { data: instructorProfile } = await supabase
              .from("instructor_profiles")
              .select("total_earnings")
              .eq("user_id", instructorId)
              .single()
            
            const currentEarnings = instructorProfile?.total_earnings || 0
            const newEarnings = currentEarnings + instructorPayoutAmount
            
            const { error: instructorError } = await supabase
              .from("instructor_profiles")
              .update({
                total_earnings: newEarnings,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", instructorId)
            
            if (instructorError) {
              console.error("Error updating instructor earnings:", instructorError)
            }
          }
        }
        
        break
      }
      
      // Handle transfer events
      case "transfer.created" as string: {
        const transfer = event.data.object as Stripe.Transfer
        
        // Get the payment intent ID from the transfer
        const paymentIntentId = transfer.source_transaction
        
        if (paymentIntentId) {
          // Find the purchase with this payment intent
          const { data: purchases, error: purchaseError } = await supabase
            .from("purchases")
            .select("id")
            .eq("stripe_payment_id", paymentIntentId)
            .limit(1)
          
          if (purchaseError || !purchases || purchases.length === 0) {
            console.error("Could not find purchase for transfer:", purchaseError)
            break
          }
          
          // Update the purchase with the transfer information
          const { error: updateError } = await supabase
            .from("purchases")
            .update({
              payout_status: 'transferred',
              stripe_transfer_id: transfer.id
            })
            .eq("id", purchases[0].id)
          
          if (updateError) {
            console.error("Error updating purchase with transfer info:", updateError)
          }
        }
        
        break
      }
      
      // Handle transfer failures
      case "transfer.failed" as string: {
        const transfer = event.data.object as Stripe.Transfer
        
        // Get the payment intent ID from the transfer
        const paymentIntentId = transfer.source_transaction
        
        if (paymentIntentId) {
          // Find the purchase with this payment intent
          const { data: purchases, error: purchaseError } = await supabase
            .from("purchases")
            .select("id")
            .eq("stripe_payment_id", paymentIntentId)
            .limit(1)
          
          if (purchaseError || !purchases || purchases.length === 0) {
            console.error("Could not find purchase for failed transfer:", purchaseError)
            break
          }
          
          // Update the purchase with the failure information
          const { error: updateError } = await supabase
            .from("purchases")
            .update({
              payout_status: 'failed',
              stripe_transfer_id: transfer.id
            })
            .eq("id", purchases[0].id)
          
          if (updateError) {
            console.error("Error updating purchase with transfer failure:", updateError)
          }
        }
        
        break
      }
      
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`)
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    )
  }
}

// This is important for webhook endpoints in Next.js
export const config = {
  api: {
    bodyParser: false,
  },
}
