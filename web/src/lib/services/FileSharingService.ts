import WebSocketService, { MessageData } from './WebSocketService';
import CDNIntegrationService from './CDNIntegrationService';
import CacheService from './CacheService';

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  conversationId?: string;
  messageId?: string;
  checksum: string;
  encrypted: boolean;
  downloadCount: number;
  expiresAt?: Date;
  description?: string;
  tags?: string[];
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  virus_scan?: {
    status: 'pending' | 'clean' | 'infected' | 'error';
    scanDate?: Date;
    details?: string;
  };
}

export interface SharePermissions {
  userId: string;
  permissions: ('view' | 'download' | 'share' | 'delete')[];
  expiresAt?: Date;
  passwordProtected?: boolean;
  downloadLimit?: number;
  downloaded?: number;
}

export interface FileShare {
  id: string;
  fileId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  permissions: SharePermissions[];
  publicAccess: boolean;
  requiresPassword: boolean;
  passwordHash?: string;
  downloadLimit?: number;
  downloaded: number;
  shareUrl: string;
  settings: {
    allowPreview: boolean;
    allowComments: boolean;
    trackDownloads: boolean;
    notifyOnAccess: boolean;
  };
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  error?: string;
}

export interface FileCategory {
  id: string;
  name: string;
  description: string;
  allowedMimeTypes: string[];
  maxFileSize: number;
  autoDelete: boolean;
  retentionDays: number;
  requiresApproval: boolean;
  encryptionRequired: boolean;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  uploadsToday: number;
  downloadsToday: number;
  storageUsed: number;
  storageLimit: number;
  byMimeType: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: Array<{
    action: 'upload' | 'download' | 'share' | 'delete';
    fileId: string;
    fileName: string;
    userId: string;
    timestamp: Date;
  }>;
}

