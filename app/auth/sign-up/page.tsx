"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks"
import { CheckCircle } from "lucide-react" // Add this import for the success icon

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false) // New state variable
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // Enhanced toast message
      toast({
        title: "Verification Email Sent",
        description: "Please check your email inbox and click the verification link to complete your registration.",
        duration: 6000, // Show for longer
      })
      
      // Set signup as complete to show success message
      setSignupComplete(true)
      
      // Delay redirect to allow user to see the success message
      setTimeout(() => {
        router.push("/auth/sign-in")
      }, 5000)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign up. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Success message component
  if (signupComplete) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Registration Successful!</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification email to <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Please check your email inbox and click the verification link to complete your registration.</p>
            <p className="text-sm text-muted-foreground">
              If you don't see the email, check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you to sign in page in a few seconds...
            </p>
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/sign-in")}
            >
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create an account to access the platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
