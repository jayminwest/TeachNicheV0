import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { format } from "date-fns"

// Mark this page as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic';

export default async function Library() {
  // For Next.js 15, createServerClient is async
  const supabase = await createServerClient();

  try {
    // Get the current user with proper error handling
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Auth error:", error);
      redirect("/auth/sign-in?redirectedFrom=/library");
    }
    
    if (!data.session) {
      redirect("/auth/sign-in?redirectedFrom=/library");
    }
    
    // Get the user from the session
    const user = data.session.user;

    // Fetch the user's purchased lessons with multiple fallback methods
    let purchasedLessons;
    
    // Try 1: Use the view (most efficient)
    const { data: viewLessons, error: viewError } = await supabase
      .from("user_purchased_lessons")
      .select("*")
      .eq("user_id", user.id);
      
    if (viewLessons && viewLessons.length > 0) {
      purchasedLessons = viewLessons;
    } else {
      console.log("No lessons found via view or view error:", viewError);
      
      // Try 2: Check purchases table directly
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("*, created_at")
        .eq("user_id", user.id);
        
      if (purchases && purchases.length > 0) {
        // Extract valid lesson IDs and create a purchase map
        const validPurchases = purchases.filter(p => p.lesson_id);
        const purchaseDates = new Map<string, string>();
        
        // Store purchase dates by lesson ID
        validPurchases.forEach(p => {
          if (p.lesson_id) {
            purchaseDates.set(String(p.lesson_id), p.created_at);
          }
        });
        
        // Get unique lesson IDs
        const lessonIds = Array.from(purchaseDates.keys());
        
        // Get the lesson details
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id, title, description, thumbnail_url, instructor_id, price")
          .in("id", lessonIds);
          
        // Combine the purchase and lesson data
        if (lessons) {
          purchasedLessons = lessons.map(lesson => {
            return {
              user_id: user.id,
              lesson_id: lesson.id,
              title: lesson.title || "Untitled Lesson",
              description: lesson.description || "",
              thumbnail_url: lesson.thumbnail_url || null,
              purchase_date: purchaseDates.get(lesson.id) || new Date().toISOString(),
              instructor_id: lesson.instructor_id || null,
              price: lesson.price || 0
            };
          });
        }
      } else {
        console.log("No purchases found or error:", purchasesError);
        
        // Try 3: Get lessons where user is instructor
        const { data: instructorLessons } = await supabase
          .from("lessons")
          .select("id as lesson_id, title, description, thumbnail_url, instructor_id, price, created_at as purchase_date")
          .eq("instructor_id", user.id);
          
        purchasedLessons = instructorLessons;
      }
    }

    if (!purchasedLessons || purchasedLessons.length === 0) {
      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">My Library</h1>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">You haven't purchased any lessons yet</h3>
            <p className="text-muted-foreground mb-6">Browse our collection of kendama tutorials to start learning</p>
            <Link
              href="/lessons"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse Lessons
            </Link>
          </div>
        </div>
      );
    }
    
    // If we get here, we have lessons to display
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        <p className="text-muted-foreground mb-8">Access your purchased kendama content</p>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">My Lessons</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchasedLessons.map((lesson) => (
              <Card key={lesson.lesson_id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <Image
                    src={lesson.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                    alt={lesson.title || "Lesson"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{lesson.title || "Untitled Lesson"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased:</span>
                    <span>{format(new Date(lesson.purchase_date || new Date()), "MMM d, yyyy")}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/lessons/${lesson.lesson_id}`}>View Lesson</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Unexpected error in Library page:", err);
    // Provide a fallback UI for errors
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-6">We couldn't load your library. Please try again later.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }
}