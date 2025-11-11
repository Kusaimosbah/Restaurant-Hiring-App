import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import ImageOptimizationService from './ImageOptimizationService';
import CacheService, { CacheTTL } from './CacheService';

export interface CDNConfig {
  provider: 'aws' | 'cloudflare' | 'azure' | 'gcp';
  region: string;
  bucket: string;
  distributionId?: string;
  baseUrl: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  optimize?: boolean;
  generateVariants?: boolean;
  publicRead?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl: string;
  size: number;
  contentType: string;
  etag?: string;
  variants?: Record<string, string>;
}

export interface CDNStats {
  totalFiles: number;
  totalSize: number;
  bandwidth: number;
  requests: number;
  cacheHitRate: number;
  topFiles: Array<{
    key: string;
    requests: number;
    bandwidth: number;
  }>;
}

export class CDNIntegrationService {
  private static s3Client: S3Client | null = null;
  private static cloudFrontClient: CloudFrontClient | null = null;
  private static config: CDNConfig | null = null;
  private static uploadStats: Map<string, {
    uploads: number;
    totalSize: number;
    lastUpload: Date;
  }> = new Map();

  /**
   * Initialize CDN service
   */
  static initialize(config: CDNConfig): void {
    this.config = config;

    if (config.provider === 'aws') {
      this.s3Client = new S3Client({
        region: config.region,
        credentials: config.accessKeyId && config.secretAccessKey ? {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        } : undefined,
      });

      if (config.distributionId) {
        this.cloudFrontClient = new CloudFrontClient({
          region: config.region,
          credentials: config.accessKeyId && config.secretAccessKey ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          } : undefined,
        });
      }
    }

