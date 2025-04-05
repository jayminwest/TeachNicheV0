"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle, ExternalLink, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { PLATFORM_FEE_PERCENTAGE, INSTRUCTOR_PERCENTAGE } from "@/utilities/formatting/currency"

export default function StripeConnectPage() {
  const [loading, setLoading] = useState(true)
  const [accountStatus, setAccountStatus] = useState<any>(null)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [creatingLoginLink, setCreatingLoginLink] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        setLoading(true)
        // Use cache busting to ensure we get fresh data
        const response = await fetch("/api/stripe/account-status", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch account status")
        }

        const data = await response.json()
        setAccountStatus(data)
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to check Stripe account status",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAccountStatus()
  }, [toast])

  const handleCreateAccount = async () => {
    try {
      setCreatingAccount(true)
      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to create Stripe Connect account")
      }

      const data = await response.json()

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No onboarding URL returned")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create Stripe Connect account",
      })
      setCreatingAccount(false)
    }
  }

  const handleLoginToStripe = async () => {
    try {
      setCreatingLoginLink(true)
      const response = await fetch("/api/stripe/create-login-link")

      if (!response.ok) {
        throw new Error("Failed to create Stripe login link")
      }

      const data = await response.json()

      // Redirect to Stripe dashboard
      if (data.url) {
        window.open(data.url, "_blank")
      } else {
        throw new Error("No login URL returned")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create Stripe login link",
      })
    } finally {
      setCreatingLoginLink(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Checking Stripe Connect status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stripe Connect Setup</h1>
          <p className="text-muted-foreground">Set up your payment account to receive earnings from your lessons</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Account Status</CardTitle>
            <CardDescription>Your Stripe Connect account status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountStatus?.hasAccount ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Account Status:</span>
                  {accountStatus.accountEnabled ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <XCircle className="h-5 w-5 mr-1" /> Setup Incomplete
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Onboarding:</span>
                  {accountStatus.onboardingComplete ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" /> Complete
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <XCircle className="h-5 w-5 mr-1" /> Incomplete
                    </span>
                  )}
                </div>

                {accountStatus.account && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="font-medium">Account Details:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{accountStatus.account.email}</span>

                      {accountStatus.account.country && (
                        <>
                          <span className="text-muted-foreground">Country:</span>
                          <span>{accountStatus.account.country}</span>
                        </>
                      )}

                      {accountStatus.account.default_currency && (
                        <>
                          <span className="text-muted-foreground">Currency:</span>
                          <span>{accountStatus.account.default_currency.toUpperCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <XCircle className="h-12 w-12 mx-auto text-amber-600 mb-2" />
                <p className="font-medium mb-2">No Stripe Account Set Up</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to set up a Stripe Connect account to receive payments for your lessons.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {!accountStatus?.hasAccount ? (
              <Button className="w-full" onClick={handleCreateAccount} disabled={creatingAccount}>
                {creatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up Stripe...
                  </>
                ) : (
                  "Set Up Stripe Connect Account"
                )}
              </Button>
            ) : !accountStatus.onboardingComplete ? (
              <Button className="w-full" onClick={handleCreateAccount} disabled={creatingAccount}>
                {creatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  "Complete Stripe Onboarding"
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleLoginToStripe}
                disabled={creatingLoginLink || !accountStatus.accountEnabled}
              >
                {creatingLoginLink ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating login link...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Stripe Account
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>How payments work on Teach Niche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Revenue Split</h3>
              <p className="text-sm text-muted-foreground">
                When students purchase your lessons, the revenue is split as follows:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-4 bg-muted rounded-md text-center">
                  <p className="text-2xl font-bold text-primary">{INSTRUCTOR_PERCENTAGE}%</p>
                  <p className="text-sm text-muted-foreground">You receive</p>
                </div>
                <div className="p-4 bg-muted rounded-md text-center">
                  <p className="text-2xl font-bold">{PLATFORM_FEE_PERCENTAGE}%</p>
                  <p className="text-sm text-muted-foreground">Platform fee</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium">Payment Process</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Payments are processed securely through Stripe</li>
                <li>Your earnings are transferred directly to your Stripe Connect account</li>
                <li>You can set up payouts to your bank account in your Stripe dashboard</li>
                <li>Standard Stripe processing fees may apply (typically 2.9% + $0.30 per transaction)</li>
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium">Requirements</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>You must complete Stripe Connect onboarding to receive payments</li>
                <li>You need to provide your tax information to Stripe</li>
                <li>You must have a bank account that can receive payments in your country</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              For more information about Stripe Connect, visit the{" "}
              <a
                href="https://stripe.com/connect"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Connect documentation
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
