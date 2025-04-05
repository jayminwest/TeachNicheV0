"use client";

import { useEffect, useState, useRef } from "react";
import { refreshVideoUrl } from "@/utilities/file/video";

interface VideoPlayerProps {
  initialVideoUrl: string;
  lessonId: string;
  title?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ initialVideoUrl, lessonId, title, autoPlay = false }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Track if we've already refreshed the URL to prevent infinite loops
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const refreshAttempts = useRef(0);
  
  // Use a ref to track if the component is mounted and a refresh is in progress
  const isMounted = useRef(false);
  const isRefreshing = useRef(false);
  
  // Refresh the URL when the component mounts
  useEffect(() => {
    // Prevent multiple refreshes on the same render cycle
    if (isMounted.current || isRefreshing.current) return;
    isMounted.current = true;
    isRefreshing.current = true;
    
    const refreshUrl = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have a valid URL to refresh
        if (!initialVideoUrl) {
          setError("No video URL provided");
          setIsLoading(false);
          isRefreshing.current = false;
          return;
        }
        
        // Check if we have a cached URL in sessionStorage
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const cachedUrl = sessionStorage.getItem(`video_url_${lessonId}`);
            const cacheTimestamp = sessionStorage.getItem(`video_url_${lessonId}_timestamp`);
            
            if (cachedUrl && cacheTimestamp) {
              const timestamp = parseInt(cacheTimestamp, 10);
              const now = Date.now();
              // Use cached URL if it's less than 30 minutes old
              if (now - timestamp < 30 * 60 * 1000) {
                console.log("Using cached video URL");
                setVideoUrl(cachedUrl);
                setError(null);
                setIsLoading(false);
                isRefreshing.current = false;
                return;
              }
            }
          }
        } catch (e) {
          // Ignore storage errors
        }
        
        // If it's already a signed URL, use it directly
        if (initialVideoUrl.startsWith('http') && initialVideoUrl.includes('supabase')) {
          console.log("Using existing signed URL");
          setVideoUrl(initialVideoUrl);
          setIsLoading(false);
          isRefreshing.current = false;
          return;
        }
        
        // For all URLs, use the API to get a fresh signed URL
        try {
          const response = await fetch("/api/get-video-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lessonId,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              console.log("Got URL from API");
              
              // Cache the URL in sessionStorage
              try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                  sessionStorage.setItem(`video_url_${lessonId}`, data.url);
                  sessionStorage.setItem(`video_url_${lessonId}_timestamp`, Date.now().toString());
                }
              } catch (e) {
                // Ignore storage errors
              }
              
              setVideoUrl(data.url);
              setError(null);
              setIsLoading(false);
              isRefreshing.current = false;
              return;
            }
          } else {
            console.error("API error:", response.status);
          }
        } catch (error) {
          console.error("Error getting URL from API:", error);
        }
        
        // Fallback to client-side refresh
        try {
          console.log("Trying client-side refresh");
          const freshUrl = await refreshVideoUrl(initialVideoUrl);
          
          if (freshUrl) {
            setVideoUrl(freshUrl);
          } else {
            setError("Failed to get video URL");
          }
        } catch (err) {
          console.error("Error in client-side refresh:", err);
          setError("Failed to load video. Please try again.");
        }
        
        setIsLoading(false);
        isRefreshing.current = false;
      } catch (err) {
        console.error("Error in refreshUrl:", err);
        setError("Failed to load video. Please try again.");
        setIsLoading(false);
        isRefreshing.current = false;
      }
    };
    
    refreshUrl();
    
    // Set up a timer to refresh the URL every 25 days (before the 30-day expiration)
    const refreshInterval = setInterval(() => {
      isMounted.current = false; // Allow refresh after interval
      refreshUrl();
    }, 25 * 24 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [initialVideoUrl, lessonId]);
  
  // Use refs to track error handling state
  const isHandlingError = useRef(false);
  const errorRetryCount = useRef(0);
  const MAX_RETRIES = 2;
  
  // Handle video errors (which might occur if the URL expires)
  const handleVideoError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Prevent concurrent error handling and limit retries
    if (isHandlingError.current) return;
    
    // Check if we've exceeded retry limit
    if (errorRetryCount.current >= MAX_RETRIES) {
      setError("Unable to play video after multiple attempts. Please try again later.");
      return;
    }
    
    isHandlingError.current = true;
    errorRetryCount.current += 1;
    
    console.log(`Video error occurred, attempt ${errorRetryCount.current}/${MAX_RETRIES}`);
    
    try {
      setIsLoading(true);
      setError("Video playback error. Attempting to refresh...");
      
      // For error recovery, use a simpler approach - just use the lesson ID
      // This avoids issues with URL encoding/decoding
      console.log("Using lesson ID for recovery:", lessonId);
      
      // Try to get a fresh URL from the API
      const response = await fetch("/api/get-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Store the URL in sessionStorage to prevent repeated API calls
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem(`video_url_${lessonId}`, data.url);
              sessionStorage.setItem(`video_url_${lessonId}_timestamp`, Date.now().toString());
            }
          } catch (e) {
            // Ignore storage errors
          }
          
          setVideoUrl(data.url);
          setError(null);
          
          // Reload the video with the new URL
          if (videoRef.current) {
            videoRef.current.load();
            if (autoPlay) {
              videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
          }
        } else {
          setError("Failed to get video URL. Please try refreshing the page.");
        }
      } else {
        // For non-200 responses, show a more user-friendly error
        setError("Unable to play video. Please try refreshing the page.");
      }
    } catch (error) {
      console.error("Error refreshing video URL:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      isHandlingError.current = false;
      
      // Set a timeout before allowing another retry
      setTimeout(() => {
        isHandlingError.current = false;
      }, 3000);
    }
  };
  
  // Helper function to extract video path from URL
  const extractVideoPathFromUrl = (url: string): string => {
    try {
      if (!url) return "";
      
      // First, decode the URL to handle any encoded characters
      let decodedUrl = url;
      try {
        // Decode URL if it contains encoded characters
        if (url.includes('%')) {
          decodedUrl = decodeURIComponent(url);
        }
      } catch (e) {
        console.error("Error decoding URL:", e);
        // Continue with original URL if decoding fails
        decodedUrl = url;
      }
      
      // Handle Supabase storage URLs
      if (decodedUrl.includes('/videos/')) {
        const urlParts = decodedUrl.split('/videos/');
        if (urlParts.length < 2) return "";
        
        const pathParts = urlParts[1].split('?');
        return pathParts[0];
      }
      
      // Handle direct file paths that might be in the format /lessons/{id}/{filename}
      if (decodedUrl.includes('/lessons/')) {
        const pathParts = decodedUrl.split('/lessons/');
        if (pathParts.length < 2) return "";
        
        // Extract the filename after the lesson ID
        const lessonParts = pathParts[1].split('/');
        if (lessonParts.length >= 2) {
          return lessonParts[1];
        } else {
          // If there's no second part, the URL might be in a different format
          // Just return the filename part after the last slash
          const parts = decodedUrl.split('/');
          return parts[parts.length - 1];
        }
      }
      
      // If the URL contains the lesson ID as a prefix
      if (decodedUrl.includes(lessonId + '/')) {
        // Extract just the filename part
        const parts = decodedUrl.split('/');
        if (parts.length >= 2) {
          return parts[parts.length - 1];
        }
        return decodedUrl;
      }
      
      // If it's just a filename, return it directly
      if (!decodedUrl.includes('/')) {
        return decodedUrl;
      }
      
      // Last resort: extract filename from the URL (anything after the last slash)
      const parts = decodedUrl.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !lastPart.includes('?')) {
        return lastPart;
      } else if (lastPart) {
        // Remove query parameters if present
        return lastPart.split('?')[0];
      }
      
      return "";
    } catch (error) {
      console.error("Error extracting video path:", error);
      return "";
    }
  };

  // Function to fetch video path from lesson video_url if needed
  const fetchVideoPathFromLesson = async (): Promise<string | null> => {
    try {
      // Use the get-video-url API directly since we already have the lessonId
      const response = await fetch(`/api/get-video-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
        }),
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.url || null;
    } catch (error) {
      console.error("Error fetching video path from lesson:", error);
      return null;
    }
  };
  
  return (
    <div className="relative aspect-video bg-black rounded-md overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
          <div className="text-white text-center">
            <p>{error}</p>
            <button 
              onClick={() => handleVideoError({} as any)} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        controls
        playsInline
        onError={handleVideoError}
        title={title}
        onLoadedData={() => setIsLoading(false)}
        autoPlay={autoPlay}
      />
    </div>
  );
}
