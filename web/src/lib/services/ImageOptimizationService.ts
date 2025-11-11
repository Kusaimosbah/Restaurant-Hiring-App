import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import CacheService, { CacheTTL } from './CacheService';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  blur?: number;
  grayscale?: boolean;
  progressive?: boolean;
  lossless?: boolean;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize?: number;
  compressionRatio?: number;
}

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format: string;
}

export class ImageOptimizationService {
  private static readonly DEFAULT_QUALITY = 80;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'];
  
  // Predefined image variants for different use cases
  private static readonly IMAGE_VARIANTS: Record<string, ImageVariant[]> = {
    profile: [
      { name: 'thumbnail', width: 64, height: 64, quality: 75, format: 'webp' },
      { name: 'small', width: 128, height: 128, quality: 80, format: 'webp' },
      { name: 'medium', width: 256, height: 256, quality: 85, format: 'webp' },
      { name: 'large', width: 512, height: 512, quality: 90, format: 'webp' },
    ],
    restaurant: [
      { name: 'thumbnail', width: 200, height: 150, quality: 75, format: 'webp' },
      { name: 'card', width: 400, height: 300, quality: 80, format: 'webp' },
      { name: 'hero', width: 1200, height: 600, quality: 85, format: 'webp' },
      { name: 'gallery', width: 800, height: 600, quality: 90, format: 'webp' },
    ],
    job: [
      { name: 'thumbnail', width: 150, height: 100, quality: 75, format: 'webp' },
      { name: 'card', width: 300, height: 200, quality: 80, format: 'webp' },
      { name: 'featured', width: 600, height: 400, quality: 85, format: 'webp' },
    ],
  };

  /**
   * Optimize a single image with specified options
   */
  static async optimizeImage(
    input: Buffer | string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    try {
      const inputBuffer = typeof input === 'string' 
        ? await fs.readFile(input)
        : input;

      const originalSize = inputBuffer.length;

      if (originalSize > this.MAX_FILE_SIZE) {
        throw new Error(`Image size ${originalSize} exceeds maximum allowed size ${this.MAX_FILE_SIZE}`);
      }

      let image = sharp(inputBuffer);

      // Get original metadata
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
      }

      // Apply transformations
      if (options.width || options.height) {
        image = image.resize(options.width, options.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        });
      }

      if (options.blur) {
        image = image.blur(options.blur);
      }

      if (options.grayscale) {
        image = image.grayscale();
      }

      // Determine output format
      const outputFormat = options.format || this.getBestFormat(metadata.format);
      const quality = options.quality || this.DEFAULT_QUALITY;

