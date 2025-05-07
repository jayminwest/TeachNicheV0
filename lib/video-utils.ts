import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes a video URL if it's expired or creates a signed URL if given a path
 * @param videoUrl The current video URL or path
 * @returns A fresh signed URL or the original URL if it's still valid
 */
export async function refreshVideoUrl(videoUrl: string): Promise<string> {
  const supabase = createClient();
  
  // If no URL provided, return as is
  if (!videoUrl) {
    return videoUrl;
  }
  
  // If it's already a signed URL from our videos bucket
  if (videoUrl.includes('/storage/v1/object/sign/videos/')) {
    try {
      // Extract the path from the URL
      // Format: /storage/v1/object/sign/videos/USER_ID/FILENAME
      const urlParts = videoUrl.split('/videos/');
      if (urlParts.length < 2) return videoUrl;
      
      const pathParts = urlParts[1].split('?');
      const videoPath = pathParts[0];
      
      // Create a new signed URL with error handling
      try {
        // Use a 12-hour expiry (43200 seconds) for consistency with the API
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        
        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoPath, 43200); // 12 hours
        
        if (error) {
          console.error('Error refreshing video URL:', error);
          
          // If we get a permissions error, try to get a URL through the API instead
          // This is important for supporting purchased videos where RLS may prevent direct signing
          if (error.message?.includes('permission') || error.message?.includes('403')) {
            try {
              // Extract the lesson ID from the URL if possible
              let lessonId = '';
              const parts = videoPath.split('/');
              if (parts.length > 1) {
                lessonId = parts[0]; // First part is often the lesson ID
              }
              
              if (lessonId) {
                const response = await fetch("/api/get-video-url", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    lessonId
                  }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.url) {
                    return data.url;
                  }
                }
              }
            } catch (apiError) {
              console.error('Error getting URL from API:', apiError);
            }
          }
          
          return videoUrl;
        }
        
        if (!data || !data.signedUrl) {
          console.error('No signed URL returned');
          return videoUrl;
        }
        
        return data.signedUrl;
      } catch (signError) {
        console.error('Error creating signed URL:', signError);
        return videoUrl;
      }
    } catch (error) {
      console.error('Error parsing video URL:', error);
      return videoUrl;
    }
  } 
  // If it's not a signed URL but a direct path (not starting with http)
  else if (!videoUrl.startsWith('http')) {
    try {
      // Check if we've already processed this path recently (within the last minute)
      // This helps prevent infinite loops of URL refreshing
      const cacheKey = `video_url_${videoUrl}`;
      const cachedUrl = sessionStorage?.getItem(cacheKey);
      const cacheTimestamp = sessionStorage?.getItem(`${cacheKey}_timestamp`);
      
      // If we have a cached URL that's less than a minute old, use it
      if (cachedUrl && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        if (now - timestamp < 60000) { // 1 minute cache
          return cachedUrl;
        }
      }
      
      // Create a new signed URL with error handling
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(videoUrl, 43200); // 12 hours
      
      if (error) {
        console.error('Error creating signed URL for path:', error);
        
        // If we get a permissions error, try to get a URL through the API instead
        if (error.message?.includes('permission') || error.message?.includes('403')) {
          try {
            // Extract the lesson ID from the URL if possible
            let lessonId = '';
            const parts = videoUrl.split('/');
            if (parts.length > 1) {
              lessonId = parts[0]; // First part is often the lesson ID
            }
            
            if (lessonId) {
              const response = await fetch("/api/get-video-url", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  lessonId
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.url) {
                  // Cache the URL to prevent infinite loops
                  try {
                    if (typeof window !== 'undefined' && window.sessionStorage) {
                      sessionStorage.setItem(cacheKey, data.url);
                      sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
                    }
                  } catch (e) {
                    // Ignore storage errors
                  }
                  
                  return data.url;
                }
              }
            }
          } catch (apiError) {
            console.error('Error getting URL from API:', apiError);
          }
        }
        
        return videoUrl;
      }
      
      if (!data || !data.signedUrl) {
        console.error('No signed URL returned for path');
        return videoUrl;
      }
      
      // Cache the URL for 1 hour to prevent infinite loops
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(cacheKey, data.signedUrl);
          sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        }
      } catch (e) {
        // Ignore storage errors
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL for path:', error);
      return videoUrl;
    }
  }
  
  // For any other URL format, return as is
  return videoUrl;
}
