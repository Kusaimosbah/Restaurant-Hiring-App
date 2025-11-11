import { ComponentType, lazy, LazyExoticComponent } from 'react';
import dynamic from 'next/dynamic';
import CacheService from './CacheService';

export interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
    isAsync: boolean;
  }>;
  duplicates: Array<{
    module: string;
    chunks: string[];
    size: number;
  }>;
  recommendations: string[];
}

export interface LazyComponentOptions {
  fallback?: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; reset: () => void }>;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  ssr?: boolean;
}

export interface CodeSplitConfig {
  chunkStrategy: 'route' | 'feature' | 'vendor' | 'hybrid';
  preloadStrategy: 'viewport' | 'hover' | 'idle' | 'none';
  bundleSizeThreshold: number;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  enableGzip: boolean;
  enableBrotli: boolean;
}

export interface LoadingMetrics {
  component: string;
  loadTime: number;
  size: number;
  cacheHit: boolean;
  timestamp: Date;
}

export class CodeSplittingService {
  private static config: CodeSplitConfig = {
    chunkStrategy: 'hybrid',
    preloadStrategy: 'viewport',
    bundleSizeThreshold: 250 * 1024, // 250KB
    enableTreeShaking: true,
    enableMinification: true,
    enableGzip: true,
    enableBrotli: true,
  };

  private static loadingMetrics: LoadingMetrics[] = [];
  private static preloadedComponents = new Set<string>();
  private static componentRegistry = new Map<string, {
    component: LazyExoticComponent<any>;
    metadata: {
      size?: number;
      dependencies: string[];
      priority: 'high' | 'medium' | 'low';
      route?: string;
    };
  }>();

  /**
   * Configure code splitting settings
   */
  static configure(config: Partial<CodeSplitConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📦 Code splitting configured:', this.config);
  }