      // Apply format-specific optimizations
      switch (outputFormat) {
        case 'webp':
          image = image.webp({
            quality,
            lossless: options.lossless,
          });
          break;
        case 'jpeg':
          image = image.jpeg({
            quality,
            progressive: options.progressive || true,
            mozjpeg: true,
          });
          break;
        case 'png':
          image = image.png({
            quality,
            progressive: options.progressive,
            compressionLevel: 9,
          });
          break;
        case 'avif':
          image = image.avif({
            quality,
            lossless: options.lossless,
          });
          break;
        default:
          throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      const optimizedBuffer = await image.toBuffer();
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        format: outputFormat,
        width: optimizedMetadata.width || options.width || metadata.width,
        height: optimizedMetadata.height || options.height || metadata.height,
        size: optimizedBuffer.length,
        originalSize,
        compressionRatio: originalSize > 0 ? (1 - optimizedBuffer.length / originalSize) * 100 : 0,
      };

    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Image optimization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate multiple variants of an image
   */
  static async generateVariants(
    input: Buffer | string,
    type: keyof typeof this.IMAGE_VARIANTS = 'profile'
  ): Promise<Record<string, OptimizedImageResult>> {
    const variants = this.IMAGE_VARIANTS[type];
    if (!variants) {
      throw new Error(`Unknown image variant type: ${type}`);
    }

    const results: Record<string, OptimizedImageResult> = {};

    await Promise.all(
      variants.map(async (variant) => {
        try {
          const result = await this.optimizeImage(input, {
            width: variant.width,
            height: variant.height,
            quality: variant.quality,
            format: variant.format as any,
          });
          results[variant.name] = result;
        } catch (error) {
          console.error(`Failed to generate variant ${variant.name}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Generate responsive image srcset
   */
  static async generateResponsiveImages(
    input: Buffer | string,
    baseUrl: string,
    filename: string
  ): Promise<{
    images: Record<string, OptimizedImageResult>;
    srcset: string;
    sizes: string;
  }> {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const images: Record<string, OptimizedImageResult> = {};
    const srcsetEntries: string[] = [];

    await Promise.all(
      widths.map(async (width) => {
        try {
          const result = await this.optimizeImage(input, {
            width,
            quality: 85,
            format: 'webp',
          });
          
          const key = `${width}w`;
          images[key] = result;
          srcsetEntries.push(`${baseUrl}/${filename}-${width}w.webp ${width}w`);
        } catch (error) {
          console.error(`Failed to generate responsive image for width ${width}:`, error);
        }
      })
    );

    const srcset = srcsetEntries.join(', ');
    const sizes = '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1920px';

    return { images, srcset, sizes };
  }

  /**
   * Create a blurred placeholder image
   */
  static async generateBlurDataURL(
    input: Buffer | string,
    width: number = 10,
    height: number = 10
  ): Promise<string> {
    try {
      const result = await this.optimizeImage(input, {
        width,
        height,
        quality: 20,
        format: 'jpeg',
        blur: 1,
      });

      const base64 = result.buffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Blur placeholder generation error:', error);
      // Return a default blur placeholder
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
    }
  }

  /**
   * Validate image file
   */
  static async validateImage(
    input: Buffer | string
  ): Promise<{
    isValid: boolean;
    format?: string;
    width?: number;
    height?: number;
    size?: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const inputBuffer = typeof input === 'string' 
        ? await fs.readFile(input)
        : input;

      const size = inputBuffer.length;

      if (size > this.MAX_FILE_SIZE) {
        errors.push(`File size ${size} exceeds maximum allowed size ${this.MAX_FILE_SIZE}`);
      }

      const metadata = await sharp(inputBuffer).metadata();

      if (!metadata.format) {
        errors.push('Unable to detect image format');
        return { isValid: false, errors };
      }

      if (!this.SUPPORTED_FORMATS.includes(metadata.format)) {
        errors.push(`Unsupported image format: ${metadata.format}`);
      }

      if (!metadata.width || !metadata.height) {
        errors.push('Unable to read image dimensions');
      }

      if (metadata.width && metadata.width > 4000) {
        errors.push(`Image width ${metadata.width} is too large (max: 4000px)`);
      }

      if (metadata.height && metadata.height > 4000) {
        errors.push(`Image height ${metadata.height} is too large (max: 4000px)`);
      }

      return {
        isValid: errors.length === 0,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size,
        errors,
      };

    } catch (error) {
      errors.push(`Image validation failed: ${(error as Error).message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Get optimized image with caching
   */
  static async getOptimizedImage(
    imageId: string,
    options: ImageOptimizationOptions = {},
    imagePath?: string
  ): Promise<OptimizedImageResult | null> {
    const cacheKey = `image:${imageId}:${JSON.stringify(options)}`;

    return CacheService.getOrSet(
      cacheKey,
      async () => {
        if (!imagePath) {
          throw new Error('Image path is required when not cached');
        }

        return this.optimizeImage(imagePath, options);
      },
      { ttl: CacheTTL.VERY_LONG, tags: ['images'] }
    );
  }

  /**
   * Batch optimize multiple images
   */
  static async batchOptimize(
    images: Array<{
      id: string;
      input: Buffer | string;
      options?: ImageOptimizationOptions;
    }>,
    concurrency: number = 3
  ): Promise<Array<{
    id: string;
    result?: OptimizedImageResult;
    error?: string;
  }>> {
    const results: Array<{
      id: string;
      result?: OptimizedImageResult;
      error?: string;
    }> = [];

    // Process images in batches to avoid memory issues
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async ({ id, input, options }) => {
          const result = await this.optimizeImage(input, options);
          return { id, result };
        })
      );

      batchResults.forEach((result, index) => {
        const imageId = batch[index].id;
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            id: imageId,
            error: result.reason.message,
          });
        }
      });
    }

    return results;
  }

  /**
   * Extract dominant colors from image
   */
  static async extractColors(
    input: Buffer | string,
    count: number = 5
  ): Promise<string[]> {
    try {
      const inputBuffer = typeof input === 'string' 
        ? await fs.readFile(input)
        : input;

      // Resize to small image for faster processing
      const resized = await sharp(inputBuffer)
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resized;
      const pixels: Array<[number, number, number]> = [];

      // Extract RGB values
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      // Simple color clustering (k-means would be better but more complex)
      const colors = this.getRepresentativeColors(pixels, count);
      
      return colors.map(([r, g, b]) => 
        `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
      );

    } catch (error) {
      console.error('Color extraction error:', error);
      return ['#808080']; // Fallback to gray
    }
  }

  /**
   * Get the best output format based on input format and browser support
   */
  private static getBestFormat(inputFormat?: string): 'webp' | 'jpeg' | 'png' {
    // Always prefer WebP for better compression
    if (inputFormat === 'png' && this.hasTransparency(inputFormat)) {
      return 'webp'; // WebP supports transparency
    }
    
    return 'webp'; // Default to WebP for best compression
  }

  /**
   * Check if image format supports transparency
   */
  private static hasTransparency(format?: string): boolean {
    return format === 'png' || format === 'webp' || format === 'gif';
  }

  /**
   * Simple color clustering to get representative colors
   */
  private static getRepresentativeColors(
    pixels: Array<[number, number, number]>,
    count: number
  ): Array<[number, number, number]> {
    // Simple approach: sort by frequency and return top colors
    const colorMap = new Map<string, { color: [number, number, number]; count: number }>();

    pixels.forEach(([r, g, b]) => {
      // Reduce color space for clustering
      const key = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
      
      if (colorMap.has(key)) {
        colorMap.get(key)!.count++;
      } else {
        colorMap.set(key, { color: [r, g, b], count: 1 });
      }
    });

    return Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, count)
      .map(item => item.color);
  }

  /**
   * Clean up temporary files and cache
   */
  static async cleanup(): Promise<void> {
    try {
      await CacheService.invalidateByTag('images');
      console.log('✅ Image cache cleaned up');
    } catch (error) {
      console.error('Image cleanup error:', error);
    }
  }
}

export default ImageOptimizationService;