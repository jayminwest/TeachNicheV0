/**
 * Image Optimization Script
 * 
 * This script optimizes images in the assets directory, converting them to modern formats
 * and generating responsive sizes.
 * 
 * Usage:
 *   node scripts/optimize-images.js
 * 
 * Requirements:
 *   npm install sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const config = {
  // Source directory for original images
  sourceDir: path.join(__dirname, '../public/assets/images/original'),
  // Output directory for optimized images
  outputBaseDir: path.join(__dirname, '../public/assets/images'),
  // Sizes for responsive images
  sizes: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1920
  },
  // Output formats
  formats: ['webp', 'avif', 'jpg'],
  // Quality settings for each format
  quality: {
    webp: 80,
    avif: 70,
    jpg: 85
  }
};

// Ensure output directories exist
Object.keys(config.sizes).forEach(size => {
  const dir = path.join(config.outputBaseDir, size);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Process a single image
async function processImage(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    
    console.log(`Processing ${fileName}...`);
    
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Generate each size and format
    for (const [size, width] of Object.entries(config.sizes)) {
      // Skip generating larger sizes than the original
      if (metadata.width && width > metadata.width) {
        console.log(`Skipping ${size} for ${fileName} - original (${metadata.width}px) is smaller than target (${width}px)`);
        continue;
      }
      
      // Resize image
      const resized = image.clone().resize(width);
      
      // Output in each format
      for (const format of config.formats) {
        const outputPath = path.join(
          config.outputBaseDir, 
          size, 
          `${fileNameWithoutExt}.${format}`
        );
        
        await resized[format]({
          quality: config.quality[format]
        }).toFile(outputPath);
        
        console.log(`Created ${outputPath}`);
      }
    }
    
    console.log(`Finished processing ${fileName}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process all images in the source directory
async function processAllImages() {
  try {
    // Get all image files from source directory
    const files = fs.readdirSync(config.sourceDir)
      .filter(file => /\.(jpe?g|png|webp|avif)$/i.test(file))
      .map(file => path.join(config.sourceDir, file));
    
    console.log(`Found ${files.length} images to process`);
    
    // Process each image
    for (const file of files) {
      await processImage(file);
    }
    
    console.log('All images processed successfully');
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// Run the script
processAllImages();