    console.log(`✅ CDN service initialized with ${config.provider}`);
  }

  /**
   * Upload file to CDN
   */
  static async uploadFile(
    key: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    let uploadBuffer = buffer;
    let contentType = options.contentType || 'application/octet-stream';
    let variants: Record<string, string> = {};

    // Optimize image if requested
    if (options.optimize && this.isImageFile(contentType)) {
      try {
        const optimized = await ImageOptimizationService.optimizeImage(buffer, {
          quality: 85,
          format: 'webp',
        });
        uploadBuffer = optimized.buffer;
        contentType = `image/${optimized.format}`;
        
        console.log(`📸 Image optimized: ${buffer.length} -> ${optimized.buffer.length} bytes (${optimized.compressionRatio?.toFixed(1)}% reduction)`);
      } catch (error) {
        console.warn('Image optimization failed, uploading original:', error);
      }
    }

    // Generate variants if requested
    if (options.generateVariants && this.isImageFile(contentType)) {
      try {
        const imageVariants = await ImageOptimizationService.generateVariants(buffer, 'restaurant');
        
        for (const [variantName, variantResult] of Object.entries(imageVariants)) {
          const variantKey = this.getVariantKey(key, variantName);
          const variantUrl = await this.uploadToS3(
            variantKey,
            variantResult.buffer,
            `image/${variantResult.format}`,
            options
          );
          variants[variantName] = variantUrl;
        }
      } catch (error) {
        console.warn('Variant generation failed:', error);
      }
    }

    // Upload main file
    const url = await this.uploadToS3(key, uploadBuffer, contentType, options);
    const cdnUrl = this.getCDNUrl(key);

    // Update stats
    this.updateUploadStats(key, uploadBuffer.length);

    return {
      key,
      url,
      cdnUrl,
      size: uploadBuffer.length,
      contentType,
      variants,
    };
  }

  /**
   * Upload multiple files in batch
   */
  static async uploadBatch(
    files: Array<{
      key: string;
      buffer: Buffer;
      options?: UploadOptions;
    }>,
    concurrency: number = 5
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(({ key, buffer, options }) =>
          this.uploadFile(key, buffer, options)
        )
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to upload ${batch[index].key}:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Generate presigned URL for direct upload
   */
  static async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{
    uploadUrl: string;
    fields: Record<string, string>;
    finalUrl: string;
  }> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const finalUrl = this.getCDNUrl(key);

    return {
      uploadUrl,
      fields: {
        'Content-Type': contentType,
      },
      finalUrl,
    };
  }

  /**
   * Generate presigned URL for download
   */
  static async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete file from CDN
   */
  static async deleteFile(key: string): Promise<boolean> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      // Invalidate CDN cache
      await this.invalidateCache([key]);

      return true;
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteBatch(keys: string[]): Promise<{
    deleted: string[];
    failed: string[];
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    await Promise.all(
      keys.map(async (key) => {
        try {
          const success = await this.deleteFile(key);
          if (success) {
            deleted.push(key);
          } else {
            failed.push(key);
          }
        } catch (error) {
          failed.push(key);
        }
      })
    );

    return { deleted, failed };
  }

  /**
   * Invalidate CDN cache
   */
  static async invalidateCache(paths: string[]): Promise<boolean> {
    if (!this.config?.distributionId || !this.cloudFrontClient) {
      console.warn('CloudFront distribution not configured, skipping cache invalidation');
      return false;
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.config.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths.map(path => `/${path}`),
          },
          CallerReference: `invalidation-${Date.now()}`,
        },
      });

      await this.cloudFrontClient.send(command);
      console.log(`✅ Cache invalidated for ${paths.length} paths`);
      return true;
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    key: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    if (!this.config) {
      throw new Error('CDN service not initialized');
    }

    // For AWS CloudFront with Lambda@Edge or CloudFront Functions
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const queryString = params.toString();
    const baseUrl = this.getCDNUrl(key);

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Get file info from CDN
   */
  static async getFileInfo(key: string): Promise<{
    exists: boolean;
    size?: number;
    lastModified?: Date;
    contentType?: string;
    etag?: string;
  } | null> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        exists: true,
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return { exists: false };
      }
      console.error(`Failed to get file info for ${key}:`, error);
      return null;
    }
  }

  /**
   * List files with prefix
   */
  static async listFiles(
    prefix: string = '',
    maxKeys: number = 1000
  ): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>> {
    if (!this.config || !this.s3Client) {
      throw new Error('CDN service not initialized');
    }

    // Note: This would require additional S3 list objects implementation
    // For brevity, returning empty array
    return [];
  }

  /**
   * Get CDN statistics
   */
  static getStats(): CDNStats {
    const stats = Array.from(this.uploadStats.values());
    const totalFiles = stats.length;
    const totalSize = stats.reduce((sum, stat) => sum + stat.totalSize, 0);

    return {
      totalFiles,
      totalSize,
      bandwidth: totalSize, // Simplified
      requests: stats.reduce((sum, stat) => sum + stat.uploads, 0),
      cacheHitRate: 85, // Mock value
      topFiles: [], // Would need actual analytics data
    };
  }

  /**
   * Create responsive image srcset
   */
  static createResponsiveSrcSet(
    key: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): {
    srcset: string;
    sizes: string;
  } {
    const srcsetEntries = widths.map(width => {
      const url = this.getOptimizedImageUrl(key, { width, format: 'webp' });
      return `${url} ${width}w`;
    });

    return {
      srcset: srcsetEntries.join(', '),
      sizes: '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1920px',
    };
  }

  /**
   * Upload to S3 (private method)
   */
  private static async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string,
    options: UploadOptions
  ): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: options.cacheControl || 'public, max-age=31536000', // 1 year
      Metadata: options.metadata,
      Tagging: options.tags ? 
        Object.entries(options.tags).map(([k, v]) => `${k}=${v}`).join('&') : 
        undefined,
      ACL: options.publicRead ? 'public-read' : undefined,
    });

    await this.s3Client.send(command);
    
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Get CDN URL for a key
   */
  private static getCDNUrl(key: string): string {
    if (!this.config) {
      throw new Error('CDN service not initialized');
    }

    return `${this.config.baseUrl}/${key}`;
  }

  /**
   * Get variant key
   */
  private static getVariantKey(originalKey: string, variant: string): string {
    const parts = originalKey.split('.');
    const extension = parts.pop();
    const base = parts.join('.');
    return `${base}-${variant}.${extension}`;
  }

  /**
   * Check if file is an image
   */
  private static isImageFile(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  /**
   * Update upload statistics
   */
  private static updateUploadStats(key: string, size: number): void {
    const existing = this.uploadStats.get(key) || {
      uploads: 0,
      totalSize: 0,
      lastUpload: new Date(),
    };

    this.uploadStats.set(key, {
      uploads: existing.uploads + 1,
      totalSize: existing.totalSize + size,
      lastUpload: new Date(),
    });
  }

  /**
   * Clean up old statistics
   */
  static cleanupStats(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [key, stats] of this.uploadStats.entries()) {
      if (stats.lastUpload < cutoff) {
        this.uploadStats.delete(key);
      }
    }
  }

  /**
   * Get configuration
   */
  static getConfig(): CDNConfig | null {
    return this.config;
  }

  /**
   * Test CDN connection
   */
  static async testConnection(): Promise<boolean> {
    if (!this.config || !this.s3Client) {
      return false;
    }

    try {
      // Test by uploading a small file
      const testKey = `test-${Date.now()}.txt`;
      const testBuffer = Buffer.from('CDN connection test');
      
      await this.uploadToS3(testKey, testBuffer, 'text/plain', {});
      await this.deleteFile(testKey);
      
      return true;
    } catch (error) {
      console.error('CDN connection test failed:', error);
      return false;
    }
  }
}

export default CDNIntegrationService;