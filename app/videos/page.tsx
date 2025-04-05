import { createServerClient } from "@/lib/supabase/server"
import { VideoCard } from "@/components/video-card"
import { formatPrice } from "@/utilities/formatting/currency"

export default async function VideosPage() {
  const supabase = createServerClient()

  // Fetch all videos
  const { data: videos } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">All Tutorials</h1>
      <p className="text-muted-foreground mb-8">Browse our collection of kendama tutorial videos</p>

      {videos && videos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnailUrl={video.thumbnail_url || "/placeholder.svg?height=200&width=300"}
              price={formatPrice(video.price)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No videos available yet</h3>
          <p className="text-muted-foreground">Check back soon for new tutorials!</p>
        </div>
      )}
    </div>
  )
}
