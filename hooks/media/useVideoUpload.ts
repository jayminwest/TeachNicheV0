/**
 * @file Video upload hook
 * @description Provides functionality for handling video uploads to Supabase storage
 */

import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

/**
 * Video file metadata
 */
export interface VideoMetadata {
  /** Video file name */
  name: string;
  /** Video file size in bytes */
  size: number;
  /** Video mime type */
  type: string;
  /** Video duration in seconds */
  duration?: number;
  /** Video thumbnail URL */
  thumbnailUrl?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  percent: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
}

/**
 * Video upload result
 */
export interface VideoUploadResult {
  /** Public URL of the uploaded video */
  url: string;
  /** Path to the video in storage */
  path: string;
  /** Video metadata */
  metadata: VideoMetadata;
}

/**
 * Video upload options
 */
export interface UseVideoUploadOptions {
  /** Storage bucket name */
  bucketName?: string;
  /** Storage folder path */
  folderPath?: string;
  /** Max file size in bytes (default: 2GB) */
  maxSize?: number;
  /** Allowed mime types */
  allowedTypes?: string[];
  /** Whether to generate a thumbnail (default: true) */
  generateThumbnail?: boolean;
  /** Progress update callback */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Video upload hook result
 */
export interface UseVideoUploadResult {
  /** Upload the video file */
  uploadVideo: (file: File) => Promise<VideoUploadResult>;
  /** Current upload progress (0-100) */
  progress: number;
  /** Whether upload is in progress */
  uploading: boolean;
  /** Error that occurred during upload */
  error: Error | null;
  /** Reset the upload state */
  reset: () => void;
  /** Metadata of the last uploaded video */
  videoMetadata: VideoMetadata | null;
}

/**
 * Custom hook for video uploads to Supabase storage
 * 
 * @example
 * ```tsx
 * const VideoUploadComponent = () => {
 *   const { 
 *     uploadVideo, 
 *     progress, 
 *     uploading, 
 *     error, 
 *     videoMetadata 
 *   } = useVideoUpload({
 *     bucketName: 'videos',
 *     folderPath: 'lessons/',
 *     maxSize: 2 * 1024 * 1024 * 1024, // 2GB
 *     allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
 *     onProgress: (progress) => console.log(`Upload progress: ${progress.percent}%`)
 *   });
 * 
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *     
 *     try {
 *       const result = await uploadVideo(file);
 *       console.log('Upload successful:', result.url);
 *     } catch (err) {
 *       console.error('Upload failed:', err);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <input type="file" accept="video/*" onChange={handleFileChange} />
 *       
 *       {uploading && (
 *         <div className="progress-bar">
 *           <div className="progress" style={{ width: `${progress}%` }}></div>
 *           <span>{progress.toFixed(0)}%</span>
 *         </div>
 *       )}
 *       
 *       {error && <div className="error">{error.message}</div>}
 *       
 *       {videoMetadata && (
 *         <div className="video-info">
 *           <h3>Uploaded: {videoMetadata.name}</h3>
 *           <p>Size: {(videoMetadata.size / (1024 * 1024)).toFixed(2)} MB</p>
 *           {videoMetadata.duration && <p>Duration: {videoMetadata.duration.toFixed(1)}s</p>}
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 * 
 * @param options Upload configuration options
 * @returns Video upload state and handlers
 */
export function useVideoUpload({
  bucketName = 'videos',
  folderPath = '',
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB default (matches app limit)
  allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'],
  generateThumbnail = true,
  onProgress,
}: UseVideoUploadOptions = {}): UseVideoUploadResult {
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  
  /**
   * Generate a thumbnail from a video file
   */
  const generateVideoThumbnail = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.playsInline = true;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        // Seek to 25% of the video
        video.currentTime = video.duration * 0.25;
      };
      
      video.onseeked = () => {
        // Create canvas and draw video frame
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        } else {
          resolve(undefined);
        }
      };
      
      video.onerror = () => {
        resolve(undefined);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };
  
  /**
   * Extract metadata from a video file
   */
  const extractVideoMetadata = async (file: File): Promise<VideoMetadata> => {
    const metadata: VideoMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
    };
    
    // Extract duration
    try {
      const video = document.createElement('video');
      await new Promise<void>((resolve, reject) => {
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          metadata.duration = video.duration;
          resolve();
        };
        video.onerror = () => reject(new Error('Failed to load video metadata'));
        video.src = URL.createObjectURL(file);
      });
    } catch (err) {
      console.warn('Could not extract video duration:', err);
    }
    
    // Generate thumbnail if enabled
    if (generateThumbnail) {
      try {
        metadata.thumbnailUrl = await generateVideoThumbnail(file);
      } catch (err) {
        console.warn('Could not generate thumbnail:', err);
      }
    }
    
    return metadata;
  };
  
  /**
   * Upload a video file to Supabase storage
   */
  const uploadVideo = async (file: File): Promise<VideoUploadResult> => {
    try {
      setError(null);
      setProgress(0);
      setUploading(true);
      
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      }
      
      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${(maxSize / (1024 * 1024 * 1024)).toFixed(1)}GB`);
      }
      
      // Extract video metadata
      const metadata = await extractVideoMetadata(file);
      setVideoMetadata(metadata);
      
      // Clean filename by replacing spaces with underscores
      const cleanedFileName = file.name.replace(/\s+/g, '_');
      const fileName = `${Date.now()}-${cleanedFileName}`;
      const filePath = `${folderPath}${fileName}`;
      
      // For large files, simulate progress
      let progressInterval: NodeJS.Timeout | null = null;
      if (file.size > 50 * 1024 * 1024) {
        progressInterval = setInterval(() => {
          setProgress(prev => {
            // Don't go above 90% until we confirm upload is complete
            return prev < 90 ? prev + 1 : prev;
          });
        }, 1000);
      }
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
      
      // Clear the interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Set to 100% when upload completes
      setProgress(100);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      return {
        url: publicUrl,
        path: data.path,
        metadata,
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    } finally {
      setUploading(false);
    }
  };
  
  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setVideoMetadata(null);
  }, []);
  
  return {
    uploadVideo,
    progress,
    uploading,
    error,
    reset,
    videoMetadata,
  };
}
