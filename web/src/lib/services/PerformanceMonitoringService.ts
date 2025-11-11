import { performance } from 'perf_hooks';
import CacheService, { CacheTTL, CacheKeys } from './CacheService';

export interface PerformanceMetric {
  id: string;
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  category: 'api' | 'database' | 'cache' | 'external' | 'render' | 'custom';
  status?: 'success' | 'error' | 'timeout';
}

export interface PerformanceThresholds {
  api: number;
  database: number;
  cache: number;
  external: number;
  render: number;
  custom: number;
}

export interface PerformanceReport {
  period: string;
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  categoryBreakdown: Record<string, {
    count: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }>;
  slowestOperations: PerformanceMetric[];
  errorSummary: Record<string, number>;
}

export interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export class PerformanceMonitoringService {
  private static metrics: PerformanceMetric[] = [];
  private static webVitals: Map<string, WebVitals> = new Map();
  private static readonly MAX_METRICS = 10000; // Keep last 10k metrics
  private static readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    api: 1000,      // 1 second
    database: 500,  // 500ms
    cache: 50,      // 50ms
    external: 5000, // 5 seconds
    render: 2000,   // 2 seconds
    custom: 1000,   // 1 second
  };

  private static thresholds = { ...this.DEFAULT_THRESHOLDS };
  private static alerts: Array<{
    metric: PerformanceMetric;
    threshold: number;
    triggeredAt: Date;
  }> = [];

  /**
   * Start measuring performance
   */
  static startMeasurement(name: string, category: PerformanceMetric['category'] = 'custom'): {
    id: string;
    end: (metadata?: Record<string, any>, status?: PerformanceMetric['status']) => PerformanceMetric;
  } {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    return {
      id,
      end: (metadata?: Record<string, any>, status: PerformanceMetric['status'] = 'success') => {
        const duration = performance.now() - startTime;
        
        const metric: PerformanceMetric = {
          id,
          name,
          duration,
          timestamp: new Date(),
          metadata,
          category,
          status,
        };

        this.recordMetric(metric);
        return metric;
      },
    };
  }

  /**
   * Record a performance metric
   */
  static recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Check for threshold violations
    this.checkThresholds(metric);

    // Log slow operations
    if (metric.duration > this.thresholds[metric.category]) {
      console.warn(`🐌 Slow ${metric.category} operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Record Web Vitals metrics
   */
  static recordWebVitals(sessionId: string, vitals: Partial<WebVitals>): void {
    const existing = this.webVitals.get(sessionId) || {};
    this.webVitals.set(sessionId, { ...existing, ...vitals });

    // Log poor Web Vitals
    if (vitals.lcp && vitals.lcp > 2500) {
      console.warn(`⚠️ Poor LCP: ${vitals.lcp}ms for session ${sessionId}`);
    }
    if (vitals.fid && vitals.fid > 100) {
      console.warn(`⚠️ Poor FID: ${vitals.fid}ms for session ${sessionId}`);
    }
    if (vitals.cls && vitals.cls > 0.1) {
      console.warn(`⚠️ Poor CLS: ${vitals.cls} for session ${sessionId}`);
    }
  }

  /**
   * Measure async function execution
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'custom',
    metadata?: Record<string, any>
  ): Promise<T> {
    const measurement = this.startMeasurement(name, category);
    
    try {
      const result = await fn();
      measurement.end(metadata, 'success');
      return result;
    } catch (error) {
      measurement.end({ ...metadata, error: (error as Error).message }, 'error');
      throw error;
    }
  }

  /**
   * Measure synchronous function execution
   */
  static measure<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'custom',
    metadata?: Record<string, any>
  ): T {
    const measurement = this.startMeasurement(name, category);
    
    try {
      const result = fn();
      measurement.end(metadata, 'success');
      return result;
    } catch (error) {
      measurement.end({ ...metadata, error: (error as Error).message }, 'error');
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  static generateReport(
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): PerformanceReport {
    const now = new Date();
    const periodMs = this.getPeriodInMs(period);
    const cutoff = new Date(now.getTime() - periodMs);

    const relevantMetrics = this.metrics.filter(
      metric => metric.timestamp >= cutoff
    );

    if (relevantMetrics.length === 0) {
      return this.getEmptyReport(period);
    }

    // Calculate basic stats
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const totalRequests = relevantMetrics.length;
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / totalRequests;
    const p95Index = Math.floor(totalRequests * 0.95);
    const p99Index = Math.floor(totalRequests * 0.99);
    const p95ResponseTime = durations[p95Index] || 0;
    const p99ResponseTime = durations[p99Index] || 0;

    // Error rate
    const errorCount = relevantMetrics.filter(m => m.status === 'error').length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Throughput (requests per second)
    const throughput = totalRequests / (periodMs / 1000);

    // Category breakdown
    const categoryBreakdown: Record<string, any> = {};
    relevantMetrics.forEach(metric => {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = {
          durations: [],
          count: 0,
        };
      }
      categoryBreakdown[metric.category].durations.push(metric.duration);
      categoryBreakdown[metric.category].count++;
    });

    // Process category stats
    Object.keys(categoryBreakdown).forEach(category => {
      const durations = categoryBreakdown[category].durations;
      categoryBreakdown[category] = {
        count: categoryBreakdown[category].count,
        avgDuration: durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
      };
    });

    // Slowest operations
    const slowestOperations = relevantMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Error summary
    const errorSummary: Record<string, number> = {};
    relevantMetrics
      .filter(m => m.status === 'error')
      .forEach(metric => {
        const errorType = metric.metadata?.error || 'Unknown Error';
        errorSummary[errorType] = (errorSummary[errorType] || 0) + 1;
      });

    return {
      period,
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      categoryBreakdown,
      slowestOperations,
      errorSummary,
    };
  }

  /**
   * Get Web Vitals report
   */
  static getWebVitalsReport(): {
    totalSessions: number;
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
    avgTTFB: number;
    goodLCP: number;
    goodFID: number;
    goodCLS: number;
  } {
    const vitals = Array.from(this.webVitals.values());
    
    if (vitals.length === 0) {
      return {
        totalSessions: 0,
        avgLCP: 0,
        avgFID: 0,
        avgCLS: 0,
        avgTTFB: 0,
        goodLCP: 0,
        goodFID: 0,
        goodCLS: 0,
      };
    }

    const lcpValues = vitals.filter(v => v.lcp).map(v => v.lcp!);
    const fidValues = vitals.filter(v => v.fid).map(v => v.fid!);
    const clsValues = vitals.filter(v => v.cls).map(v => v.cls!);
    const ttfbValues = vitals.filter(v => v.ttfb).map(v => v.ttfb!);

    return {
      totalSessions: vitals.length,
      avgLCP: lcpValues.length > 0 ? lcpValues.reduce((sum, val) => sum + val, 0) / lcpValues.length : 0,
      avgFID: fidValues.length > 0 ? fidValues.reduce((sum, val) => sum + val, 0) / fidValues.length : 0,
      avgCLS: clsValues.length > 0 ? clsValues.reduce((sum, val) => sum + val, 0) / clsValues.length : 0,
      avgTTFB: ttfbValues.length > 0 ? ttfbValues.reduce((sum, val) => sum + val, 0) / ttfbValues.length : 0,
      goodLCP: lcpValues.filter(lcp => lcp <= 2500).length,
      goodFID: fidValues.filter(fid => fid <= 100).length,
      goodCLS: clsValues.filter(cls => cls <= 0.1).length,
    };
  }

  /**
   * Get real-time performance metrics
   */
  static getRealTimeMetrics(): {
    currentLoad: number;
    activeRequests: number;
    recentErrors: PerformanceMetric[];
    avgResponseTime: number;
    memoryUsage?: NodeJS.MemoryUsage;
  } {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp >= oneMinuteAgo
    );

    const recentErrors = recentMetrics.filter(
      metric => metric.status === 'error'
    ).slice(-10);

    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    return {
      currentLoad: recentMetrics.length,
      activeRequests: 0, // Would need to track active requests separately
      recentErrors,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Set performance thresholds
   */
  static setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  static getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
    this.webVitals.clear();
    this.alerts = [];
  }

  /**
   * Get metrics by category
   */
  static getMetricsByCategory(
    category: PerformanceMetric['category'],
    limit: number = 100
  ): PerformanceMetric[] {
    return this.metrics
      .filter(metric => metric.category === category)
      .slice(-limit);
  }

  /**
   * Export metrics for external analysis
   */
  static exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'category', 'duration', 'status', 'metadata'];
      const rows = this.metrics.map(metric => [
        metric.timestamp.toISOString(),
        metric.name,
        metric.category,
        metric.duration.toString(),
        metric.status || 'success',
        JSON.stringify(metric.metadata || {}),
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Check thresholds and trigger alerts
   */
  private static checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.category];
    
    if (metric.duration > threshold) {
      this.alerts.push({
        metric,
        threshold,
        triggeredAt: new Date(),
      });

      // Keep only recent alerts
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.alerts = this.alerts.filter(alert => alert.triggeredAt >= oneHourAgo);
    }
  }

  /**
   * Get period in milliseconds
   */
  private static getPeriodInMs(period: string): number {
    switch (period) {
      case '1h': return 3600000;
      case '24h': return 86400000;
      case '7d': return 604800000;
      case '30d': return 2592000000;
      default: return 86400000;
    }
  }

  /**
   * Get empty report structure
   */
  private static getEmptyReport(period: string): PerformanceReport {
    return {
      period,
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      categoryBreakdown: {},
      slowestOperations: [],
      errorSummary: {},
    };
  }

  /**
   * Get performance alerts
   */
  static getAlerts(limit: number = 50): Array<{
    metric: PerformanceMetric;
    threshold: number;
    triggeredAt: Date;
  }> {
    return this.alerts.slice(-limit);
  }

  /**
   * Create Express middleware for automatic API monitoring
   */
  static createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const measurement = this.startMeasurement(
        `${req.method} ${req.route?.path || req.path}`,
        'api'
      );

      const originalSend = res.send;
      res.send = function(data: any) {
        const status = res.statusCode >= 400 ? 'error' : 'success';
        measurement.end({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'],
        }, status);
        
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

export default PerformanceMonitoringService;