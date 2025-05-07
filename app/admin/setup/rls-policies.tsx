"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RLSPoliciesSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const setupRLSPolicies = async () => {
    try {
      setLoading(true)

      // First, let's try to create the policies for the videos bucket
      const videosResult = await fetch("/api/setup-rls-policies?bucket=videos")
      const videosData = await videosResult.json()

      // Then, let's try to create the policies for the thumbnails bucket
      const thumbnailsResult = await fetch("/api/setup-rls-policies?bucket=thumbnails")
      const thumbnailsData = await thumbnailsResult.json()

      setResult({
        videos: videosData,
        thumbnails: thumbnailsData,
        success: videosData.success && thumbnailsData.success,
      })

      if (videosData.success && thumbnailsData.success) {
        toast({
          title: "Success",
          description: "RLS policies have been set up successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to set up some RLS policies. See details for more information.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      })
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>RLS Policies Setup</CardTitle>
        <CardDescription>Set up the Row Level Security (RLS) policies for storage buckets</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          This will create the necessary RLS policies to allow video uploads and access. If you&apos;re getting RLS security
          errors, run this setup.
        </p>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <div className="flex items-center mb-2">
              <span className="font-semibold mr-2">Status:</span>
              {result.success ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" /> Success
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" /> Failed
                </span>
              )}
            </div>

            <div className="mt-2">
              <p className="font-semibold">Details:</p>
              <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={setupRLSPolicies} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up RLS policies...
            </>
          ) : (
            "Set Up RLS Policies"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

