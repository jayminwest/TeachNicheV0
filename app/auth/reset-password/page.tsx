"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Handle the hash fragment from the URL when the component mounts
  useEffect(() => {
    const handleHashFragment = async () => {
      // Check if we have a hash fragment with access_token
      const hash = window.location.hash
      if (hash && hash.includes('access_token=')) {
        try {
          // Extract the parameters from the hash
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')
          
          // Verify this is a recovery flow
          if (type === 'recovery' && accessToken) {
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            
            if (error) {
              console.error("Error setting session:", error)
              toast({
                variant: "destructive",
                title: "Invalid or Expired Link",
                description: "Please request a new password reset link.",
              })
              router.push("/auth/forgot-password")
            }
            
            // Clear the hash from the URL for security
            window.history.replaceState(null, '', window.location.pathname)
          } else {
            // Not a recovery flow
            toast({
              variant: "destructive",
              title: "Invalid Reset Link",
              description: "Please request a new password reset link.",
            })
            router.push("/auth/forgot-password")
          }
        } catch (error) {
          console.error("Error processing reset link:", error)
          toast({
            variant: "destructive",
            title: "Error Processing Link",
            description: "Please request a new password reset link.",
          })
          router.push("/auth/forgot-password")
        }
      } else {
        // No hash fragment, check if we have a session
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          toast({
            variant: "destructive",
            title: "Invalid or Expired Link",
            description: "Please request a new password reset link.",
          })
          router.push("/auth/forgot-password")
        }
      }
    }
    
    handleHashFragment()
  }, [router, supabase, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password requirements
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        console.error("Password update error:", error)
        setError(error.message)
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: error.message,
        })
        setLoading(false)
        return
      }

      setSuccess(true)
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      })
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push("/auth/sign-in")
      }, 3000)
    } catch (error: any) {
      console.error("Password update error:", error)
      setError(error.message || "An unexpected error occurred")
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-900/30">
              <AlertDescription>
                Your password has been successfully reset! You will be redirected to the sign-in page.
              </AlertDescription>
            </Alert>
            <div className="text-center mt-4">
              <Link href="/auth/sign-in" className="underline underline-offset-4 hover:text-primary">
                Go to Sign In
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={error ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={error ? "border-destructive" : ""}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