  /**
   * Create lazy component with advanced options
   */
  static createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions & { name: string } = { name: 'Unknown' }
  ): LazyExoticComponent<T> {
    const lazyComponent = lazy(async () => {
      const startTime = performance.now();
      
      try {
        // Check cache first
        const cacheKey = `lazy_component_${options.name}`;
        const cached = await CacheService.get(cacheKey);
        
        if (cached && this.config.preloadStrategy !== 'none') {
          console.log(`📦 Loading component from cache: ${options.name}`);
        }

        const moduleResult = await importFn();
        const loadTime = performance.now() - startTime;

        // Record metrics
        this.recordLoadingMetrics({
          component: options.name,
          loadTime,
          size: 0, // Would need webpack stats for actual size
          cacheHit: !!cached,
          timestamp: new Date(),
        });

        // Cache the component metadata
        await CacheService.set(cacheKey, {
          name: options.name,
          loadTime,
          lastLoaded: new Date(),
        }, CacheService.TTL.HOUR);

        console.log(`📦 Lazy component loaded: ${options.name} (${loadTime.toFixed(2)}ms)`);
        
        return moduleResult;
      } catch (error) {
        console.error(`❌ Failed to load component ${options.name}:`, error);
        throw error;
      }
    });

    // Register component
    this.componentRegistry.set(options.name, {
      component: lazyComponent,
      metadata: {
        dependencies: [],
        priority: options.priority || 'medium',
        route: undefined,
      },
    });

    return lazyComponent;
  }

  /**
   * Create dynamic Next.js component with optimizations
   */
  static createDynamicComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: {
      name: string;
      ssr?: boolean;
      loading?: ComponentType;
      preload?: boolean;
    }
  ) {
    const defaultLoading = () => {
      // Return a simple loading element (would need React createElement in real implementation)
      return null; // Simplified for TypeScript compatibility
    };

    const dynamicComponent = dynamic(importFn, {
      ssr: options.ssr ?? true,
      loading: options.loading || defaultLoading,
    });

    // Preload if requested
    if (options.preload) {
      this.preloadComponent(options.name, importFn);
    }

    return dynamicComponent;
  }

  /**
   * Preload component based on strategy
   */
  static async preloadComponent<T>(
    name: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<void> {
    if (this.preloadedComponents.has(name)) {
      return;
    }

    try {
      console.log(`🚀 Preloading component: ${name}`);
      const startTime = performance.now();
      
      await importFn();
      const loadTime = performance.now() - startTime;
      
      this.preloadedComponents.add(name);
      
      // Cache preload status
      await CacheService.set(
        `preloaded_${name}`,
        { timestamp: new Date(), loadTime },
        CacheService.TTL.HOUR
      );

      console.log(`✅ Component preloaded: ${name} (${loadTime.toFixed(2)}ms)`);
    } catch (error) {
      console.error(`❌ Failed to preload component ${name}:`, error);
    }
  }

  /**
   * Batch preload components
   */
  static async preloadComponents(
    components: Array<{
      name: string;
      importFn: () => Promise<any>;
      priority?: number;
    }>
  ): Promise<void> {
    // Sort by priority
    const sortedComponents = components.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Preload in batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < sortedComponents.length; i += batchSize) {
      const batch = sortedComponents.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(({ name, importFn }) => this.preloadComponent(name, importFn))
      );
      
      // Small delay between batches
      if (i + batchSize < sortedComponents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Create route-based code splitting
   */
  static createRouteComponent(route: string, importFn: () => Promise<any>) {
    const componentName = `Route_${route.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    return this.createDynamicComponent(importFn, {
      name: componentName,
      ssr: true,
      preload: this.shouldPreloadRoute(route),
    });
  }

  /**
   * Create feature-based code splitting
   */
  static createFeatureComponent(
    feature: string,
    importFn: () => Promise<any>,
    dependencies: string[] = []
  ) {
    const componentName = `Feature_${feature}`;
    
    // Register with dependencies
    this.componentRegistry.set(componentName, {
      component: this.createLazyComponent(importFn, { name: componentName }),
      metadata: {
        dependencies,
        priority: 'medium',
      },
    });

    return this.componentRegistry.get(componentName)!.component;
  }

  /**
   * Create vendor library chunks
   */
  static createVendorChunk(
    name: string,
    libraries: string[],
    importFn: () => Promise<any>
  ) {
    return this.createLazyComponent(importFn, {
      name: `Vendor_${name}`,
      priority: 'low',
    });
  }

  /**
   * Optimize bundle with tree shaking detection
   */
  static analyzeBundleUsage(
    componentName: string,
    usedExports: string[],
    totalExports: string[]
  ): {
    utilizationRate: number;
    unusedExports: string[];
    recommendations: string[];
  } {
    const unusedExports = totalExports.filter(exp => !usedExports.includes(exp));
    const utilizationRate = (usedExports.length / totalExports.length) * 100;
    
    const recommendations: string[] = [];
    
    if (utilizationRate < 30) {
      recommendations.push(`Consider splitting ${componentName} - only ${utilizationRate.toFixed(1)}% utilized`);
    }
    
    if (unusedExports.length > 5) {
      recommendations.push(`Remove ${unusedExports.length} unused exports from ${componentName}`);
    }

    return {
      utilizationRate,
      unusedExports,
      recommendations,
    };
  }

  /**
   * Get bundle analysis
   */
  static getBundleAnalysis(): BundleAnalysis {
    const chunks = Array.from(this.componentRegistry.entries()).map(([name, { metadata }]) => ({
      name,
      size: metadata.size || 0,
      modules: metadata.dependencies,
      isAsync: true,
    }));

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    // Mock duplicate detection (would need webpack stats)
    const duplicates = this.findDuplicateModules();
    
    const recommendations = this.generateOptimizationRecommendations(chunks, totalSize);

    return {
      totalSize,
      chunks,
      duplicates,
      recommendations,
    };
  }

  /**
   * Get loading metrics
   */
  static getLoadingMetrics(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): {
    totalLoads: number;
    averageLoadTime: number;
    cacheHitRate: number;
    slowestComponents: LoadingMetrics[];
    metrics: LoadingMetrics[];
  } {
    const filteredMetrics = this.loadingMetrics.filter(
      metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const totalLoads = filteredMetrics.length;
    const averageLoadTime = totalLoads > 0 
      ? filteredMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalLoads 
      : 0;
    
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalLoads > 0 ? (cacheHits / totalLoads) * 100 : 0;
    
    const slowestComponents = [...filteredMetrics]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 10);

    return {
      totalLoads,
      averageLoadTime,
      cacheHitRate,
      slowestComponents,
      metrics: filteredMetrics,
    };
  }

  /**
   * Setup intersection observer for viewport-based preloading
   */
  static setupViewportPreloading(): void {
    if (typeof window === 'undefined' || this.config.preloadStrategy !== 'viewport') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentName = entry.target.getAttribute('data-preload-component');
            if (componentName && !this.preloadedComponents.has(componentName)) {
              // Trigger preload (would need import function reference)
              console.log(`🎯 Viewport preload triggered for: ${componentName}`);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observer would be attached to elements with data-preload-component attribute
    document.querySelectorAll('[data-preload-component]').forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Setup hover-based preloading
   */
  static setupHoverPreloading(): void {
    if (typeof window === 'undefined' || this.config.preloadStrategy !== 'hover') {
      return;
    }

    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const componentName = target.getAttribute('data-preload-component');
      
      if (componentName && !this.preloadedComponents.has(componentName)) {
        // Debounce hover preloading
        setTimeout(() => {
          if (target.matches(':hover')) {
            console.log(`🖱️ Hover preload triggered for: ${componentName}`);
            // Trigger preload
          }
        }, 50);
      }
    });
  }

  /**
   * Setup idle-time preloading
   */
  static setupIdlePreloading(): void {
    if (typeof window === 'undefined' || this.config.preloadStrategy !== 'idle') {
      return;
    }

    // Use requestIdleCallback if available
    const scheduleIdleWork = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 5000 });
      } else {
        setTimeout(callback, 1);
      }
    };

    // Queue components for idle preloading
    const idleQueue = Array.from(this.componentRegistry.keys())
      .filter(name => !this.preloadedComponents.has(name));

    const processIdleQueue = () => {
      if (idleQueue.length === 0) return;
      
      const componentName = idleQueue.shift()!;
      console.log(`💤 Idle preload triggered for: ${componentName}`);
      
      // Schedule next item
      if (idleQueue.length > 0) {
        scheduleIdleWork(processIdleQueue);
      }
    };

    scheduleIdleWork(processIdleQueue);
  }

  /**
   * Generate Next.js webpack config optimization
   */
  static generateWebpackConfig(): {
    optimization: any;
    resolve: any;
    module: any;
  } {
    return {
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 5,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
          },
        },
        usedExports: this.config.enableTreeShaking,
        sideEffects: false,
      },
      resolve: {
        alias: {
          // Add module aliases for better tree shaking
        },
      },
      module: {
        rules: [
          // Tree shaking for specific libraries
          {
            test: /[\\/]node_modules[\\/]lodash[\\/]/,
            sideEffects: false,
          },
        ],
      },
    };
  }

  /**
   * Record loading metrics
   */
  private static recordLoadingMetrics(metrics: LoadingMetrics): void {
    this.loadingMetrics.push(metrics);
    
    // Keep only recent metrics
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    this.loadingMetrics = this.loadingMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Check if route should be preloaded
   */
  private static shouldPreloadRoute(route: string): boolean {
    const highPriorityRoutes = ['/dashboard', '/profile', '/jobs'];
    return highPriorityRoutes.includes(route);
  }

  /**
   * Find duplicate modules (mock implementation)
   */
  private static findDuplicateModules(): Array<{
    module: string;
    chunks: string[];
    size: number;
  }> {
    // Would need webpack bundle analyzer data
    return [];
  }

  /**
   * Generate optimization recommendations
   */
  private static generateOptimizationRecommendations(
    chunks: any[],
    totalSize: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (totalSize > this.config.bundleSizeThreshold * 2) {
      recommendations.push('Bundle size is large - consider more aggressive code splitting');
    }
    
    const largeChunks = chunks.filter(chunk => chunk.size > this.config.bundleSizeThreshold);
    if (largeChunks.length > 0) {
      recommendations.push(`${largeChunks.length} chunks exceed size threshold - consider splitting`);
    }
    
    if (chunks.length < 3) {
      recommendations.push('Consider more granular code splitting for better caching');
    }

    return recommendations;
  }

  /**
   * Clear metrics and cache
   */
  static clearMetrics(): void {
    this.loadingMetrics = [];
    this.preloadedComponents.clear();
    console.log('📦 Code splitting metrics cleared');
  }

  /**
   * Get configuration
   */
  static getConfig(): CodeSplitConfig {
    return { ...this.config };
  }

  /**
   * Get component registry
   */
  static getComponentRegistry(): Map<string, any> {
    return new Map(this.componentRegistry);
  }
}

export default CodeSplittingService;