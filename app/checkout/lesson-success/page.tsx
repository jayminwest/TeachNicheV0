"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function LessonCheckoutSuccess() {
  const [verifying, setVerifying] = useState(true)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const sessionId = searchParams.get("session_id")
  const directLessonId = searchParams.get("lessonId")
  const isFree = searchParams.get("free") === "true"

  useEffect(() => {
    const verifyPurchase = async () => {
      // Handle free lessons with direct lessonId
      if (isFree && directLessonId) {
        try {
          // Verify the free lesson access
          const response = await fetch(`/api/verify-lesson-purchase?free=true&lessonId=${directLessonId}`)
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || "Failed to verify free lesson access")
          }
          
          const data = await response.json()
          setLessonId(data.lessonId)
          
          toast({
            title: "Access Granted",
            description: "You now have access to this free lesson!",
          })
        } catch (error: any) {
          console.error("Verification error:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to verify free lesson access",
          })
        } finally {
          setVerifying(false)
        }
        return
      }

      // Handle paid lessons with session_id
      if (!sessionId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No session ID found",
        })
        setVerifying(false)
        return
      }

      try {
        console.log("Verifying purchase with session ID:", sessionId)
        const response = await fetch(`/api/verify-lesson-purchase?session_id=${sessionId}`)
        
        if (!response.ok) {
          let errorMessage = "Failed to verify purchase"
          try {
            const errorData = await response.json()
            console.error("Verification error details:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (parseErr) {
            console.error("Error parsing error response:", parseErr)
            const errorText = await response.text()
            console.error("Error response text:", errorText)
          }
          throw new Error(errorMessage)
        }
        
        // Response is ok, so we can parse it as JSON safely
        const data = await response.json()
        console.log("Verification success data:", data)
        setLessonId(data.lessonId || directLessonId)
        
        toast({
          title: "Purchase Successful",
          description: "Thank you for your purchase!",
        })
      } catch (error: any) {
        console.error("Verification error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to record purchase",
        })
      } finally {
        setVerifying(false)
      }
    }

    verifyPurchase()
  }, [sessionId, directLessonId, isFree, toast])

  return (
    <div className="container max-w-lg py-16">
      <div className="text-center space-y-6">
        {verifying ? (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Verifying your {isFree ? "access" : "purchase"}...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your {isFree ? "access" : "payment"}.</p>
          </>
        ) : lessonId ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">
              {isFree ? "Access Granted!" : "Thank you for your purchase!"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isFree 
                ? "You now have access to this free lesson. Enjoy learning!"
                : "Your payment has been successfully processed and you now have access to this lesson."}
            </p>
            <div className="flex flex-col gap-4">
              <Button asChild size="lg">
                <Link href={`/lessons/${lessonId}`}>View Lesson</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4 text-amber-500">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold">
              {isFree ? "Access Issue" : "Payment Received"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isFree
                ? "We couldn't verify your access details. Don't worry, our team has been notified and will resolve this shortly."
                : "Your payment was successful, but we couldn't verify your purchase details. Don't worry, our team has been notified and will resolve this shortly."}
            </p>
            <div className="flex flex-col gap-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
