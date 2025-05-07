"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation" // Import useParams
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, Edit, Eye, Loader2, Trash } from "lucide-react"
import { Lesson } from "@/types/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"

// Remove props interface and props from function signature
function ManageLesson() {
  const params = useParams<{ id: string }>() // Use the hook to get params
  const [lesson, setLesson] = useState<Lesson | null>(null)
  // const [videos, setVideos] = useState<any[]>([]) // Removed videos state
  const [loading, setLoading] = useState(true)
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // Removed video delete dialog state
  // const [deletingVideo, setDeletingVideo] = useState<any>(null) // Removed deleting video state
  const [deletingLesson, setDeletingLesson] = useState(false)
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLessonData = async () => {
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
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", params.id)
          .single()

        if (lessonError || !lessonData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Lesson not found",
          })
          router.push("/dashboard")
          return
        }

        // Check if user is the instructor
        if (lessonData.instructor_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Unauthorized",
            description: "You don't have permission to manage this lesson",
          })
          router.push("/dashboard")
          return
        }

        setLesson(lessonData)

        // Removed fetching child lessons (videos)
        
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load lesson data",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLessonData()
  }, [supabase, params.id, router, toast])

  // Removed handleRemoveVideo function

  const handleDeleteLesson = async () => {
    try {
      setDeletingLesson(true)

      // No need to update child lessons anymore

      // Delete the lesson directly
      const { error: lessonError } = await supabase.from("lessons").delete().eq("id", params.id)

      if (lessonError) throw lessonError

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete lesson",
      })
      setDeletingLesson(false)
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
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Manage Lesson</h1>
          <p className="text-muted-foreground">Add, remove, and organize videos in your lesson</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/lessons/${params.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/lessons/${params.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteLessonDialogOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video relative rounded-md overflow-hidden border">
                <Image
                  src={lesson?.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                  alt={lesson?.title || "Lesson thumbnail"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{lesson?.title || "Untitled Lesson"}</h2>
                <p className="text-muted-foreground mt-1 line-clamp-3">{lesson?.description || "No description"}</p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{lesson?.price !== undefined ? formatPrice(lesson.price) : '$0.00'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{lesson?.created_at ? format(new Date(lesson.created_at), "MMM d, yyyy") : "Unknown"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{lesson?.updated_at ? format(new Date(lesson.updated_at), "MMM d, yyyy") : "Unknown"}</span>
                </div>
                {/* Removed Videos count */}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/lessons/${params.id}/edit`}>Edit Lesson Details</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Removed the entire "Videos in this Lesson" Card */}
        
      </div>

      {/* Removed Dialog for removing a video from the lesson */}
      
      {/* Dialog for deleting the lesson */}
      <Dialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone. Videos in this lesson will not
              be deleted, but they will no longer be part of this lesson.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-lg bg-destructive/10">
            <h3 className="font-medium">{lesson?.title}</h3>
            {/* Removed video count from delete dialog */}
            <p className="text-sm text-muted-foreground mt-1">This action cannot be undone.</p> 
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLessonDialogOpen(false)} disabled={deletingLesson}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLesson} disabled={deletingLesson}>
              {deletingLesson ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Lesson"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageLesson; // Keep the separate export

