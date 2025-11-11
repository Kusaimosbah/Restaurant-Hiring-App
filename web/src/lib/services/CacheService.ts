import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression for large values
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export class CacheService {
  private static redis: Redis | null = null;
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  /**
   * Initialize Redis connection
   */
  static initialize(config?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }): void {
    const redisConfig = {
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config?.password || process.env.REDIS_PASSWORD,
      db: config?.db || parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis ready for operations');
    });
  }

  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      console.warn('Redis not initialized, falling back to database');
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      
      if (cached === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      // Try to parse JSON, fallback to string
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as T;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  static async set(
    key: string,
    value: any,
    config: CacheConfig = { ttl: 3600 }
  ): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (config.ttl > 0) {
        await this.redis.setex(key, config.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      // Add tags for cache invalidation
      if (config.tags) {
        for (const tag of config.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
        }
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async del(key: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTag(tag: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      
      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys with this tag
      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      pipeline.del(`tag:${tag}`); // Remove the tag set
      
      const results = await pipeline.exec();
      const deletedCount = results?.filter(([err, result]) => !err && result === 1).length || 0;
      
      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      console.error('Cache invalidate by tag error:', error);
      return 0;
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config: CacheConfig = { ttl: 3600 }
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFunction();
    
    // Cache the result
    await this.set(key, value, config);
    
    return value;
  }

  /**
   * Cache with mutex to prevent cache stampede
   */
  static async getOrSetWithLock<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config: CacheConfig = { ttl: 3600 }
  ): Promise<T> {
    const lockKey = `lock:${key}`;
    const lockTtl = 30; // 30 seconds lock

    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Try to acquire lock
    const lockAcquired = await this.redis?.set(lockKey, '1', 'EX', lockTtl, 'NX');
    
    if (lockAcquired === 'OK') {
      try {
        // Double-check cache after acquiring lock
        const cachedAfterLock = await this.get<T>(key);
        if (cachedAfterLock !== null) {
          return cachedAfterLock;
        }

        // Fetch and cache
        const value = await fetchFunction();
        await this.set(key, value, config);
        return value;
      } finally {
        // Release lock
        await this.redis?.del(lockKey);
      }
    } else {
      // Lock not acquired, wait and try cache again
      await new Promise(resolve => setTimeout(resolve, 100));
      const cachedAfterWait = await this.get<T>(key);
      if (cachedAfterWait !== null) {
        return cachedAfterWait;
      }

      // Fallback to direct fetch without caching
      return fetchFunction();
    }
  }

  /**
   * Batch get multiple keys
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * Batch set multiple keys
   */
  static async mset(
    items: Array<{ key: string; value: any; config?: CacheConfig }>
  ): Promise<boolean> {
    if (!this.redis || items.length === 0) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      
      items.forEach(({ key, value, config = { ttl: 3600 } }) => {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (config.ttl > 0) {
          pipeline.setex(key, config.ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }

        // Add tags
        if (config.tags) {
          config.tags.forEach(tag => {
            pipeline.sadd(`tag:${tag}`, key);
          });
        }
      });

      await pipeline.exec();
      this.stats.sets += items.length;
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Get Redis info
   */
  static async getRedisInfo(): Promise<any> {
    if (!this.redis) {
      return null;
    }

    try {
      const info = await this.redis.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      console.error('Redis info error:', error);
      return null;
    }
  }

  /**
   * Flush all cache
   */
  static async flushAll(): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      await this.redis.flushall();
      this.resetStats();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Update hit rate calculation
   */
  private static updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Parse Redis info string
   */
  private static parseRedisInfo(info: string): Record<string, any> {
    const parsed: Record<string, any> = {};
    const lines = info.split('\r\n');
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          parsed[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    });
    
    return parsed;
  }

  /**
   * Graceful shutdown
   */
  static async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      console.log('🔌 Redis disconnected gracefully');
    }
  }
}

// Pre-defined cache keys and TTLs
export const CacheKeys = {
  // User-related caches
  USER_PROFILE: (id: string) => `user:profile:${id}`,
  USER_PERMISSIONS: (id: string) => `user:permissions:${id}`,
  USER_SESSIONS: (id: string) => `user:sessions:${id}`,

  // Job-related caches
  JOB_DETAILS: (id: string) => `job:${id}`,
  JOB_SEARCH: (hash: string) => `job:search:${hash}`,
  JOB_MATCHES: (userId: string) => `job:matches:${userId}`,

  // Application-related caches
  APPLICATION_LIST: (userId: string) => `applications:user:${userId}`,
  APPLICATION_STATS: (restaurantId: string) => `applications:stats:${restaurantId}`,

  // Analytics caches
  ANALYTICS_DASHBOARD: (userId: string, period: string) => `analytics:${userId}:${period}`,
  PERFORMANCE_METRICS: (type: string) => `metrics:${type}`,

  // System caches
  SYSTEM_CONFIG: 'system:config',
  FEATURE_FLAGS: 'system:features',
};

export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800,    // 1 week
};

export const CacheTags = {
  USER: 'user',
  JOB: 'job',
  APPLICATION: 'application',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
};

// Initialize cache service
if (process.env.NODE_ENV !== 'test') {
  CacheService.initialize();
}

export default CacheService;