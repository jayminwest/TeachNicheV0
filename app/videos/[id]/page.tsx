import { createServerClient } from "@/lib/supabase/server"
import { formatPrice } from "@/utilities/formatting/currency"
import { refreshVideoUrlServer } from "@/utilities/file/video"
import { Button } from "@/components/ui/button"
import { CheckCircle, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import VideoCheckoutButton from "@/components/video-checkout-button"
import { format } from "date-fns"

// Define props inline for the Page component - using any for diagnosis
export default async function VideoDetail({ 
  params 
}: any) {
  const supabase = createServerClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user || null

  // Fetch the video
  let { data: video, error } = await supabase.from("lessons").select("*").eq("id", params.id).single()
  
  let videoUrl = null;
  
  if (error || !video) {
    // Try legacy videos table if not found in lessons
    const { data: legacyVideo, error: legacyError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", params.id)
      .single()
    
    if (legacyError || !legacyVideo) {
      console.error("Error fetching video:", error, legacyError)
      notFound()
    }
    
    // Continue with legacyVideo as video
    video = legacyVideo;
  }
  
  // If the video has a video URL, refresh it to ensure it's not expired
  try {
    if (video?.video_url) {
      videoUrl = await refreshVideoUrlServer(video.video_url);
      video.video_url = videoUrl;
    }
  } catch (refreshError) {
    console.error("Error refreshing video URL:", refreshError);
    // Keep the original URL if refresh fails
  }

  // Fetch instructor information
  let instructorEmail = "Instructor"
  if (video.instructor_id) {
    const { data: instructorData } = await supabase
      .from("users")
      .select("email")
      .eq("id", video.instructor_id)
      .single()

    if (instructorData) {
      instructorEmail = instructorData.email
    } else {
      // Fallback to auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(video.instructor_id)
      if (authUser?.user) {
        instructorEmail = authUser.user.email || "Instructor"
      }
    }
  }

  // Fetch parent lesson if this video is part of a lesson
  let lesson = null
  if (video.parent_lesson_id || video.lesson_id) {
    const lessonId = video.parent_lesson_id || video.lesson_id
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("id", lessonId)
      .single()
    
    if (lessonData) {
      lesson = lessonData
    }
  }

  // Check if the user has purchased this video or its parent lesson
  let hasPurchased = false
  if (user) {
    // Check direct purchase of this video
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("lesson_id", video.id)
      .maybeSingle()

    if (purchaseError) {
      console.error("Error checking purchase:", purchaseError)
    }

    hasPurchased = !!purchase

    // If not purchased directly, check if parent lesson was purchased
    if (!hasPurchased && (video.parent_lesson_id || video.lesson_id)) {
      const lessonId = video.parent_lesson_id || video.lesson_id
      const { data: lessonPurchase, error: lessonPurchaseError } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle()

      if (lessonPurchaseError) {
        console.error("Error checking lesson purchase:", lessonPurchaseError)
      }

      hasPurchased = !!lessonPurchase
    }
  }

  // Check if the user is the instructor
  const isInstructor = user?.id === video.instructor_id

  // Format the created date
  const createdDate = format(new Date(video.created_at), "MMMM d, yyyy")

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-5">
        <div className="col-span-3">
          <div className="aspect-video mb-4 relative rounded-lg overflow-hidden border">
            {(hasPurchased || isInstructor) && video.video_url ? (
              <video 
                src={video.video_url} 
                controls 
                className="w-full h-full object-contain"
                poster={video.thumbnail_url || "/placeholder.svg?height=300&width=500"}
              />
            ) : (
              <>
                <Image
                  src={video.thumbnail_url || "/placeholder.svg?height=300&width=500"}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center p-4">
                    <Lock className="mx-auto h-12 w-12 mb-2 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">Purchase Required</h3>
                    <p className="text-muted-foreground mb-4">Purchase this video to watch</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span>Instructor: {instructorEmail}</span>
            <span>•</span>
            <span>Created on {createdDate}</span>
            {lesson && (
              <>
                <span>•</span>
                <span>
                  Part of lesson:{" "}
                  <Link href={`/lessons/${lesson.id}`} className="text-primary hover:underline">
                    {lesson.title}
                  </Link>
                </span>
              </>
            )}
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">About this video</h2>
            <p className="text-muted-foreground">{video.description || "No description provided."}</p>
          </div>
        </div>

        <div className="col-span-2">
          <div className="sticky top-6">
            <div className="border rounded-lg p-6">
              <p className="text-3xl font-bold mb-6">{formatPrice(video.price)}</p>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Sign in to purchase this video</p>
                  <Button className="w-full" asChild>
                    <Link href={`/auth/sign-in?redirectedFrom=/videos/${video.id}`}>Sign in</Link>
                  </Button>
                </div>
              ) : isInstructor ? (
                <div className="p-4 bg-muted rounded-md text-center">
                  <p>This is your video</p>
                </div>
              ) : hasPurchased ? (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p>You own this video</p>
                </div>
              ) : (
                <VideoCheckoutButton videoId={video.id} price={video.price} title={video.title} />
              )}

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">This video includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>HD video tutorial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Lifetime access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Watch on any device</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
