/**
 * OptimizedImage Component
 * 
 * An enhanced Image component that extends Next.js Image with:
 * - Responsive image loading with multiple formats
 * - Proper error fallbacks
 * - Placeholder handling
 * - Standardized asset path handling
 */

"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { 
  getAssetPath, 
  getResponsiveImageSrcSet, 
  getImagePlaceholder 
} from "@/lib/assets";
import { ImageCategory, ImageFormat, ImageSize } from "@/types/assets";

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  /**
   * Image source - can be a full URL, a relative path, or just the image name 
   * when using with assetName
   */
  src: string;
  
  /** 
   * When true, treats the src as an asset name and generates the path automatically.
   * Requires category, can optionally specify size and format.
   */
  assetName?: boolean;
  
  /** Category of the image, used with assetName */
  category?: ImageCategory;
  
  /** Size variant of the image */
  size?: ImageSize;
  
  /** Format of the image */
  format?: ImageFormat;
  
  /** Whether to use responsive image sets */
  responsive?: boolean;
  
  /** Alternative formats to generate for responsive images */
  formats?: ImageFormat[];
  
  /** Whether to show a placeholder while loading or on error */
  showPlaceholder?: boolean;
  
  /** Custom placeholder image path */
  placeholderSrc?: string;
  
  /** Callback when image fails to load */
  onError?: () => void;
};

export function OptimizedImage({
  src,
  assetName = false,
  category,
  size = 'original',
  format,
  responsive = false,
  formats = ['webp', 'jpg'],
  showPlaceholder = true,
  placeholderSrc,
  alt,
  onError,
  ...props
}: OptimizedImageProps) {
  // State for tracking image load errors
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Reset error state if src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);
  
  // Determine the image source
  let imageSrc = src;
  let srcSet: string | undefined;
  let sizes: string | undefined;
  
  // Handle asset name conversion
  if (assetName) {
    if (!category) {
      console.error('Category is required when using assetName');
    } else {
      imageSrc = getAssetPath({
        type: 'image',
        name: src,
        size,
        format,
        category
      });
      
      // Generate responsive image sets if requested
      if (responsive) {
        const responsiveSet = getResponsiveImageSrcSet(src, category, formats);
        srcSet = responsiveSet.srcSet;
        sizes = responsiveSet.sizes;
      }
    }
  }
  
  // Determine placeholder
  const placeholder = placeholderSrc || getImagePlaceholder(props.width as number, props.height as number);
  
  // Handle error
  const handleError = () => {
    setError(true);
    onError && onError();
  };
  
  const handleLoad = () => {
    setLoaded(true);
  };
  
  return (
    <>
      {/* Show placeholder during loading or on error */}
      {showPlaceholder && (!loaded || error) && (
        <Image
          {...props}
          src={placeholder}
          alt={alt || "Image placeholder"}
          className={`${props.className || ''} ${error ? '' : 'absolute inset-0 z-0'}`}
        />
      )}
      
      {/* Main image - hidden when error occurs */}
      {!error && (
        <Image
          {...props}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt || ""}
          onError={handleError}
          onLoad={handleLoad}
          className={`${props.className || ''} ${!loaded && showPlaceholder ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
      )}
    </>
  );
}
