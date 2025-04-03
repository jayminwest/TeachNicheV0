import { createServerClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CheckCircle, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import CheckoutButton from "@/components/checkout-button"
import { format } from "date-fns"

export default async function VideoDetail({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user || null

  // Fetch the video
  const { data: video, error } = await supabase
    .from("videos")
    .select("*, instructor_id(email)")
    .eq("id", params.id)
    .single()

  if (error || !video) {
    notFound()
  }

  // Check if the user has purchased this video
  let hasPurchased = false
  if (user) {
    // Check if the user has purchased this video directly
    const { data: videoPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", video.id)
      .maybeSingle()

    // If the video is part of a lesson, check if the user has purchased the lesson
    if (video.lesson_id) {
      const { data: lessonPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", video.lesson_id)
        .maybeSingle()

      hasPurchased = !!videoPurchase || !!lessonPurchase
    } else {
      hasPurchased = !!videoPurchase
    }
  }

  // Check if the user is the instructor
  const isInstructor = user?.id === video.instructor_id

  // Format the created date
  const createdDate = format(new Date(video.created_at), "MMMM d, yyyy")

  // If the video is part of a lesson, get the lesson details
  let lesson = null
  if (video.lesson_id) {
    const { data: lessonData } = await supabase.from("lessons").select("id, title").eq("id", video.lesson_id).single()

    lesson = lessonData
  }

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-5">
        <div className="col-span-3">
          <div className="aspect-video mb-4 relative rounded-lg overflow-hidden border">
            {hasPurchased || isInstructor ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <video
                  src={video.video_url}
                  poster={video.thumbnail_url || "/placeholder.svg?height=300&width=500"}
                  controls
                  className="w-full h-full"
                />
              </div>
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
                    <p className="text-muted-foreground mb-4">Purchase this video to start learning</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span>Instructor: {(video.instructor_id as any).email}</span>
            <span>•</span>
            <span>Uploaded on {createdDate}</span>
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
            <h2 className="text-xl font-semibold mb-2">About this tutorial</h2>
            <p className="text-muted-foreground">{video.description || "No description provided."}</p>
          </div>
        </div>

        <div className="col-span-2">
          <div className="sticky top-6">
            <div className="border rounded-lg p-6">
              <p className="text-3xl font-bold mb-6">{formatPrice(video.price)}</p>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Sign in to purchase this tutorial</p>
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
              ) : lesson ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="mb-2">This video is part of a lesson</p>
                    <Button asChild className="w-full">
                      <Link href={`/lessons/${lesson.id}`}>View Lesson</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <CheckoutButton videoId={video.id} price={video.price} title={video.title} />
              )}

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">This tutorial includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Full HD video tutorial</span>
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

