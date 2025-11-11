import { NextRequest, NextResponse } from 'next/server';
import PerformanceMonitoringService from '@/lib/services/PerformanceMonitoringService';
import CacheService from '@/lib/services/CacheService';
import DatabaseOptimizationService from '@/lib/services/DatabaseOptimizationService';
import { ImageOptimizationService } from '@/lib/services/ImageOptimizationService';
import CDNIntegrationService from '@/lib/services/CDNIntegrationService';
import CodeSplittingService from '@/lib/services/CodeSplittingService';

export interface PerformanceMetricsResponse {
  timestamp: Date;
  server: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  database: {
    connections: number;
    queryCount: number;
    averageResponseTime: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
    memory: number;
  };
  cdn: {
    requests: number;
    bandwidth: number;
    cacheHitRate: number;
    totalFiles: number;
    totalSize: number;
  };
  bundleOptimization: {
    totalSize: number;
    chunkCount: number;
    loadingMetrics: {
      totalLoads: number;
      averageLoadTime: number;
      cacheHitRate: number;
    };
  };
  recommendations: string[];
}

/**
 * GET /api/performance/metrics
 * Get comprehensive performance metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '1h';
    const category = url.searchParams.get('category');

    // Calculate time range
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    let metrics: Partial<PerformanceMetricsResponse> = {
      timestamp: now,
    };

    // Get server metrics
    if (!category || category === 'server') {
      metrics.server = await getServerMetrics();
    }

    // Get database metrics
    if (!category || category === 'database') {
      metrics.database = await getDatabaseMetrics(startTime, now);
    }

    // Get cache metrics
    if (!category || category === 'cache') {
      metrics.cache = await getCacheMetrics();
    }

    // Get CDN metrics
    if (!category || category === 'cdn') {
      metrics.cdn = getCDNMetrics();
    }

    // Get bundle optimization metrics
    if (!category || category === 'bundle') {
      metrics.bundleOptimization = getBundleOptimizationMetrics(startTime, now);
    }

    // Generate recommendations
    if (!category) {
      metrics.recommendations = generateRecommendations(metrics as PerformanceMetricsResponse);
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/metrics
 * Record custom performance metric
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { category, name, value, tags, timestamp } = body;

    if (!category || !name || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: category, name, value',
        },
        { status: 400 }
      );
    }

    // Record the metric
    PerformanceMonitoringService.recordMetric({
      id: `custom_${Date.now()}`,
      name,
      duration: typeof value === 'number' ? value : 0,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: tags,
      category: category as any,
    });

    // Also record in cache for quick access
    const cacheKey = `custom_metric_${category}_${name}_${Date.now()}`;
    await CacheService.set(cacheKey, {
      category,
      name,
      value,
      tags,
      timestamp: timestamp || new Date(),
    }, { ttl: 3600 }); // 1 hour in seconds

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully',
    });

  } catch (error) {
    console.error('Record metric error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record metric',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get server metrics
 */
