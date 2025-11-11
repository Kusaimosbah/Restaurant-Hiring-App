import { PrismaClient } from '@prisma/client';
import CacheService, { CacheKeys, CacheTTL, CacheTags } from './CacheService';

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  tags?: string[];
  includeCount?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryMetrics {
  query: string;
  duration: number;
  cacheHit: boolean;
  recordCount: number;
  executedAt: Date;
}

export class DatabaseOptimizationService {
  private static prisma: PrismaClient;
  private static queryMetrics: QueryMetrics[] = [];
  private static slowQueryThreshold = 1000; // ms

  /**
   * Initialize with Prisma client
   */
  static initialize(prismaClient: PrismaClient): void {
    this.prisma = prismaClient;
    
    // Add query logging middleware
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
        
        this.queryMetrics.push({
          query: `${params.model}.${params.action}`,
          duration,
          cacheHit: false,
          recordCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          executedAt: new Date(),
        });
      }

      return result;
    });
  }

  /**
   * Optimized user queries with caching
   */
  static async findUser(
    id: string,
    options: QueryOptions = { cache: true, cacheTTL: CacheTTL.MEDIUM }
  ) {
    const cacheKey = options.cacheKey || CacheKeys.USER_PROFILE(id);

    if (options.cache) {
      return CacheService.getOrSet(
        cacheKey,
        async () => {
          return this.prisma.user.findUnique({
            where: { id },
            include: {
              profile: true,
              restaurant: true,
              _count: {
                select: {
                  applications: true,
                  sentMessages: true,
                  receivedMessages: true,
                },
              },
            },
          });
        },
        { ttl: options.cacheTTL || CacheTTL.MEDIUM, tags: [CacheTags.USER] }
      );
    }

    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        restaurant: true,
        _count: {
          select: {
            applications: true,
            sentMessages: true,
            receivedMessages: true,
          },
        },
      },
    });
  }

  /**
   * Optimized job search with advanced filtering and caching
   */
  static async searchJobs(
    filters: {
      location?: string;
      skills?: string[];
      experienceLevel?: string;
      salaryMin?: number;
      salaryMax?: number;
      jobType?: string;
      restaurantId?: string;
      availability?: string[];
    },
    options: QueryOptions = { 
      cache: true, 
      cacheTTL: CacheTTL.SHORT,
      page: 1,
      limit: 20
    }
  ): Promise<PaginatedResult<any>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Create cache key from filters
    const filterHash = Buffer.from(JSON.stringify({ filters, page, limit })).toString('base64').slice(0, 16);
    const cacheKey = options.cacheKey || CacheKeys.JOB_SEARCH(filterHash);

    const queryBuilder = () => {
      const where: any = {
        isActive: true,
        expiresAt: { gt: new Date() },
      };

      // Location filter with fuzzy matching
      if (filters.location) {
        where.OR = [
          { location: { contains: filters.location, mode: 'insensitive' } },
          { restaurant: { location: { contains: filters.location, mode: 'insensitive' } } },
        ];
      }

      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        where.requirements = {
          array_contains: filters.skills,
        };
      }

      // Experience level filter
      if (filters.experienceLevel) {
        where.experienceLevel = filters.experienceLevel;
      }

      // Salary range filter
      if (filters.salaryMin || filters.salaryMax) {
        where.salary = {};
        if (filters.salaryMin) where.salary.gte = filters.salaryMin;
        if (filters.salaryMax) where.salary.lte = filters.salaryMax;
      }

      // Job type filter
      if (filters.jobType) {
        where.jobType = filters.jobType;
      }

      // Restaurant filter
      if (filters.restaurantId) {
        where.restaurantId = filters.restaurantId;
      }

      // Availability filter
      if (filters.availability && filters.availability.length > 0) {
        where.availability = {
          hasEvery: filters.availability,
        };
      }

      return where;
    };

    if (options.cache) {
      return CacheService.getOrSet(
        cacheKey,
        async () => {
          const where = queryBuilder();
          
          const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
              where,
              include: {
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                    logo: true,
                    rating: true,
                  },
                },
                _count: {
                  select: {
                    applications: true,
                  },
                },
              },
              orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
              ],
              skip,
              take: limit,
            }),
            options.includeCount !== false 
              ? this.prisma.job.count({ where })
              : Promise.resolve(0),
          ]);

          const pages = Math.ceil(total / limit);

          return {
            data: jobs,
            pagination: {
              page,
              limit,
              total,
              pages,
              hasNext: page < pages,
              hasPrev: page > 1,
            },
          };
        },
        { ttl: options.cacheTTL || CacheTTL.SHORT, tags: [CacheTags.JOB] }
      );
    }

    // Non-cached execution
    const where = queryBuilder();
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              location: true,
              logo: true,
              rating: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      options.includeCount !== false 
        ? this.prisma.job.count({ where })
        : Promise.resolve(0),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Optimized application queries with aggregation
   */
  static async getApplicationsWithStats(
    restaurantId: string,
    options: QueryOptions = { cache: true, cacheTTL: CacheTTL.MEDIUM }
  ) {
    const cacheKey = options.cacheKey || CacheKeys.APPLICATION_STATS(restaurantId);

    if (options.cache) {
      return CacheService.getOrSet(
        cacheKey,
        async () => {
          const [applications, stats] = await Promise.all([
            this.prisma.application.findMany({
              where: {
                job: { restaurantId },
              },
              include: {
                worker: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        skills: true,
                        experience: true,
                      },
                    },
                  },
                },
                job: {
                  select: {
                    id: true,
                    title: true,
                    location: true,
                    salary: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }),
            // Aggregated stats
            this.prisma.application.groupBy({
              by: ['status'],
              where: {
                job: { restaurantId },
              },
              _count: true,
            }),
          ]);

          // Process stats
          const statusStats = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          }, {} as Record<string, number>);

          return {
            applications,
            stats: {
              total: applications.length,
              pending: statusStats.PENDING || 0,
              reviewed: statusStats.REVIEWED || 0,
              shortlisted: statusStats.SHORTLISTED || 0,
              rejected: statusStats.REJECTED || 0,
              hired: statusStats.HIRED || 0,
            },
          };
        },
        { ttl: options.cacheTTL || CacheTTL.MEDIUM, tags: [CacheTags.APPLICATION] }
      );
    }

    // Non-cached execution
    const [applications, stats] = await Promise.all([
      this.prisma.application.findMany({
        where: {
          job: { restaurantId },
        },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  skills: true,
                  experience: true,
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              salary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.groupBy({
        by: ['status'],
        where: {
          job: { restaurantId },
        },
        _count: true,
      }),
    ]);

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      applications,
      stats: {
        total: applications.length,
        pending: statusStats.PENDING || 0,
        reviewed: statusStats.REVIEWED || 0,
        shortlisted: statusStats.SHORTLISTED || 0,
        rejected: statusStats.REJECTED || 0,
        hired: statusStats.HIRED || 0,
      },
    };
  }

  /**
   * Batch operations for performance
   */
  static async batchUpdateApplications(
    applicationIds: string[],
    updates: any,
    options: QueryOptions = {}
  ) {
    const result = await this.prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
      },
      data: updates,
    });

    // Invalidate related caches
    if (options.tags) {
      await Promise.all(
        options.tags.map(tag => CacheService.invalidateByTag(tag))
      );
    } else {
      await CacheService.invalidateByTag(CacheTags.APPLICATION);
    }

    return result;
  }

  /**
   * Optimized analytics queries with complex aggregations
   */
  static async getAnalyticsDashboard(
    userId: string,
    period: '7d' | '30d' | '90d' = '30d',
    options: QueryOptions = { cache: true, cacheTTL: CacheTTL.LONG }
  ) {
    const cacheKey = options.cacheKey || CacheKeys.ANALYTICS_DASHBOARD(userId, period);
    
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    if (options.cache) {
      return CacheService.getOrSet(
        cacheKey,
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, restaurantId: true },
          });

          if (!user) return null;

          if (user.role === 'EMPLOYER' && user.restaurantId) {
            // Employer analytics
            const [
              jobStats,
              applicationStats,
              hiringFunnel,
              topJobs,
              recentActivity,
            ] = await Promise.all([
              // Job posting stats
              this.prisma.job.groupBy({
                by: ['status'],
                where: {
                  restaurantId: user.restaurantId,
                  createdAt: { gte: startDate },
                },
                _count: true,
              }),
              // Application stats over time
              this.prisma.application.groupBy({
                by: ['status'],
                where: {
                  job: { restaurantId: user.restaurantId },
                  createdAt: { gte: startDate },
                },
                _count: true,
              }),
              // Hiring funnel metrics
              this.prisma.$queryRaw`
                SELECT 
                  DATE_TRUNC('day', a.created_at) as date,
                  COUNT(*) as applications,
                  COUNT(CASE WHEN a.status = 'REVIEWED' THEN 1 END) as reviewed,
                  COUNT(CASE WHEN a.status = 'SHORTLISTED' THEN 1 END) as shortlisted,
                  COUNT(CASE WHEN a.status = 'HIRED' THEN 1 END) as hired
                FROM applications a 
                JOIN jobs j ON a.job_id = j.id 
                WHERE j.restaurant_id = ${user.restaurantId}
                  AND a.created_at >= ${startDate}
                GROUP BY DATE_TRUNC('day', a.created_at)
                ORDER BY date DESC
                LIMIT 30
              `,
              // Top performing jobs
              this.prisma.job.findMany({
                where: {
                  restaurantId: user.restaurantId,
                  createdAt: { gte: startDate },
                },
                include: {
                  _count: {
                    select: {
                      applications: true,
                    },
                  },
                },
                orderBy: {
                  applications: {
                    _count: 'desc',
                  },
                },
                take: 5,
              }),
              // Recent activity
              this.prisma.application.findMany({
                where: {
                  job: { restaurantId: user.restaurantId },
                  createdAt: { gte: startDate },
                },
                include: {
                  worker: {
                    select: {
                      name: true,
                      profile: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                  job: {
                    select: {
                      title: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
              }),
            ]);

            return {
              type: 'employer',
              period,
              jobStats,
              applicationStats,
              hiringFunnel,
              topJobs,
              recentActivity,
            };
          } else {
            // Worker analytics
            const [applicationHistory, skillsAnalysis, jobMatches] = await Promise.all([
              this.prisma.application.findMany({
                where: {
                  workerId: userId,
                  createdAt: { gte: startDate },
                },
                include: {
                  job: {
                    select: {
                      title: true,
                      location: true,
                      salary: true,
                      restaurant: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              }),
              // Skills analysis based on applied jobs
              this.prisma.$queryRaw`
                SELECT 
                  UNNEST(j.requirements) as skill,
                  COUNT(*) as demand
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.worker_id = ${userId}
                  AND a.created_at >= ${startDate}
                GROUP BY skill
                ORDER BY demand DESC
                LIMIT 10
              `,
              // Recommended job matches
              this.prisma.job.findMany({
                where: {
                  isActive: true,
                  expiresAt: { gt: new Date() },
                  NOT: {
                    applications: {
                      some: {
                        workerId: userId,
                      },
                    },
                  },
                },
                include: {
                  restaurant: {
                    select: {
                      name: true,
                      location: true,
                    },
                  },
                },
                take: 5,
              }),
            ]);

            return {
              type: 'worker',
              period,
              applicationHistory,
              skillsAnalysis,
              jobMatches,
            };
          }
        },
        { ttl: options.cacheTTL || CacheTTL.LONG, tags: [CacheTags.ANALYTICS] }
      );
    }

    // Non-cached execution would go here (similar logic)
    return null;
  }

  /**
   * Database health check and performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    connectionPool: any;
    queryMetrics: QueryMetrics[];
    slowQueries: QueryMetrics[];
    cacheStats: any;
  }> {
    const slowQueries = this.queryMetrics
      .filter(metric => metric.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      connectionPool: {
        // Add connection pool metrics if available
        active: 'unknown',
        idle: 'unknown',
        total: 'unknown',
      },
      queryMetrics: this.queryMetrics.slice(-100), // Last 100 queries
      slowQueries,
      cacheStats: CacheService.getStats(),
    };
  }

  /**
   * Clear query metrics
   */
  static clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Set slow query threshold
   */
  static setSlowQueryThreshold(ms: number): void {
    this.slowQueryThreshold = ms;
  }
}

export default DatabaseOptimizationService;