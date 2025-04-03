"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface VideoCheckoutButtonProps {
  videoId: string
  price: number
  title: string
}

export default function VideoCheckoutButton({ videoId, price, title }: VideoCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCheckout = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/checkout/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          price,
          title,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to create checkout session")
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="w-full" onClick={handleCheckout} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Purchase Video
        </>
      )}
    </Button>
  )
}
