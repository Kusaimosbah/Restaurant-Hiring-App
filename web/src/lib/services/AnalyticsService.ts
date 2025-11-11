import { prisma } from '@/lib/prisma';

export interface AnalyticsMetrics {
  // Overview metrics
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalWorkers: number;
  
  // Application metrics
  applicationsByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
    interviewed: number;
  };
  
  // Time-based metrics
  applicationsThisMonth: number;
  applicationsLastMonth: number;
  applicationGrowthRate: number;
  
  // Performance metrics
  averageTimeToHire: number; // in days
  acceptanceRate: number; // percentage
  responseRate: number; // percentage
  
  // Top performing data
  topPerformingJobs: Array<{
    jobId: string;
    title: string;
    applicationCount: number;
    acceptanceRate: number;
  }>;
  
  // Timeline data
  applicationTrends: Array<{
    date: string;
    applications: number;
    acceptances: number;
  }>;
  
  // Source analysis
  applicationSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  
  // Geographic insights
  applicationsByLocation: Array<{
    location: string;
    count: number;
  }>;
}

export interface DetailedJobAnalytics {
  jobId: string;
  title: string;
  status: string;
  createdAt: Date;
  
  // Application metrics
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  
  // Performance metrics
  viewCount: number;
  conversionRate: number; // applications / views
  qualityScore: number; // based on applicant qualifications
  
  // Timeline data
  applicationTimeline: Array<{
    date: string;
    count: number;
  }>;
  
  // Applicant insights
  applicantInsights: {
    averageExperience: number;
    topSkills: Array<{
      skill: string;
      count: number;
    }>;
    experienceLevels: Array<{
      level: string;
      count: number;
    }>;
  };
}

export interface WorkerAnalytics {
  // Worker engagement
  totalActiveWorkers: number;
  newWorkersThisMonth: number;
  workerRetentionRate: number;
  
  // Application behavior
  averageApplicationsPerWorker: number;
  mostActiveWorkers: Array<{
    workerId: string;
    name: string;
    applicationCount: number;
    successRate: number;
  }>;
  
  // Skills analysis
  topSkills: Array<{
    skill: string;
    count: number;
    demand: number; // how many jobs require this skill
  }>;
  
  // Performance metrics
  workerPerformanceDistribution: Array<{
    performanceRange: string;
    count: number;
  }>;
}

/**
 * Advanced Analytics Service
 * Provides comprehensive hiring analytics and insights
 */
export class AnalyticsService {
  /**
   * Get comprehensive analytics metrics for a restaurant owner
   */
  static async getComprehensiveMetrics(
    restaurantOwnerId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<AnalyticsMetrics> {
    try {
      // Get restaurant
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: restaurantOwnerId }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Parallel queries for better performance
      const [
        totalJobs,
        activeJobs,
        totalApplications,
        totalWorkers,
        applicationsByStatus,
        applicationsThisMonth,
        applicationsLastMonth,
        topPerformingJobs,
        applicationTrends,
        hiringMetrics
      ] = await Promise.all([
        // Total jobs
        prisma.job.count({
          where: { restaurantId: restaurant.id }
        }),
        
        // Active jobs
        prisma.job.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACTIVE'
          }
        }),
        
        // Total applications
        prisma.application.count({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          }
        }),
        
