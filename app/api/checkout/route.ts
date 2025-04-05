import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { stripe, calculateFees } from "@/lib/stripe"
import { type NextRequest, NextResponse } from "next/server"
import { 
  HttpStatusCode, 
  ApiMessages, 
  DatabaseTables,
  PAYMENT_METHODS
} from "@/constants/api"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const {
      data: { session: userSession },
    } = await supabase.auth.getSession()
    if (!userSession) {
      return NextResponse.json(
        { message: ApiMessages.UNAUTHORIZED }, 
        { status: HttpStatusCode.UNAUTHORIZED }
      )
    }

    const user = userSession.user

    // Get the lesson ID from the request
    const { lessonId } = await request.json()
    if (!lessonId) {
      return NextResponse.json(
        { message: ApiMessages.MISSING_PARAMETERS }, 
        { status: HttpStatusCode.BAD_REQUEST }
      )
    }

    // Get the lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from(DatabaseTables.LESSONS)
      .select("*, instructor_profiles:instructor_id(stripe_account_id)")
      .eq("id", lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { message: ApiMessages.NOT_FOUND }, 
        { status: HttpStatusCode.NOT_FOUND }
      )
    }

    // Check if the user has already purchased this lesson
    const { data: existingPurchase } = await supabase
      .from(DatabaseTables.PURCHASES)
      .select("id")
      .eq("user_id", userSession.user.id)
      .eq("lesson_id", lessonId)
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { message: ApiMessages.PAYMENT.ALREADY_PURCHASED }, 
        { status: HttpStatusCode.BAD_REQUEST }
      )
    }

    // Get the instructor's Stripe account ID
    const instructorStripeAccountId = lesson.instructor_profiles?.stripe_account_id

    if (!instructorStripeAccountId) {
      return NextResponse.json(
        { message: ApiMessages.PAYMENT.INSTRUCTOR_ACCOUNT_MISSING }, 
        { status: HttpStatusCode.BAD_REQUEST }
      )
    }
    
    // Check if the instructor's account is enabled
    const { data: instructorProfile } = await supabase
      .from(DatabaseTables.INSTRUCTOR_PROFILES)
      .select("stripe_account_enabled")
      .eq("user_id", lesson.instructor_id)
      .single()
      
    if (!instructorProfile?.stripe_account_enabled) {
      return NextResponse.json(
        { message: ApiMessages.PAYMENT.INSTRUCTOR_ACCOUNT_DISABLED }, 
        { status: HttpStatusCode.BAD_REQUEST }
      )
    }

    // Check if the lesson has a Stripe price ID
    if (!lesson.stripe_price_id) {
      return NextResponse.json(
        { message: ApiMessages.PAYMENT.INCOMPLETE_SETUP }, 
        { status: HttpStatusCode.BAD_REQUEST }
      )
    }

    // Calculate the price in cents and the platform fee
    const priceInCents = Math.round(lesson.price * 100)
    const { platformFee, instructorAmount } = calculateFees(priceInCents)
    const instructorPayoutAmount = instructorAmount / 100 // Convert back to dollars for database

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: PAYMENT_METHODS,
      line_items: [
        {
          price: lesson.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.nextUrl.origin}/checkout/lesson-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/lessons/${lessonId}`,
      metadata: {
        lessonId: lessonId,
        userId: userSession.user.id,
        stripeProductId: lesson.stripe_product_id,
        stripePriceId: lesson.stripe_price_id,
        instructorPayoutAmount: instructorPayoutAmount,
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: instructorStripeAccountId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { message: error.message || ApiMessages.INTERNAL_ERROR }, 
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    )
  }
}
