/**
 * File validation utilities
 * 
 * Functions for validating file types, extensions, sizes, and other properties.
 */

/**
 * Maximum allowed video file size in bytes (2GB)
 */
export const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * List of allowed video file extensions
 */
export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "webm"];

/**
 * Extracts the file extension from a filename
 * 
 * @param filename - The name of the file including extension
 * @returns The lowercase extension (without the dot) or null if no extension
 * 
 * @example
 * const ext = getVideoExtension("myvideo.MP4");
 * // Returns "mp4"
 * 
 * const ext = getVideoExtension("file_without_extension");
 * // Returns null
 */
export function getVideoExtension(filename: string): string | null {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Checks if a file extension is a valid video format
 * 
 * @param extension - The file extension to check
 * @returns Boolean indicating if the extension is valid
 * 
 * @example
 * if (isValidVideoFormat("mp4")) {
 *   // Process video
 * }
 */
export function isValidVideoFormat(extension: string | null): boolean {
  if (!extension) return false;
  return ALLOWED_VIDEO_EXTENSIONS.includes(extension);
}

/**
 * Validates if a file size is within the allowed limit for videos
 * 
 * @param fileSize - The file size in bytes
 * @returns Boolean indicating if the file size is valid
 * 
 * @example
 * const file = event.target.files[0];
 * if (isValidVideoSize(file.size)) {
 *   // Upload video
 * } else {
 *   // Show error message
 * }
 */
export function isValidVideoSize(fileSize: number): boolean {
  return fileSize <= MAX_VIDEO_SIZE_BYTES;
}
