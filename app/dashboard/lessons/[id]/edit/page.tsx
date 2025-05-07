"use client"

import type React from "react"
import type { Database } from "@/types/supabase"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditLesson() {
  const params = useParams()
  const lessonId = params.id as string
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/sign-in")
          return
        }

        // Fetch the lesson
        const { data: lesson, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", lessonId as string)
          .single()

        if (error || !lesson) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Lesson not found",
          })
          router.push("/dashboard")
          return
        }

        // Check if user is the instructor
        if (lesson.instructor_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Unauthorized",
            description: "You don't have permission to edit this lesson",
          })
          router.push("/dashboard")
          return
        }

        // Set form values
        setTitle(lesson.title)
        setDescription(lesson.description || "")
        setPrice(lesson.price.toString())
        setCurrentThumbnail(lesson.thumbnail_url)
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load lesson",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [supabase, params.id, router, toast, lessonId])

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
      setSaving(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Upload thumbnail if provided
      let thumbnailUrl = currentThumbnail
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
          // Continue with current thumbnail if upload fails
        } else {
          // Get public URL
          const { data: publicThumbnailUrl } = await supabase.storage
            .from("thumbnails")
            .getPublicUrl(`${user.id}/${thumbnailFileName}`)

          thumbnailUrl = publicThumbnailUrl.publicUrl
        }
      }

      // Update lesson in database
      const { error: dbError } = await supabase
        .from("lessons")
        .update({
          title,
          description,
          price: Number.parseFloat(price),
          thumbnail_url: thumbnailUrl, // This will be null if the image was removed
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["lessons"]["Update"])
        .eq("id", lessonId as string)

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Lesson updated successfully.",
      })

      // Redirect to lesson management page
      router.push(`/dashboard/lessons/${lessonId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update lesson. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading lesson data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/lessons/${lessonId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Lesson</h1>
          <p className="text-muted-foreground">Update your lesson details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>Update the information for your lesson</CardDescription>
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
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">Set a fair price for your lesson (set to 0 for free lessons)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <div className="border rounded-md p-4">
                {(thumbnailPreview || currentThumbnail) ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <div className="relative w-full h-full">
                        <Image
                          src={thumbnailPreview || currentThumbnail || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        asChild
                      >
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleThumbnailChange}
                          />
                          Choose New Image
                        </label>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                          setCurrentThumbnail(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
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
              <Link href={`/dashboard/lessons/${lessonId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
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
        </form>
      </Card>
    </div>
  )
}