async function getServerMetrics(): Promise<PerformanceMetricsResponse['server']> {
  const memoryUsage = process.memoryUsage();
  
  return {
    uptime: process.uptime(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    cpu: {
      usage: await getCPUUsage(),
    },
  };
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics(
  startTime: Date,
  endTime: Date
): Promise<PerformanceMetricsResponse['database']> {
  try {
    // Simplified implementation - would integrate with actual database monitoring
    return {
      connections: 5, // Mock value
      queryCount: 1250,
      averageResponseTime: 45,
      slowQueries: [
        {
          query: 'SELECT * FROM applications WHERE created_at > ?',
          duration: 1250,
          timestamp: new Date(),
        },
      ],
    };
  } catch (error) {
    console.error('Database metrics error:', error);
    return {
      connections: 0,
      queryCount: 0,
      averageResponseTime: 0,
      slowQueries: [],
    };
  }
}

/**
 * Get cache metrics
 */
async function getCacheMetrics(): Promise<PerformanceMetricsResponse['cache']> {
  try {
    const stats = await CacheService.getStats();
    
    return {
      hitRate: stats.hitRate,
      size: stats.hits + stats.misses, // Use total operations as size approximation
      evictions: 0, // Not available in current interface
      memory: 0, // Not available in current interface
    };
  } catch (error) {
    console.error('Cache metrics error:', error);
    return {
      hitRate: 0,
      size: 0,
      evictions: 0,
      memory: 0,
    };
  }
}

/**
 * Get CDN metrics
 */
function getCDNMetrics(): PerformanceMetricsResponse['cdn'] {
  try {
    const stats = CDNIntegrationService.getStats();
    
    return {
      requests: stats.requests,
      bandwidth: stats.bandwidth,
      cacheHitRate: stats.cacheHitRate,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
    };
  } catch (error) {
    console.error('CDN metrics error:', error);
    return {
      requests: 0,
      bandwidth: 0,
      cacheHitRate: 0,
      totalFiles: 0,
      totalSize: 0,
    };
  }
}

/**
 * Get bundle optimization metrics
 */
function getBundleOptimizationMetrics(
  startTime: Date,
  endTime: Date
): PerformanceMetricsResponse['bundleOptimization'] {
  try {
    const bundleAnalysis = CodeSplittingService.getBundleAnalysis();
    const loadingMetrics = CodeSplittingService.getLoadingMetrics({
      start: startTime,
      end: endTime,
    });

    return {
      totalSize: bundleAnalysis.totalSize,
      chunkCount: bundleAnalysis.chunks.length,
      loadingMetrics: {
        totalLoads: loadingMetrics.totalLoads,
        averageLoadTime: loadingMetrics.averageLoadTime,
        cacheHitRate: loadingMetrics.cacheHitRate,
      },
    };
  } catch (error) {
    console.error('Bundle optimization metrics error:', error);
    return {
      totalSize: 0,
      chunkCount: 0,
      loadingMetrics: {
        totalLoads: 0,
        averageLoadTime: 0,
        cacheHitRate: 0,
      },
    };
  }
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(metrics: PerformanceMetricsResponse): string[] {
  const recommendations: string[] = [];

  // Server recommendations
  if (metrics.server.memory.percentage > 80) {
    recommendations.push('High memory usage detected - consider scaling or optimizing memory consumption');
  }

  if (metrics.server.cpu.usage > 70) {
    recommendations.push('High CPU usage detected - consider load balancing or performance optimization');
  }

  // Database recommendations
  if (metrics.database.averageResponseTime > 1000) {
    recommendations.push('Database queries are slow - consider indexing or query optimization');
  }

  if (metrics.database.slowQueries.length > 10) {
    recommendations.push(`${metrics.database.slowQueries.length} slow queries detected - review and optimize`);
  }

  // Cache recommendations
  if (metrics.cache.hitRate < 70) {
    recommendations.push('Low cache hit rate - review caching strategy and TTL settings');
  }

  if (metrics.cache.evictions > 100) {
    recommendations.push('High cache evictions - consider increasing cache memory or adjusting TTL');
  }

  // CDN recommendations
  if (metrics.cdn.cacheHitRate < 80) {
    recommendations.push('Low CDN cache hit rate - review CDN configuration and cache headers');
  }

  // Bundle recommendations
  if (metrics.bundleOptimization.totalSize > 1024 * 1024) { // 1MB
    recommendations.push('Large bundle size detected - implement more aggressive code splitting');
  }

  if (metrics.bundleOptimization.loadingMetrics.averageLoadTime > 3000) {
    recommendations.push('Slow component loading - consider preloading or bundle optimization');
  }

  return recommendations;
}

/**
 * Get CPU usage (simplified implementation)
 */
async function getCPUUsage(): Promise<number> {
  // Simplified CPU usage calculation
  // In production, you'd want to use a proper monitoring library
  const startUsage = process.cpuUsage();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = endUsage.user + endUsage.system;
      const usage = (totalUsage / 1000000) * 100; // Convert to percentage
      resolve(Math.min(usage, 100));
    }, 100);
  });
}

/**
 * Convert time range string to milliseconds
 */
function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  return ranges[timeRange] || ranges['1h'];
}