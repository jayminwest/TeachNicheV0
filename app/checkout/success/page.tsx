"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { isBuildTime } from "@/lib/env-utils"

export default function CheckoutSuccess() {
  const [verifying, setVerifying] = useState(true)
  const [videoId, setVideoId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    const verifyPurchase = async () => {
      // Skip verification during build or if env variables are missing
      if (isBuildTime()) {
        console.log("Skipping purchase verification during build")
        setVerifying(false)
        return
      }
      
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
        const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`)
        
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
        
        const data = await response.json()
        console.log("Verification success data:", data)
        setVideoId(data.videoId || data.lessonId)
        
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
  }, [sessionId, toast])

  return (
    <div className="container max-w-lg py-16">
      <div className="text-center space-y-6">
        {verifying ? (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Verifying your purchase...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </>
        ) : videoId ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Thank you for your purchase!</h1>
            <p className="text-muted-foreground mb-8">
              Your payment has been successfully processed and you now have access to this content.
            </p>
            <div className="flex flex-col gap-4">
              <Button asChild size="lg">
                <Link href={`/lessons/${videoId}`}>View Content</Link>
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
            <h1 className="text-2xl font-bold">Payment Received</h1>
            <p className="text-muted-foreground mb-8">
              Your payment was successful, but we couldn&apos;t verify your purchase details. 
              Don&apos;t worry, our team has been notified and will resolve this shortly.
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