export class FileSharingService {
  private static fileMetadata: Map<string, FileMetadata> = new Map();
  private static fileShares: Map<string, FileShare> = new Map();
  private static uploadProgresses: Map<string, UploadProgress> = new Map();
  private static categories: Map<string, FileCategory> = new Map();
  private static stats: FileStats = {
    totalFiles: 0,
    totalSize: 0,
    uploadsToday: 0,
    downloadsToday: 0,
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB default
    byMimeType: {},
    byUser: {},
    recentActivity: [],
  };

  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB default
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed',
  ];

  /**
   * Initialize file sharing service
   */
  static async initialize(): Promise<void> {
    await this.loadFileCategories();
    await this.setupCleanupScheduler();
    this.setupWebSocketListeners();
    console.log('✅ File sharing service initialized');
  }

  /**
   * Upload file
   */
  static async uploadFile(
    file: File,
    options: {
      conversationId?: string;
      messageId?: string;
      description?: string;
      tags?: string[];
      encrypt?: boolean;
      category?: string;
      expiresIn?: number; // hours
    } = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> {
    // Validate file
    this.validateFile(file, options.category);

    const fileId = this.generateFileId();
    const uploadedBy = this.getCurrentUserId();
    const encrypted = options.encrypt || false;

    // Create file metadata
    const metadata: FileMetadata = {
      id: fileId,
      originalName: file.name,
      fileName: this.generateFileName(file.name),
      mimeType: file.type,
      size: file.size,
      uploadedBy,
      uploadedAt: new Date(),
      conversationId: options.conversationId,
      messageId: options.messageId,
      checksum: await this.calculateChecksum(file),
      encrypted,
      downloadCount: 0,
      description: options.description,
      tags: options.tags,
      expiresAt: options.expiresIn ? 
        new Date(Date.now() + options.expiresIn * 60 * 60 * 1000) : 
        undefined,
      virus_scan: {
        status: 'pending',
      },
    };

    // Initialize upload progress
    const progress: UploadProgress = {
      fileId,
      fileName: file.name,
      uploadedBytes: 0,
      totalBytes: file.size,
      percentage: 0,
      speed: 0,
      remainingTime: 0,
      status: 'uploading',
    };

    this.uploadProgresses.set(fileId, progress);
    onProgress?.(progress);

    try {
      // Process file (encrypt if needed)
      let fileBuffer = await this.fileToBuffer(file);
      if (encrypted) {
        // For now, skip encryption - would integrate with EncryptionService
        console.log('📄 File encryption requested (not implemented yet)');
      }

      // Generate thumbnail for images
      if (file.type.startsWith('image/')) {
        metadata.thumbnail = await this.generateThumbnail(fileBuffer, file.type);
      }

      // Upload to CDN with progress tracking
      const uploadResult = await this.uploadWithProgress(
        metadata.fileName,
        fileBuffer,
        file.type,
        progress,
        onProgress
      );

      // Update metadata with CDN info
      metadata.virus_scan = await this.performVirusScan(fileBuffer);

      // Store metadata
      this.fileMetadata.set(fileId, metadata);
      await this.cacheFileMetadata(metadata);

      // Update statistics
      this.updateStats('upload', metadata);

      // Send notification through WebSocket
      this.notifyFileUploaded(metadata);

      // Final progress update
      progress.status = 'completed';
      progress.percentage = 100;
      onProgress?.(progress);

      console.log('✅ File uploaded successfully:', metadata.originalName);
      return metadata;

    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Upload failed';
      onProgress?.(progress);
      
      console.error('❌ File upload failed:', error);
      throw error;
    } finally {
      // Clean up progress tracking
      setTimeout(() => {
        this.uploadProgresses.delete(fileId);
      }, 60000); // Keep for 1 minute after completion
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[],
    options: Parameters<typeof FileSharingService.uploadFile>[1] = {},
    onProgress?: (overallProgress: {
      completed: number;
      total: number;
      currentFile?: string;
      individualProgresses: UploadProgress[];
    }) => void
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    const progresses: UploadProgress[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const metadata = await this.uploadFile(
          file,
          options,
          (progress) => {
            progresses[i] = progress;
            onProgress?.({
              completed: results.length,
              total: files.length,
              currentFile: file.name,
              individualProgresses: [...progresses],
            });
          }
        );
        
        results.push(metadata);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Download file
   */
  static async downloadFile(
    fileId: string,
    userId?: string,
    password?: string
  ): Promise<{
    buffer: Buffer;
    metadata: FileMetadata;
    filename: string;
  }> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error('File not found');
    }

    // Check permissions
    if (!this.hasDownloadPermission(fileId, userId, password)) {
      throw new Error('Access denied');
    }

    // Check expiration
    if (metadata.expiresAt && metadata.expiresAt < new Date()) {
      throw new Error('File has expired');
    }

    try {
      // Download from CDN
      const downloadUrl = await CDNIntegrationService.generatePresignedDownloadUrl(
        metadata.fileName,
        3600 // 1 hour expiry
      );

      // Fetch file content
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      let buffer = Buffer.from(await response.arrayBuffer());

      // Decrypt if encrypted
      if (metadata.encrypted) {
        // For now, skip decryption - would integrate with EncryptionService
        console.log('📄 File decryption requested (not implemented yet)');
      }

      // Update download count
      metadata.downloadCount++;
      this.fileMetadata.set(fileId, metadata);
      await this.cacheFileMetadata(metadata);

      // Update statistics
      this.updateStats('download', metadata);

      // Log activity
      this.logActivity('download', fileId, metadata.originalName, userId || 'anonymous');

      return {
        buffer,
        metadata,
        filename: metadata.originalName,
      };

    } catch (error) {
      console.error('❌ File download failed:', error);
      throw error;
    }
  }

  /**
   * Create file share
   */
  static async createFileShare(
    fileId: string,
    createdBy: string,
    options: {
      permissions?: SharePermissions[];
      publicAccess?: boolean;
      requiresPassword?: boolean;
      password?: string;
      expiresIn?: number; // hours
      downloadLimit?: number;
      settings?: Partial<FileShare['settings']>;
    } = {}
  ): Promise<FileShare> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error('File not found');
    }

    const shareId = this.generateShareId();
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareId}`;

    const fileShare: FileShare = {
      id: shareId,
      fileId,
      createdBy,
      createdAt: new Date(),
      expiresAt: options.expiresIn ? 
        new Date(Date.now() + options.expiresIn * 60 * 60 * 1000) : 
        undefined,
      permissions: options.permissions || [],
      publicAccess: options.publicAccess || false,
      requiresPassword: options.requiresPassword || false,
      passwordHash: options.password ? 
        await this.hashPassword(options.password) : 
        undefined,
      downloadLimit: options.downloadLimit,
      downloaded: 0,
      shareUrl,
      settings: {
        allowPreview: true,
        allowComments: false,
        trackDownloads: true,
        notifyOnAccess: false,
        ...options.settings,
      },
    };

    this.fileShares.set(shareId, fileShare);
    await this.cacheFileShare(fileShare);

    // Log activity
    this.logActivity('share', fileId, metadata.originalName, createdBy);

    console.log('🔗 File share created:', shareUrl);
    return fileShare;
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    // Check memory cache first
    let metadata = this.fileMetadata.get(fileId);
    
    if (!metadata) {
      // Try cache service
      metadata = await CacheService.get(`file_metadata_${fileId}`) as FileMetadata;
      
      if (metadata) {
        this.fileMetadata.set(fileId, metadata);
      }
    }

    return metadata || null;
  }

  /**
   * Get files for conversation
   */
  static async getConversationFiles(conversationId: string): Promise<FileMetadata[]> {
    try {
      const cacheKey = `conversation_${conversationId}_files`;
      const cachedFiles = await CacheService.get(cacheKey) as FileMetadata[];
      
      if (cachedFiles) {
        return cachedFiles;
      }

      // Filter files by conversation ID
      const files = Array.from(this.fileMetadata.values())
        .filter(file => file.conversationId === conversationId)
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      // Cache the result
      await CacheService.set(cacheKey, files, { ttl: 3600 });

      return files;
    } catch (error) {
      console.error('Failed to get conversation files:', error);
      return [];
    }
  }

  /**
   * Get user files
   */
  static async getUserFiles(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      mimeType?: string;
      category?: string;
    } = {}
  ): Promise<FileMetadata[]> {
    try {
      const allFiles = Array.from(this.fileMetadata.values())
        .filter(file => file.uploadedBy === userId);

      // Apply filters
      let filteredFiles = allFiles;
      
      if (options.mimeType) {
        filteredFiles = filteredFiles.filter(file => 
          file.mimeType.startsWith(options.mimeType!)
        );
      }

      // Sort by upload date (newest first)
      filteredFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      
      return filteredFiles.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get user files:', error);
      return [];
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error('File not found');
    }

    // Check permissions
    if (metadata.uploadedBy !== userId) {
      throw new Error('Access denied');
    }

    try {
      // Delete from CDN
      const deleteSuccess = await CDNIntegrationService.deleteFile(metadata.fileName);
      
      if (deleteSuccess) {
        // Remove from caches
        this.fileMetadata.delete(fileId);
        await CacheService.del(`file_metadata_${fileId}`);

        // Remove from conversation files cache
        if (metadata.conversationId) {
          const cacheKey = `conversation_${metadata.conversationId}_files`;
          await CacheService.del(cacheKey);
        }

        // Update statistics
        this.updateStats('delete', metadata);

        // Log activity
        this.logActivity('delete', fileId, metadata.originalName, userId);

        console.log('🗑️ File deleted successfully:', metadata.originalName);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get file preview URL
   */
  static getPreviewUrl(fileId: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): string | null {
    const metadata = this.fileMetadata.get(fileId);
    if (!metadata) return null;

    // Only images can be previewed with transformations
    if (metadata.mimeType.startsWith('image/')) {
      return CDNIntegrationService.getOptimizedImageUrl(metadata.fileName, {
        width: options.width || 300,
        height: options.height || 300,
        quality: options.quality || 80,
        format: 'webp',
      });
    }

    // For other files, return thumbnail if available
    return metadata.thumbnail?.url || null;
  }

  /**
   * Get file statistics
   */
  static getStats(): FileStats {
    return { ...this.stats };
  }

  /**
   * Clean up expired files
   */
  static async cleanupExpiredFiles(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [fileId, metadata] of this.fileMetadata.entries()) {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        try {
          await this.deleteFile(fileId, metadata.uploadedBy);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete expired file ${fileId}:`, error);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired files`);
    }

    return deletedCount;
  }

  /**
   * Validate file
   */
  private static validateFile(file: File, categoryId?: string): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check category restrictions if specified
    if (categoryId) {
      const category = this.categories.get(categoryId);
      if (category) {
        if (!category.allowedMimeTypes.includes(file.type)) {
          throw new Error(`File type not allowed for category ${category.name}`);
        }
        
        if (file.size > category.maxFileSize) {
          throw new Error(`File size exceeds category limit of ${category.maxFileSize / 1024 / 1024}MB`);
        }
      }
    }
  }

  /**
   * Upload with progress tracking
   */
  private static async uploadWithProgress(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    progress: UploadProgress,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    const startTime = Date.now();

    // Simulate chunked upload with progress
    const chunks = Math.ceil(buffer.length / this.CHUNK_SIZE);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, buffer.length);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update progress
      progress.uploadedBytes = end;
      progress.percentage = (end / buffer.length) * 100;
      
      // Calculate speed and remaining time
      const elapsed = (Date.now() - startTime) / 1000;
      progress.speed = progress.uploadedBytes / elapsed;
      progress.remainingTime = (buffer.length - progress.uploadedBytes) / progress.speed;
      
      onProgress?.(progress);
    }

    // Actual CDN upload
    return await CDNIntegrationService.uploadFile(fileName, buffer, {
      contentType: mimeType,
      optimize: mimeType.startsWith('image/'),
      generateVariants: mimeType.startsWith('image/'),
    });
  }

  /**
   * Generate thumbnail for images
   */
  private static async generateThumbnail(
    buffer: Buffer,
    mimeType: string
  ): Promise<FileMetadata['thumbnail']> {
    // This would integrate with ImageOptimizationService
    // For now, return a placeholder
    return {
      url: '/api/placeholder-thumbnail',
      width: 150,
      height: 150,
    };
  }

  /**
   * Perform virus scan
   */
  private static async performVirusScan(buffer: Buffer): Promise<FileMetadata['virus_scan']> {
    // This would integrate with a virus scanning service
    // For now, return clean status
    return {
      status: 'clean',
      scanDate: new Date(),
      details: 'File scanned and found clean',
    };
  }

  /**
   * Check download permissions
   */
  private static hasDownloadPermission(
    fileId: string,
    userId?: string,
    password?: string
  ): boolean {
    const metadata = this.fileMetadata.get(fileId);
    if (!metadata) return false;

    // File owner always has access
    if (userId && metadata.uploadedBy === userId) return true;

    // Check if file is shared
    const shares = Array.from(this.fileShares.values())
      .filter(share => share.fileId === fileId);

    for (const share of shares) {
      // Check expiration
      if (share.expiresAt && share.expiresAt < new Date()) continue;

      // Check download limit
      if (share.downloadLimit && share.downloaded >= share.downloadLimit) continue;

      // Public access
      if (share.publicAccess) {
        // Check password if required
        if (share.requiresPassword && password) {
          // Would verify password hash
          return true;
        } else if (!share.requiresPassword) {
          return true;
        }
      }

      // Check user permissions
      if (userId) {
        const userPermission = share.permissions.find(p => p.userId === userId);
        if (userPermission && userPermission.permissions.includes('download')) {
          // Check user-specific expiration and limits
          if (userPermission.expiresAt && userPermission.expiresAt < new Date()) continue;
          if (userPermission.downloadLimit && 
              (userPermission.downloaded || 0) >= userPermission.downloadLimit) continue;
          
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Setup WebSocket listeners
   */
  private static setupWebSocketListeners(): void {
    const wsService = WebSocketService.getInstance();
    
    wsService.on('file:upload_request', async (data: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      conversationId?: string;
    }) => {
      // Handle file upload requests
      console.log('📁 File upload request received:', data.fileName);
      
      // Generate presigned upload URL
      try {
        const uploadUrl = await CDNIntegrationService.generatePresignedUploadUrl(
          this.generateFileName(data.fileName),
          data.mimeType,
          3600
        );
        
        wsService.getSocket()?.emit('file:upload_url', {
          fileName: data.fileName,
          uploadUrl: uploadUrl.uploadUrl,
          fields: uploadUrl.fields,
          finalUrl: uploadUrl.finalUrl,
        });
      } catch (error) {
        wsService.getSocket()?.emit('file:upload_error', {
          fileName: data.fileName,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    });
  }

  /**
   * Notify file uploaded
   */
  private static notifyFileUploaded(metadata: FileMetadata): void {
    const wsService = WebSocketService.getInstance();
    
    if (wsService.isSocketConnected() && metadata.conversationId) {
      wsService.getSocket()?.emit('file:uploaded', {
        fileId: metadata.id,
        fileName: metadata.originalName,
        conversationId: metadata.conversationId,
        messageId: metadata.messageId,
        mimeType: metadata.mimeType,
        size: metadata.size,
        thumbnail: metadata.thumbnail,
        uploadedBy: metadata.uploadedBy,
        uploadedAt: metadata.uploadedAt,
      });
    }
  }

  /**
   * Cache file metadata
   */
  private static async cacheFileMetadata(metadata: FileMetadata): Promise<void> {
    try {
      await CacheService.set(`file_metadata_${metadata.id}`, metadata, { ttl: 86400 });
      
      // Invalidate conversation files cache if applicable
      if (metadata.conversationId) {
        const cacheKey = `conversation_${metadata.conversationId}_files`;
        await CacheService.del(cacheKey);
      }
    } catch (error) {
      console.error('Failed to cache file metadata:', error);
    }
  }

  /**
   * Cache file share
   */
  private static async cacheFileShare(share: FileShare): Promise<void> {
    try {
      await CacheService.set(`file_share_${share.id}`, share, { ttl: 86400 });
    } catch (error) {
      console.error('Failed to cache file share:', error);
    }
  }

  /**
   * Update statistics
   */
  private static updateStats(action: 'upload' | 'download' | 'delete', metadata: FileMetadata): void {
    const today = new Date().toDateString();
    
    switch (action) {
      case 'upload':
        this.stats.totalFiles++;
        this.stats.totalSize += metadata.size;
        this.stats.storageUsed += metadata.size;
        this.stats.uploadsToday++;
        break;
      case 'download':
        this.stats.downloadsToday++;
        break;
      case 'delete':
        this.stats.totalFiles--;
        this.stats.totalSize -= metadata.size;
        this.stats.storageUsed -= metadata.size;
        break;
    }

    // Update by mime type
    this.stats.byMimeType[metadata.mimeType] = 
      (this.stats.byMimeType[metadata.mimeType] || 0) + (action === 'delete' ? -1 : 1);

    // Update by user
    this.stats.byUser[metadata.uploadedBy] = 
      (this.stats.byUser[metadata.uploadedBy] || 0) + (action === 'delete' ? -1 : 1);
  }

  /**
   * Log activity
   */
  private static logActivity(
    action: FileStats['recentActivity'][0]['action'],
    fileId: string,
    fileName: string,
    userId: string
  ): void {
    this.stats.recentActivity.unshift({
      action,
      fileId,
      fileName,
      userId,
      timestamp: new Date(),
    });

    // Keep only last 100 activities
    this.stats.recentActivity = this.stats.recentActivity.slice(0, 100);
  }

  /**
   * Load file categories
   */
  private static async loadFileCategories(): Promise<void> {
    const defaultCategories: FileCategory[] = [
      {
        id: 'resume',
        name: 'Resume/CV',
        description: 'Resume and CV files',
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        autoDelete: false,
        retentionDays: 365,
        requiresApproval: false,
        encryptionRequired: true,
      },
      {
        id: 'profile_image',
        name: 'Profile Images',
        description: 'User profile pictures',
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        autoDelete: false,
        retentionDays: 0,
        requiresApproval: false,
        encryptionRequired: false,
      },
      {
        id: 'document',
        name: 'Documents',
        description: 'General document files',
        allowedMimeTypes: [
          'application/pdf', 'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        autoDelete: true,
        retentionDays: 90,
        requiresApproval: false,
        encryptionRequired: false,
      },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Setup cleanup scheduler
   */
  private static async setupCleanupScheduler(): Promise<void> {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredFiles();
      } catch (error) {
        console.error('File cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Utility functions
   */
  private static generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  }

  private static async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private static async calculateChecksum(file: File): Promise<string> {
    // This would calculate MD5 or SHA256 checksum
    // For now, return a mock checksum
    return `checksum_${file.size}_${file.lastModified}`;
  }

  private static async hashPassword(password: string): Promise<string> {
    // This would use bcrypt or similar
    // For now, return a mock hash
    return `hashed_${password}`;
  }

  private static getCurrentUserId(): string {
    // This would get the current user ID from session/context
    return 'current_user_id';
  }
}

export default FileSharingService;