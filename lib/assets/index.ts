/**
 * Asset Management Utilities
 * This file provides utilities for working with the TeachNiche asset system
 */

import { 
  ImageSize, 
  ImageFormat, 
  ImageCategory, 
  IconSize,
  AssetPath
} from '@/types/assets';

/**
 * Generates a standardized asset path for the given asset type and parameters
 */
export function getAssetPath({
  type,
  name,
  size = 'original',
  format,
  category
}: {
  type: 'image' | 'icon' | 'font' | 'video' | 'document';
  name: string;
  size?: ImageSize;
  format?: string;
  category?: ImageCategory;
}): string {
  // Base path for assets
  const basePath = '/assets';
  
  // Handle different asset types
  switch (type) {
    case 'image':
      // For images, include size directory and category if provided
      const categoryPrefix = category ? `${category}-` : '';
      const sizeDir = size;
      const ext = format || (name.includes('.') ? name.split('.').pop() : 'jpg');
      
      // If name already has extension, don't add it again
      const cleanName = name.includes('.') 
        ? name.substring(0, name.lastIndexOf('.'))
        : name;
        
      return `${basePath}/images/${sizeDir}/${categoryPrefix}${cleanName}.${ext}`;
      
    case 'icon':
      // For icons, no size directory
      const iconExt = format || (name.includes('.') ? name.split('.').pop() : 'svg');
      const cleanIconName = name.includes('.') 
        ? name.substring(0, name.lastIndexOf('.'))
        : name;
        
      return `${basePath}/icons/${cleanIconName}.${iconExt}`;
      
    case 'font':
      const fontExt = format || (name.includes('.') ? name.split('.').pop() : 'woff2');
      const cleanFontName = name.includes('.') 
        ? name.substring(0, name.lastIndexOf('.'))
        : name;
        
      return `${basePath}/fonts/${cleanFontName}.${fontExt}`;
      
    case 'video':
      const videoExt = format || (name.includes('.') ? name.split('.').pop() : 'mp4');
      const cleanVideoName = name.includes('.') 
        ? name.substring(0, name.lastIndexOf('.'))
        : name;
        
      return `${basePath}/videos/${cleanVideoName}.${videoExt}`;
      
    case 'document':
      const docExt = format || (name.includes('.') ? name.split('.').pop() : 'pdf');
      const cleanDocName = name.includes('.') 
        ? name.substring(0, name.lastIndexOf('.'))
        : name;
        
      return `${basePath}/documents/${cleanDocName}.${docExt}`;
      
    default:
      return `${basePath}/${name}`;
  }
}

/**
 * Generates a responsive image srcSet with multiple size variants and formats
 */
export function getResponsiveImageSrcSet(
  name: string,
  category?: ImageCategory,
  formats: ImageFormat[] = ['webp', 'jpg']
): { srcSet: string; sizes: string } {
  const sizes = ['sm', 'md', 'lg', 'xl'] as const;
  const sizesMap = {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1920
  };
  
  // Generate srcset entries for each size and format
  const srcSetEntries: string[] = [];
  
  formats.forEach(format => {
    sizes.forEach(size => {
      const path = getAssetPath({
        type: 'image',
        name,
        size,
        format,
        category
      });
      
      srcSetEntries.push(`${path} ${sizesMap[size]}w`);
    });
  });
  
  return {
    srcSet: srcSetEntries.join(', '),
    sizes: '(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1920px'
  };
}

/**
 * Gets an appropriate image placeholder URL
 */
export function getImagePlaceholder(width?: number, height?: number): string {
  const dimensions = width && height ? `?width=${width}&height=${height}` : '';
  return getAssetPath({
    type: 'icon',
    name: 'placeholder',
    format: 'svg'
  }) + dimensions;
}

/**
 * Formats image file name according to our naming conventions
 */
export function formatImageFileName({
  category,
  name,
  size = 'original',
  format = 'webp'
}: {
  category: ImageCategory;
  name: string;
  size?: ImageSize;
  format?: ImageFormat;
}): string {
  // Remove any invalid characters from name
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return `${category}-${cleanName}-${size}.${format}`;
}

/**
 * Maps asset URL to an AssetPath object
 * This is useful for extracting metadata from existing asset paths
 */
export function parseAssetPath(path: string): AssetPath | null {
  // Basic validation
  if (!path || typeof path !== 'string') return null;
  
  try {
    // Extract the relevant parts from the path
    const normalized = path.startsWith('/') ? path.substring(1) : path;
    const parts = normalized.split('/');
    
    // Must have at least assets/type/filename
    if (parts.length < 3 || parts[0] !== 'assets') return null;
    
    const assetType = parts[1];
    const filename = parts[parts.length - 1];
    const filenameParts = filename.split('.');
    
    // Basic asset info
    const result: AssetPath = {
      type: assetType === 'images' ? 'image' : 
            assetType === 'icons' ? 'icon' :
            assetType === 'fonts' ? 'font' :
            assetType === 'videos' ? 'video' :
            assetType === 'documents' ? 'document' : 
            'image',
      path,
      name: filenameParts[0],
    };
    
    // Add format if available
    if (filenameParts.length > 1) {
      result.format = filenameParts[filenameParts.length - 1] as any;
    }
    
    // Add size for images
    if (result.type === 'image' && parts.length > 3) {
      result.size = parts[2] as ImageSize;
      
      // Try to extract category from filename
      const nameParts = result.name.split('-');
      if (nameParts.length > 1) {
        result.category = nameParts[0] as ImageCategory;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to parse asset path:', error);
    return null;
  }
}
