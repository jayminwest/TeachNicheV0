"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, Download } from "lucide-react" // Added Download icon
import { useRouter } from "next/navigation"
import { calculatePriceWithStripeFees } from "@/lib/stripe"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PriceBreakdown } from "@/components/price-breakdown"

interface LessonCheckoutButtonProps {
  lessonId: string
  price: number
  title: string
}

export default function LessonCheckoutButton({ lessonId, price, title }: LessonCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFreeAccess = async () => {
    try {
      setLoading(true)
      // Call our API to record free lesson access
      const response = await fetch(`/api/checkout-lesson`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          price: 0,
          title,
          isFree: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to access free lesson");
      }

      const data = await response.json();
      
      // Redirect to the lesson success page
      if (data.lessonId) {
        router.push(`/checkout/lesson-success?free=true&lessonId=${data.lessonId}`);
      } else {
        throw new Error("No lesson ID returned from server");
      }
    } catch (error: any) {
      console.error("Free access error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmCheckout = async () => {
    try {
      setLoading(true)
      
      // For paid lessons, continue with Stripe checkout flow
      const response = await fetch("/api/checkout-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          price,
          title,
        }),
      })

      let errorMessage = "Failed to create checkout session";
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from server");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
      setShowConfirmDialog(false);
    } finally {
      setLoading(false);
    }
  }

  const handleButtonClick = () => {
    if (price === 0) {
      // For free lessons, directly handle access
      handleFreeAccess();
    } else {
      // For paid lessons, show confirmation dialog with price breakdown
      setShowConfirmDialog(true);
    }
  }

  return (
    <>
      <Button className="w-full" onClick={handleButtonClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : price === 0 ? (
          <>
            <Download className="mr-2 h-4 w-4" />
            Get Free Access
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Purchase Access
          </>
        )}
      </Button>

      {/* Confirmation Dialog with Price Breakdown */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <PriceBreakdown basePrice={price} />
          </div>
          
          <DialogFooter className="sm:justify-start gap-3">
            <Button 
              type="button"
              onClick={handleConfirmCheckout}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

