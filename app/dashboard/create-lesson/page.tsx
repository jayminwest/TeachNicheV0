"use client"

import type React from "react"
import type { Database } from "@/types/supabase"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CreateLesson() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload an image file.",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "The maximum file size is 5MB.",
      })
      return
    }

    setThumbnailFile(file)

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setThumbnailPreview(objectUrl)

    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbnailFileName = `${Date.now()}-${thumbnailFile.name}`
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from("thumbnails")
          .upload(`${user.id}/${thumbnailFileName}`, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (thumbnailError) {
          console.error("Error uploading thumbnail:", thumbnailError)
          // Continue without thumbnail if upload fails
        } else {
          // Get public URL
          const { data: publicThumbnailUrl } = await supabase.storage
            .from("thumbnails")
            .getPublicUrl(`${user.id}/${thumbnailFileName}`)

          thumbnailUrl = publicThumbnailUrl.publicUrl
        }
      }

      // Create lesson entry in database
      const { data: lesson, error: dbError } = await supabase
        .from("lessons")
        .insert({
          title,
          description,
          price: Number.parseFloat(price),
          instructor_id: user.id,
          thumbnail_url: thumbnailUrl,
        } as Database["public"]["Tables"]["lessons"]["Insert"])
        .select()

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Your lesson has been created successfully.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create lesson. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Lesson</h1>
        <p className="text-muted-foreground">Create a lesson to organize your kendama tutorial videos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>Fill out the information below to create your lesson</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Beginner Kendama Fundamentals"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what students will learn in this lesson..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19.99"
                min="0.99"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">Set a fair price for your lesson (minimum $0.99)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
              <div className="border rounded-md p-4">
                {thumbnailPreview ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <div className="relative w-full h-full">
                        <Image
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setThumbnailFile(null)
                        setThumbnailPreview(null)
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="mb-4">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your thumbnail image here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Recommended: 16:9 aspect ratio, JPG or PNG (max 5MB)
                    </p>
                    <Button type="button" variant="outline" asChild>
                      <label>
                        <input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleThumbnailChange}
                        />
                        Select Image
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lesson"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

