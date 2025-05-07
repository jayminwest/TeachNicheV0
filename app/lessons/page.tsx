import { createServerClient } from "@/lib/supabase/server"
import { LessonCard } from "@/components/lesson-card"
import { LessonCreationGuide } from "@/components/lesson-creation-guide"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function LessonsPage() {
  const supabase = await createServerClient()

  // Get the authenticated user (more secure than session)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all lessons
  const { data: rawLessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false })
  
    
  // Process lessons to add instructor names
  const lessons = await Promise.all((rawLessons || []).map(async (lesson) => {
    // Get instructor name
    let instructorName = "Instructor";
    if (lesson?.instructor_id) {
      // First try to get the name from the public.users table
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", lesson.instructor_id)
        .single();
      
      if (userData?.name) {
        instructorName = userData.name;
      } else {
        // Then try to get instructor profile
        const { data: instructorProfile } = await supabase
          .from("instructor_profiles")
          .select("name")
          .eq("user_id", lesson.instructor_id)
          .single();
        
        if (instructorProfile?.name) {
          instructorName = instructorProfile.name;
        } else {
          // Finally try to get user data from auth
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(lesson.instructor_id);
            
            if (authUser?.user) {
              // Extract name from email if available (before the @ symbol)
              if (authUser.user.email) {
                const emailParts = authUser.user.email.split('@');
                instructorName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
              }
              
              // Use user metadata name if available
              if (authUser.user.user_metadata?.full_name) {
                instructorName = authUser.user.user_metadata.full_name;
              }
            }
          } catch (err) {
            console.error("Error fetching auth user:", err);
          }
        }
      }
    }
    
    return {
      ...lesson,
      instructorName
    };
  }));

  // Define interface for purchased lesson IDs
  interface PurchasedLessonId {
    original: string;
    normalized: string;
  }
  
  // If user is logged in, fetch their purchased lessons
  let purchasedLessonIds: PurchasedLessonId[] = []
  if (user) {
    // Debug output to server console
    console.log("User is logged in:", user.id);
    
    // Let's simplify our approach to fetching purchased lessons
    const { data: purchasedLessons, error: purchaseError } = await supabase
      .from("purchases")
      .select("*")  // Select all fields for debugging
      .eq("user_id", user.id)
      
    if (purchaseError) {
      console.error("Error fetching purchased lessons:", purchaseError);
    } else {
      console.log("Raw purchase data:", JSON.stringify(purchasedLessons));
    }
    
    // Extract lesson_ids and normalize for consistent comparison
    if (purchasedLessons) {
      purchasedLessonIds = purchasedLessons
        .filter(p => p.lesson_id) // Only include records with a lesson_id
        .map(p => {
          let lessonId: string;
          
          // Extract the ID based on data type
          if (typeof p.lesson_id === 'string') {
            lessonId = p.lesson_id;
          } else if (typeof p.lesson_id === 'object' && p.lesson_id !== null) {
            lessonId = (p.lesson_id as any).id || String(p.lesson_id);
          } else {
            lessonId = String(p.lesson_id);
          }
          
          // Normalize the ID - remove hyphens and convert to lowercase
          const normalizedId = lessonId.replace(/-/g, '').toLowerCase();
          
          console.log(`Extracted lesson_id: ${lessonId} from purchase ${p.id}, normalized: ${normalizedId}`);
          return {
            original: lessonId,
            normalized: normalizedId
          };
        });
    }
      
    console.log("Purchased lessons:", purchasedLessonIds);
  }


  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Lessons</h1>
          <p className="text-muted-foreground">Browse our collection of kendama lessons</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <LessonCreationGuide className="w-full" />
          <Button className="w-full" asChild>
            <Link href="/dashboard/upload">Become an Instructor</Link>
          </Button>
        </div>
      </div>

      {lessons && lessons.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              title={lesson.title}
              thumbnailUrl={lesson.thumbnail_url || "/placeholder.svg?height=200&width=300"}
              price={lesson.price}
              isPurchased={purchasedLessonIds.some(item => {
                // Compare both original and normalized IDs for maximum compatibility
                const lessonIdStr = lesson.id.toString();
                const normalizedLessonId = lessonIdStr.replace(/-/g, '').toLowerCase();
                return item.original === lessonIdStr || 
                       item.normalized === normalizedLessonId ||
                       item.normalized.includes(normalizedLessonId) ||
                       normalizedLessonId.includes(item.normalized);
              })}
              instructorName={lesson.instructorName}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No lessons available yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to create content on our platform!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
            <LessonCreationGuide className="w-full" />
            <Button className="w-full" asChild>
              <Link href="/dashboard/upload">Become an Instructor</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

