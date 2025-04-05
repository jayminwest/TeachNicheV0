/**
 * Video file handling utilities
 * 
 * Functions for managing video files, URLs, and video-specific operations.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Default expiry time for signed URLs in seconds (30 days)
 */
export const DEFAULT_SIGNED_URL_EXPIRY = 2592000;

/**
 * Refreshes a video URL if it's expired or creates a signed URL if given a path
 * 
 * This client-side utility handles multiple URL formats:
 * - Existing signed URLs from Supabase storage
 * - Direct storage paths (not starting with http)
 * - Other URLs which are returned as-is
 * 
 * @param videoUrl - The current video URL or path
 * @returns A fresh signed URL or the original URL if handling failed
 * 
 * @example
 * // Refresh an existing signed URL
 * const freshUrl = await refreshVideoUrl("https://example.com/storage/v1/object/sign/videos/user123/video.mp4?token=xyz");
 * 
 * // Create a signed URL from a path
 * const signedUrl = await refreshVideoUrl("user123/video.mp4");
 */
export async function refreshVideoUrl(videoUrl: string): Promise<string> {
  const supabase = createClientComponentClient();
  
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
        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoPath, DEFAULT_SIGNED_URL_EXPIRY);
        
        if (error) {
          console.error('Error refreshing video URL:', error);
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
      const cachedUrl = typeof window !== 'undefined' && window.sessionStorage ? 
        sessionStorage.getItem(cacheKey) : null;
      const cacheTimestamp = typeof window !== 'undefined' && window.sessionStorage ? 
        sessionStorage.getItem(`${cacheKey}_timestamp`) : null;
      
      // If we have a cached URL that's less than a minute old, use it
      if (cachedUrl && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        if (now - timestamp < 60000) { // 1 minute cache
          console.log('Using cached signed URL for path');
          return cachedUrl;
        }
      }
      
      console.log('Creating signed URL for path:', videoUrl);
      
      // Create a new signed URL with error handling
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(videoUrl, DEFAULT_SIGNED_URL_EXPIRY);
      
      if (error) {
        console.error('Error creating signed URL for path:', error);
        return videoUrl;
      }
      
      if (!data || !data.signedUrl) {
        console.error('No signed URL returned for path');
        return videoUrl;
      }
      
      // Cache the URL for 1 minute to prevent infinite loops
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(cacheKey, data.signedUrl);
          sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        }
      } catch (e) {
        // Ignore storage errors
      }
      
      console.log('Created signed URL (cached for 1 minute)');
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL for path:', error);
      return videoUrl;
    }
  }
  
  // For any other URL format, return as is
  return videoUrl;
}

/**
 * Refreshes a video URL on the server side if it's expired
 * 
 * @param videoUrl - The current video URL
 * @param supabase - Optional Supabase client to use
 * @returns A fresh signed URL or the original URL if it's still valid
 * 
 * @example
 * const freshUrl = await refreshVideoUrlServer(videoUrl, supabaseServerClient);
 */
export async function refreshVideoUrlServer(
  videoUrl: string, 
  supabase: SupabaseClient
): Promise<string> {
  // Check if this is a signed URL from our videos bucket
  if (!videoUrl || !videoUrl.includes('/storage/v1/object/sign/videos/')) {
    return videoUrl;
  }
  
  try {
    // Extract the path from the URL
    // Format: /storage/v1/object/sign/videos/USER_ID/FILENAME
    const urlParts = videoUrl.split('/videos/');
    if (urlParts.length < 2) return videoUrl;
    
    const pathParts = urlParts[1].split('?');
    const videoPath = pathParts[0];
    
    // Create a new signed URL
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUrl(videoPath, DEFAULT_SIGNED_URL_EXPIRY);
    
    if (error || !data.signedUrl) {
      console.error('Error refreshing video URL:', error);
      return videoUrl;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error parsing video URL:', error);
    return videoUrl;
  }
}
