# Asset Management System

This document outlines the comprehensive asset management system for TeachNiche, including directory structure, naming conventions, components, and best practices.

## Directory Structure

Assets are organized in the `public/assets` directory with the following structure:

```
public/assets/
├── images/
│   ├── original/   # Original, unmodified images
│   ├── sm/         # Small images (480px width)
│   ├── md/         # Medium images (768px width)
│   ├── lg/         # Large images (1024px width)
│   ├── xl/         # Extra large images (1920px width)
│   └── hero/       # Hero/banner images
├── icons/          # SVG and other icon files
├── fonts/          # Font files
├── videos/         # Video files
└── documents/      # PDF and other document files
```

## Naming Conventions

### Images

Images follow this naming pattern:

```
[category]-[name]-[size].[format]
```

For example:
- `hero-kendama-group-xl.webp`
- `profile-user-avatar-md.jpg`
- `thumbnail-lesson-intro-sm.avif`

### Icons

Icons use a simple descriptive name:

```
[name].[format]
```

For example:
- `placeholder.svg`
- `logo.svg`
- `settings-gear.svg`

## Components

### OptimizedImage Component

The `OptimizedImage` component extends Next.js's Image component with additional features:

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

// Basic usage with asset name
<OptimizedImage
  assetName
  category="hero"
  src="kendama-group"
  alt="Kendama players group"
  fill
  responsive
/>

// Usage with direct path
<OptimizedImage
  src="/assets/images/hero/hero-kendama-group.webp"
  alt="Kendama players group"
  width={800}
  height={600}
  showPlaceholder
/>
```

### Icon Component

The `Icon` component provides a standardized way to use icons:

```tsx
import { Icon } from "@/components/ui/icon";

// Using built-in Lucide icons
<Icon icon="checkCircle" size="md" />

// Using custom SVG icon
<Icon 
  icon="/assets/icons/custom-icon.svg" 
  customIcon 
  size="lg"
  label="Custom icon description" 
/>
```

## Utilities

### Asset Path Generation

```tsx
import { getAssetPath } from "@/lib/assets";

// Generate path to an image
const imgPath = getAssetPath({
  type: 'image',
  name: 'kendama-group',
  size: 'lg',
  format: 'webp',
  category: 'hero'
});
// Result: "/assets/images/lg/hero-kendama-group.webp"

// Generate path to an icon
const iconPath = getAssetPath({
  type: 'icon',
  name: 'settings',
  format: 'svg'
});
// Result: "/assets/icons/settings.svg"
```

### Responsive Image Sets

```tsx
import { getResponsiveImageSrcSet } from "@/lib/assets";

const { srcSet, sizes } = getResponsiveImageSrcSet(
  'kendama-group',
  'hero',
  ['webp', 'jpg']
);

// srcSet will contain entries for all size and format combinations
// sizes will contain appropriate media queries
```

## Image Optimization

The project includes a script for optimizing images:

```bash
# Install dependencies
npm install sharp

# Run the optimization script
node scripts/optimize-images.js
```

This will:
1. Take original images from `public/assets/images/original`
2. Generate responsive sizes (sm, md, lg, xl)
3. Convert to modern formats (WebP, AVIF, JPEG)
4. Optimize quality settings for each format

## Asset Versioning and Caching

Assets are automatically versioned through Next.js's content-based hashing in production builds. The `next.config.mjs` file contains settings to:

1. Enable ETags for static files
2. Set appropriate cache headers for assets
3. Configure content-based hashing for filenames

## Best Practices

### Adding New Assets

1. Place original image files in `public/assets/images/original/`
2. Run the optimization script to generate variants
3. Use the `OptimizedImage` component with the `assetName` prop for automatic path generation

### Using Icons

1. Prefer using built-in Lucide icons when available
2. For custom icons, place SVG files in `public/assets/icons/`
3. Use the `Icon` component with either the icon name or path

### Performance Considerations

1. Use the appropriate image size for each context
2. Enable the `responsive` prop on `OptimizedImage` for automatic responsive images
3. Always set proper `width`, `height`, or `fill` props to avoid layout shifts
4. Use the `priority` prop for above-the-fold images

### Accessibility

1. Always provide meaningful `alt` text for images
2. Use the `label` prop for icons that convey meaning
3. Consider using `aria-hidden="true"` for decorative icons
