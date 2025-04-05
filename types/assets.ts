/**
 * Asset Types for TeachNiche
 * This file contains type definitions related to assets like images, icons, fonts, etc.
 */

// Image size variants
export type ImageSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'original';

// Image format types
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'avif' | 'svg';

// Image category types for organization
export type ImageCategory = 
  | 'hero' 
  | 'profile' 
  | 'thumbnail' 
  | 'background' 
  | 'logo'
  | 'placeholder';

// Icon size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Document file types
export type DocumentType = 'pdf' | 'doc' | 'docx' | 'txt';

// Video file types
export type VideoFormat = 'mp4' | 'webm' | 'ogg';

// Font file types
export type FontFormat = 'ttf' | 'woff' | 'woff2';

/**
 * Asset path interface for strongly typed asset references
 */
export interface AssetPath {
  type: 'image' | 'icon' | 'font' | 'video' | 'document';
  path: string;
  
  // Additional metadata for the asset
  size?: ImageSize;
  format?: ImageFormat | DocumentType | VideoFormat | FontFormat;
  category?: ImageCategory;
  name: string;
}
