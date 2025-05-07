"use client"

import type { Database } from "@/types/supabase"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddVideosToLesson() {
  const [lessons, setLessons] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonIdFromUrl = searchParams.get("lessonId")
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch user's parent lessons
        const { data: userLessons, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .eq("instructor_id", user.id as string)
          .is("parent_lesson_id", null)
          .order("title", { ascending: true })

        if (lessonsError) throw lessonsError
        setLessons(userLessons || [])

        // If lessonId is provided in URL, set it as selected
        if (lessonIdFromUrl) {
          setSelectedLessonId(lessonIdFromUrl)
          const lesson = userLessons?.find((l) => l.id === lessonIdFromUrl)
          if (lesson) {
            setSelectedLesson(lesson)
          }
        }

        // Fetch user's other lessons with videos that could be added
        const { data: userVideos, error: videosError } = await supabase
          .from("lessons")
          .select("*")
          .eq("instructor_id", user.id)
          .not("video_url", "is", null)  // Only get lessons with videos
          .order("created_at", { ascending: false })

        if (videosError) throw videosError
        setVideos(userVideos || [])
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load data",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router, toast, lessonIdFromUrl])

  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId)
    const lesson = lessons.find((l) => l.id === lessonId)
    setSelectedLesson(lesson)
  }

  const handleAddVideoToLesson = async (videoId: string) => {
    if (!selectedLessonId) {
      toast({
        variant: "destructive",
        title: "No lesson selected",
        description: "Please select a lesson first",
      })
      return
    }

    try {
      setUpdating(true)

      // Get the video details
      const videoToAdd = videos.find(v => v.id === videoId)
      if (!videoToAdd) throw new Error("Video not found")

      // Create a new child lesson with the video content
      const { error } = await supabase.from("lessons").insert({
        title: videoToAdd.title,
        description: videoToAdd.description,
        price: videoToAdd.price,
        instructor_id: videoToAdd.instructor_id,
        video_url: videoToAdd.video_url,
        thumbnail_url: videoToAdd.thumbnail_url,
        parent_lesson_id: selectedLessonId
      } as Database["public"]["Tables"]["lessons"]["Insert"])

      if (error) throw error

      // Update local state
      setVideos(videos.filter((video) => video.id !== videoId))

      toast({
        title: "Success",
        description: "Video added to lesson",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add video to lesson",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading data...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Add Videos to Lesson</h1>
          <p className="text-muted-foreground">Add existing videos to a lesson</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Lesson</CardTitle>
          <CardDescription>Choose the lesson you want to add videos to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={selectedLessonId || ""} onValueChange={handleLessonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedLesson && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/20">
          <h2 className="text-lg font-semibold">Selected Lesson: {selectedLesson.title}</h2>
          <p className="text-muted-foreground">{selectedLesson.description || "No description"}</p>
          <div className="mt-2">
            <Button asChild>
              <Link href={`/dashboard/lessons/${selectedLesson.id}`}>Manage This Lesson</Link>
            </Button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Available Videos</h2>

      {videos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={video.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{video.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description || "No description"}</p>
                <p className="font-medium">{formatPrice(video.price)}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleAddVideoToLesson(video.id)}
                  disabled={!selectedLessonId || updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Lesson
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No available videos</h3>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have any standalone videos that can be added to a lesson.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard/upload">Upload New Video</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