        // Total unique workers who applied
        prisma.application.findMany({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          },
          select: { workerId: true },
          distinct: ['workerId']
        }).then(apps => apps.length),
        
        // Applications by status
        prisma.application.groupBy({
          by: ['status'],
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          },
          _count: true
        }),
        
        // Applications this month
        prisma.application.count({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Applications last month
        prisma.application.count({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Top performing jobs
        prisma.job.findMany({
          where: { restaurantId: restaurant.id },
          include: {
            applications: {
              where: {
                appliedAt: {
                  gte: dateRange.from,
                  lte: dateRange.to
                }
              }
            }
          },
          take: 10
        }),
        
        // Application trends (daily data for the period)
        this.getApplicationTrends(restaurant.id, dateRange),
        
        // Hiring performance metrics
        this.getHiringMetrics(restaurant.id, dateRange)
      ]);

      // Process status counts
      const statusCounts = {
        pending: 0,
        accepted: 0,
        rejected: 0,
        interviewed: 0
      };

      applicationsByStatus.forEach(item => {
        switch (item.status) {
          case 'PENDING':
            statusCounts.pending = item._count;
            break;
          case 'ACCEPTED':
            statusCounts.accepted = item._count;
            break;
          case 'REJECTED':
            statusCounts.rejected = item._count;
            break;
          case 'INTERVIEW_SCHEDULED':
            statusCounts.interviewed = item._count;
            break;
        }
      });

      // Calculate growth rate
      const applicationGrowthRate = applicationsLastMonth > 0 
        ? ((applicationsThisMonth - applicationsLastMonth) / applicationsLastMonth) * 100
        : applicationsThisMonth > 0 ? 100 : 0;

      // Process top performing jobs
      const topJobsWithMetrics = topPerformingJobs
        .map(job => ({
          jobId: job.id,
          title: job.title,
          applicationCount: job.applications.length,
          acceptanceRate: job.applications.length > 0 
            ? (job.applications.filter(app => app.status === 'ACCEPTED').length / job.applications.length) * 100
            : 0
        }))
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5);

      return {
        totalJobs,
        activeJobs,
        totalApplications,
        totalWorkers,
        applicationsByStatus: statusCounts,
        applicationsThisMonth,
        applicationsLastMonth,
        applicationGrowthRate,
        averageTimeToHire: hiringMetrics.averageTimeToHire,
        acceptanceRate: hiringMetrics.acceptanceRate,
        responseRate: hiringMetrics.responseRate,
        topPerformingJobs: topJobsWithMetrics,
        applicationTrends,
        applicationSources: [], // Would be implemented with source tracking
        applicationsByLocation: [] // Would be implemented with location data
      };

    } catch (error) {
      console.error('Error getting comprehensive metrics:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific job
   */
  static async getJobAnalytics(
    jobId: string,
    restaurantOwnerId: string
  ): Promise<DetailedJobAnalytics> {
    try {
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          restaurant: { ownerId: restaurantOwnerId }
        },
        include: {
          applications: {
            include: {
              worker: {
                include: {
                  workerSkills: true
                }
              }
            }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found or access denied');
      }

      // Calculate metrics
      const totalApplications = job.applications.length;
      const pendingApplications = job.applications.filter(app => app.status === 'PENDING').length;
      const acceptedApplications = job.applications.filter(app => app.status === 'ACCEPTED').length;
      const rejectedApplications = job.applications.filter(app => app.status === 'REJECTED').length;

      // Calculate timeline data
      const applicationTimeline = this.calculateApplicationTimeline(job.applications);

      // Calculate applicant insights
      const applicantInsights = this.calculateApplicantInsights(job.applications);

      return {
        jobId: job.id,
        title: job.title,
        status: job.status,
        createdAt: job.createdAt,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        viewCount: 0, // Would be tracked separately
        conversionRate: 0, // Would be calculated with view data
        qualityScore: 0, // Would be calculated based on matching algorithm
        applicationTimeline,
        applicantInsights
      };

    } catch (error) {
      console.error('Error getting job analytics:', error);
      throw error;
    }
  }

  /**
   * Get worker analytics and insights
   */
  static async getWorkerAnalytics(
    restaurantOwnerId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<WorkerAnalytics> {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: restaurantOwnerId }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Get worker-related metrics
      const [
        totalActiveWorkers,
        newWorkers,
        applicationData,
        skillsData
      ] = await Promise.all([
        // Total active workers (workers who applied in date range)
        prisma.application.findMany({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          },
          select: { workerId: true },
          distinct: ['workerId']
        }).then(apps => apps.length),

        // New workers this month
        prisma.workerProfile.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Application behavior data
        prisma.application.findMany({
          where: {
            job: { restaurantId: restaurant.id },
            appliedAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          },
          include: {
            worker: {
              include: {
                user: true
              }
            }
          }
        }),

        // Skills data
        prisma.workerSkill.findMany({
          include: {
            workerProfile: {
              include: {
                applications: {
                  where: {
                    job: { restaurantId: restaurant.id }
                  }
                }
              }
            }
          }
        })
      ]);

      // Process worker application patterns
      const workerApplicationCounts = new Map<string, { count: number; accepted: number; worker: any }>();
      
      applicationData.forEach(app => {
        const workerId = app.workerId;
        if (!workerApplicationCounts.has(workerId)) {
          workerApplicationCounts.set(workerId, {
            count: 0,
            accepted: 0,
            worker: app.worker
          });
        }
        const data = workerApplicationCounts.get(workerId)!;
        data.count++;
        if (app.status === 'ACCEPTED') {
          data.accepted++;
        }
      });

      const mostActiveWorkers = Array.from(workerApplicationCounts.entries())
        .map(([workerId, data]) => ({
          workerId,
          name: data.worker.user.name,
          applicationCount: data.count,
          successRate: data.count > 0 ? (data.accepted / data.count) * 100 : 0
        }))
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 10);

      // Process skills data
      const skillCounts = new Map<string, number>();
      skillsData.forEach(skill => {
        if (skill.workerProfile.applications.length > 0) {
          skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
        }
      });

      const topSkills = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count, demand: 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const averageApplicationsPerWorker = totalActiveWorkers > 0 
        ? applicationData.length / totalActiveWorkers 
        : 0;

      return {
        totalActiveWorkers,
        newWorkersThisMonth: newWorkers,
        workerRetentionRate: 85, // Would be calculated based on historical data
        averageApplicationsPerWorker,
        mostActiveWorkers,
        topSkills,
        workerPerformanceDistribution: [] // Would be implemented with performance tracking
      };

    } catch (error) {
      console.error('Error getting worker analytics:', error);
      throw error;
    }
  }

  /**
   * Get application trends over time
   */
  private static async getApplicationTrends(
    restaurantId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<Array<{ date: string; applications: number; acceptances: number }>> {
    try {
      const applications = await prisma.application.findMany({
        where: {
          job: { restaurantId },
          appliedAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        select: {
          appliedAt: true,
          status: true
        }
      });

      // Group by date
      const trendMap = new Map<string, { applications: number; acceptances: number }>();
      
      applications.forEach(app => {
        const dateKey = app.appliedAt.toISOString().split('T')[0];
        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, { applications: 0, acceptances: 0 });
        }
        const data = trendMap.get(dateKey)!;
        data.applications++;
        if (app.status === 'ACCEPTED') {
          data.acceptances++;
        }
      });

      return Array.from(trendMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('Error getting application trends:', error);
      return [];
    }
  }

  /**
   * Get hiring performance metrics
   */
  private static async getHiringMetrics(
    restaurantId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<{
    averageTimeToHire: number;
    acceptanceRate: number;
    responseRate: number;
  }> {
    try {
      const applications = await prisma.application.findMany({
        where: {
          job: { restaurantId },
          appliedAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        }
      });

      const totalApplications = applications.length;
      const respondedApplications = applications.filter(app => app.respondedAt);
      const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');

      // Calculate average time to hire (for accepted applications)
      let totalTimeToHire = 0;
      let acceptedWithResponseCount = 0;

      acceptedApplications.forEach(app => {
        if (app.respondedAt) {
          const timeToHire = app.respondedAt.getTime() - app.appliedAt.getTime();
          totalTimeToHire += timeToHire;
          acceptedWithResponseCount++;
        }
      });

      const averageTimeToHire = acceptedWithResponseCount > 0 
        ? Math.round(totalTimeToHire / acceptedWithResponseCount / (1000 * 60 * 60 * 24))
        : 0;

      const acceptanceRate = totalApplications > 0 
        ? (acceptedApplications.length / totalApplications) * 100
        : 0;

      const responseRate = totalApplications > 0 
        ? (respondedApplications.length / totalApplications) * 100
        : 0;

      return {
        averageTimeToHire,
        acceptanceRate,
        responseRate
      };

    } catch (error) {
      console.error('Error getting hiring metrics:', error);
      return {
        averageTimeToHire: 0,
        acceptanceRate: 0,
        responseRate: 0
      };
    }
  }

  /**
   * Calculate application timeline for a job
   */
  private static calculateApplicationTimeline(applications: any[]): Array<{ date: string; count: number }> {
    const timelineMap = new Map<string, number>();
    
    applications.forEach(app => {
      const dateKey = app.appliedAt.toISOString().split('T')[0];
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
    });

    return Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate applicant insights for a job
   */
  private static calculateApplicantInsights(applications: any[]): {
    averageExperience: number;
    topSkills: Array<{ skill: string; count: number }>;
    experienceLevels: Array<{ level: string; count: number }>;
  } {
    let totalExperience = 0;
    let experienceCount = 0;
    const skillCounts = new Map<string, number>();
    const experienceLevels = new Map<string, number>();

    applications.forEach(app => {
      // Calculate average experience
      if (app.worker.yearsOfExperience) {
        totalExperience += app.worker.yearsOfExperience;
        experienceCount++;
      }

      // Count experience levels (would be categorized)
      const experience = app.worker.yearsOfExperience || 0;
      let level = 'Entry Level';
      if (experience >= 5) level = 'Senior';
      else if (experience >= 2) level = 'Mid Level';
      
      experienceLevels.set(level, (experienceLevels.get(level) || 0) + 1);

      // Count skills
      app.worker.workerSkills?.forEach((skill: any) => {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      });
    });

    const averageExperience = experienceCount > 0 ? totalExperience / experienceCount : 0;
    
    const topSkills = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const experienceLevelArray = Array.from(experienceLevels.entries())
      .map(([level, count]) => ({ level, count }));

    return {
      averageExperience,
      topSkills,
      experienceLevels: experienceLevelArray
    };
  }
}