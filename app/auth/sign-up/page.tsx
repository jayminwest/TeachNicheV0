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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react" // Add this import for the success icon

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate the origin for the redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log("Signing up with redirect URL:", redirectUrl);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error("Sign-up error:", error);
        throw error;
      }

      // Enhanced toast message
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
        duration: 3000,
      })
      
      // In case of user creation issues, show a helpful message
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast({
          variant: "destructive",
          title: "Account Already Exists",
          description: "An account with this email already exists. Please sign in instead.",
        });
        router.push("/auth/sign-in");
        return;
      }
      
      // Redirect to dashboard or home page directly since they'll be logged in
      router.push("/")
    } catch (error: any) {
      console.error("Sign-up process error:", error);
      
      let errorMessage = "Failed to sign up. Please try again.";
      
      // Handle specific error cases
      if (error.message?.includes("email")) {
        errorMessage = "Please provide a valid email address.";
      } else if (error.message?.includes("password")) {
        errorMessage = "Password must be at least 8 characters long.";
      } else if (error.message?.includes("already")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      
      // Set error state for display in the UI
      setAuthError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
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
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create an account to access the platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={authError ? "border-destructive" : ""}
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

