import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const performanceQuerySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  restaurantId: z.string().optional(),
});

// GET /api/analytics/performance-metrics - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      start: searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: searchParams.get('end') || new Date().toISOString(),
      restaurantId: searchParams.get('restaurantId') || undefined,
    };

    const validatedParams = performanceQuerySchema.parse(queryParams);

    // Build where clauses for different entities
    const jobWhereClause: any = {
      createdAt: { gte: validatedParams.start, lte: validatedParams.end },
    };

    const applicationWhereClause: any = {
      appliedAt: { gte: validatedParams.start, lte: validatedParams.end },
    };

    // Filter by restaurant if not admin
    if (session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER') {
        jobWhereClause.restaurantId = session.user.id;
        applicationWhereClause.restaurantId = session.user.id;
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (validatedParams.restaurantId) {
      jobWhereClause.restaurantId = validatedParams.restaurantId;
      applicationWhereClause.restaurantId = validatedParams.restaurantId;
    }

    // Calculate performance metrics
    const [
      totalJobs,
      totalApplications,
      totalHires,
      averageApplicationsPerJob,
      averageTimeToFill
    ] = await Promise.all([
      // Total jobs posted
      prisma.job.count({ where: jobWhereClause }),
      
      // Total applications received
      prisma.application.count({ where: applicationWhereClause }),
      
      // Total hires made
      prisma.application.count({
        where: { ...applicationWhereClause, status: 'HIRED' }
      }),
      
      // Average applications per job
      prisma.job.findMany({
        where: jobWhereClause,
        include: {
          _count: {
            select: { applications: true }
          }
        }
      }).then(jobs => {
        if (jobs.length === 0) return 0;
        const totalApps = jobs.reduce((sum, job) => sum + job._count.applications, 0);
        return Math.round((totalApps / jobs.length) * 100) / 100;
      }),
      
      // Average time to fill positions (in days)
      prisma.application.findMany({
        where: {
          ...applicationWhereClause,
          status: 'HIRED',
          respondedAt: { not: null }
        },
        select: {
          appliedAt: true,
          respondedAt: true,
        }
      }).then(hiredApps => {
        if (hiredApps.length === 0) return 0;
        const totalDays = hiredApps.reduce((sum, app) => {
          const days = (app.respondedAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        return Math.round((totalDays / hiredApps.length) * 100) / 100;
      })
    ]);

    // Get job posting performance
    const jobPerformance = await prisma.job.findMany({
      where: jobWhereClause,
      include: {
        applications: {
          where: {
            appliedAt: { gte: validatedParams.start, lte: validatedParams.end }
          }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: {
        applications: { _count: 'desc' }
      },
      take: 10
    });

    // Calculate quality metrics
    const qualityMetrics = await Promise.all([
      // Interview to hire ratio
      prisma.application.count({
        where: { ...applicationWhereClause, status: 'INTERVIEWED' }
      }).then(interviews => {
        return totalHires > 0 ? Math.round((interviews / totalHires) * 100) / 100 : 0;
      }),
      
      // Response rate (applications that got a response)
      prisma.application.count({
        where: { ...applicationWhereClause, respondedAt: { not: null } }
      }).then(responses => {
        return totalApplications > 0 ? Math.round((responses / totalApplications) * 100 * 100) / 100 : 0;
      }),
      
      // Fill rate (jobs that got filled)
      prisma.job.count({
        where: {
          ...jobWhereClause,
          applications: {
            some: { status: 'HIRED' }
          }
        }
      }).then(filledJobs => {
        return totalJobs > 0 ? Math.round((filledJobs / totalJobs) * 100 * 100) / 100 : 0;
      })
    ]);

    // Get engagement metrics (user activity)
    const engagementMetrics = {
      activeRestaurants: await prisma.restaurant.count({
        where: {
          jobs: {
            some: {
              createdAt: { gte: validatedParams.start, lte: validatedParams.end }
            }
          }
        }
      }),
      activeWorkers: await prisma.workerProfile.count({
        where: {
          applications: {
            some: {
              appliedAt: { gte: validatedParams.start, lte: validatedParams.end }
            }
          }
        }
      })
    };

    // Get trends data (weekly breakdown)
    const weeklyTrends = await prisma.$queryRaw<Array<{
      week: string;
      jobs: number;
      applications: number;
      hires: number;
    }>>`
      SELECT 
        TO_CHAR(date_trunc('week', applied_at), 'YYYY-MM-DD') as week,
        COUNT(DISTINCT job_id) as jobs,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'HIRED' THEN 1 END) as hires
      FROM applications 
      WHERE applied_at >= ${validatedParams.start} 
        AND applied_at <= ${validatedParams.end}
        ${validatedParams.restaurantId ? `AND restaurant_id = ${validatedParams.restaurantId}` : ''}
      GROUP BY date_trunc('week', applied_at)
      ORDER BY week
    `;

    const performanceMetrics = {
      overview: {
        totalJobs,
        totalApplications,
        totalHires,
        averageApplicationsPerJob,
        averageTimeToFill,
      },
      quality: {
        interviewToHireRatio: qualityMetrics[0],
        responseRate: qualityMetrics[1],
        fillRate: qualityMetrics[2],
      },
      engagement: engagementMetrics,
      topJobs: jobPerformance.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: job._count.applications,
        hiredCount: job.applications.filter(app => app.status === 'HIRED').length,
        hourlyRate: job.hourlyRate,
        createdAt: job.createdAt,
      })),
      weeklyTrends: weeklyTrends.map(week => ({
        week: week.week,
        jobs: Number(week.jobs),
        applications: Number(week.applications),
        hires: Number(week.hires),
      })),
      dateRange: {
        start: validatedParams.start,
        end: validatedParams.end,
      },
    };

    return NextResponse.json(performanceMetrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}