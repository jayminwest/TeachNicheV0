"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectedFrom") || "/"
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null) // Clear previous errors

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Authentication error:", error);
        
        // Force a specific error message for invalid credentials
        const errorMessage = "Invalid email or password. Please check your credentials and try again.";
        
        setAuthError(errorMessage);
        
        // Show toast immediately without setTimeout
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: errorMessage,
        });
        
        setLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "You have been signed in.",
      })
      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      console.error("Sign-in error:", error)
      
      // Handle network or unexpected errors
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            {/* Display auth error if present */}
            {authError && (
              <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200">
                <AlertDescription className="font-medium">{authError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authError ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={authError ? "border-destructive" : ""}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
