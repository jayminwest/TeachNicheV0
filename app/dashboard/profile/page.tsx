"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [userRole, setUserRole] = useState("user")
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [stripeAccountEnabled, setStripeAccountEnabled] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/sign-in")
          return
        }
        
        // Get user profile from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, bio, role")
          .eq("id", session.user.id)
          .single()
        
        if (userData) {
          setName(userData.name || "")
          setBio(userData.bio || "")
          setUserRole(userData.role || "user")
        }
        
        // Check if user is an instructor
        const { data: instructorData, error: instructorError } = await supabase
          .from("instructor_profiles")
          .select("name, bio, stripe_account_id, stripe_account_enabled")
          .eq("user_id", session.user.id)
          .single()
        
        if (instructorData) {
          setIsInstructor(true)
          // Use instructor profile data if available
          setName(instructorData.name || userData?.name || "")
          setBio(instructorData.bio || userData?.bio || "")
          setStripeAccountId(instructorData.stripe_account_id)
          setStripeAccountEnabled(instructorData.stripe_account_enabled)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [supabase, router, toast])
  
  async function handleSaveProfile() {
    try {
      setSaving(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/sign-in")
        return
      }
      
      if (isInstructor) {
        // Update instructor profile
        const { error } = await supabase
          .from("instructor_profiles")
          .update({ name, bio })
          .eq("user_id", session.user.id)
        
        if (error) throw error
      } else {
        // Check if users table exists and has name/bio columns
        // If not, we'll need to create it or add columns
        const { error } = await supabase
          .from("users")
          .upsert({ 
            id: session.user.id,
            name,
            bio
          })
        
        if (error) throw error
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved",
      })
      
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="mt-2 md:mt-0">
          <Badge variant={isInstructor ? "default" : "outline"} className="text-sm">
            {isInstructor ? "Instructor" : "Student"}
          </Badge>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information that will be visible to others.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Tell us about yourself"
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Your current account status and instructor information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Account Type</p>
                <div className="flex items-center">
                  <Badge variant={isInstructor ? "default" : "outline"} className="mr-2">
                    {isInstructor ? "Instructor" : "Student"}
                  </Badge>
                  {userRole === "instructor" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              
              {isInstructor ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Stripe Account</p>
                    <div className="flex items-center">
                      <Badge 
                        variant={stripeAccountEnabled ? "default" : "destructive"} 
                        className="mr-2"
                      >
                        {stripeAccountEnabled ? "Connected" : "Not Verified"}
                      </Badge>
                      {stripeAccountEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  {!stripeAccountEnabled && stripeAccountId && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Verification Required</AlertTitle>
                      <AlertDescription>
                        Your Stripe account needs to be verified before you can receive payments.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto font-normal" 
                          asChild
                        >
                          <Link href="/dashboard/stripe-connect/refresh">
                            Complete verification <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {stripeAccountEnabled && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      asChild
                    >
                      <Link href="/dashboard/stripe-connect">
                        Manage Stripe Account
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Become an Instructor</AlertTitle>
                    <AlertDescription>
                      To become an instructor, you need to connect a Stripe account to receive payments.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    asChild
                  >
                    <Link href="/dashboard/stripe-connect">
                      Connect Stripe Account
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
