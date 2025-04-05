/**
 * Storage utilities for file operations
 * 
 * Functions for interacting with storage systems and file operations.
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Uploads a file to Supabase storage
 * 
 * @param supabase - Supabase client
 * @param bucket - Storage bucket name
 * @param path - Path to store the file (including filename)
 * @param file - File object to upload
 * @param options - Upload options
 * @returns Upload result with URL if successful
 * 
 * @example
 * const { url, error } = await uploadFile(
 *   supabase,
 *   'videos',
 *   `user123/${file.name}`,
 *   file
 * );
 * 
 * if (error) {
 *   console.error('Upload failed:', error);
 * } else {
 *   console.log('File uploaded to:', url);
 * }
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
  options?: { contentType?: string; cacheControl?: string }
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        contentType: options?.contentType || file.type,
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Creates a signed URL for a file in storage
 * 
 * @param supabase - Supabase client
 * @param bucket - Storage bucket name
 * @param path - Path to the file
 * @param expiresIn - Expiry time in seconds (default: 30 days)
 * @returns Signed URL if successful
 * 
 * @example
 * const signedUrl = await createSignedUrl(
 *   supabase,
 *   'videos',
 *   'user123/video.mp4',
 *   3600 // 1 hour
 * );
 */
export async function createSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn: number = 60 * 60 * 24 * 30
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
}

/**
 * Deletes a file from storage
 * 
 * @param supabase - Supabase client
 * @param bucket - Storage bucket name
 * @param path - Path to the file to delete
 * @returns Success status and any error
 * 
 * @example
 * const { success, error } = await deleteFile(
 *   supabase,
 *   'videos',
 *   'user123/video.mp4'
 * );
 * 
 * if (success) {
 *   console.log('File deleted successfully');
 * }
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}
