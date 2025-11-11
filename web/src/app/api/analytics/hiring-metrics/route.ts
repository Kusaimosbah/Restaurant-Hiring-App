import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const metricsQuerySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  restaurantId: z.string().optional(),
});

// GET /api/analytics/hiring-metrics - Get comprehensive hiring metrics
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

    const validatedParams = metricsQuerySchema.parse(queryParams);

    // Build where clause for filtering applications
    const whereClause: any = {
      appliedAt: {
        gte: validatedParams.start,
        lte: validatedParams.end,
      },
    };

    // If user is not admin, filter by their restaurant
    if (session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER') {
        whereClause.restaurantId = session.user.id;
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (validatedParams.restaurantId) {
      whereClause.restaurantId = validatedParams.restaurantId;
    }

    // Get total applications and hires
    const [totalApplications, totalHires] = await Promise.all([
      prisma.application.count({ where: whereClause }),
      prisma.application.count({
        where: {
          ...whereClause,
          status: 'HIRED',
        },
      }),
    ]);

    // Get applications by status
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    const applicationsByStatus = {
      PENDING: 0,
      INTERVIEWED: 0,
      HIRED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach(({ status, _count }) => {
      if (status in applicationsByStatus) {
        applicationsByStatus[status as keyof typeof applicationsByStatus] = _count;
      }
    });

    // Get applications by month using raw query for better database compatibility
    const monthlyApplications = await prisma.$queryRaw<Array<{
      month: string;
      count: bigint;
      hires: bigint;
    }>>`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hires
      FROM Application 
      WHERE createdAt >= ${validatedParams.start} AND createdAt <= ${validatedParams.end}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    `;

    const applicationsByMonth = monthlyApplications.map(row => ({
      month: row.month,
      count: Number(row.count),
      hires: Number(row.hires),
    }));

    // Get top performing jobs
    const topJobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: validatedParams.start,
          lte: validatedParams.end,
        },
        ...(validatedParams.restaurantId && { restaurantId: validatedParams.restaurantId }),
      },
      include: {
        applications: {
          where: {
            appliedAt: {
              gte: validatedParams.start,
              lte: validatedParams.end,
            },
          },
        },
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
      take: 10,
    });

    // Calculate hiring funnel metrics
    const screenings = await prisma.application.count({
      where: {
        ...whereClause,
        status: { in: ['screening', 'interviewed', 'hired'] },
      },
    });

    const interviews = await prisma.application.count({
      where: {
        ...whereClause,
        status: { in: ['interviewed', 'hired'] },
      },
    });

    const offers = await prisma.application.count({
      where: {
        ...whereClause,
        status: { in: ['offered', 'hired'] },
      },
    });

    const hiringFunnelMetrics = {
      applications: totalApplications,
      screenings,
      interviews,
      offers,
      hires: totalHires,
    };

    // Calculate average time to hire using appliedAt and respondedAt
    const hiredApplications = await prisma.application.findMany({
      where: {
        ...whereClause,
        status: 'HIRED',
        respondedAt: { not: null },
      },
      select: {
        appliedAt: true,
        respondedAt: true,
      },
    });

    const averageTimeToHire = hiredApplications.length > 0
      ? hiredApplications.reduce((sum, app) => {
          const days = Math.ceil(
            (app.respondedAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / hiredApplications.length
      : 0;

    const conversionRate = totalApplications > 0 
      ? (totalHires / totalApplications) * 100 
      : 0;

    const metrics = {
      overview: {
        totalApplications,
        totalHires,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageTimeToHire,
      },
      applicationsByStatus,
      monthlyTrends: applicationsByMonth,
      topJobs: topJobs.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: job.applications.length,
        hiredCount: job.applications.filter(app => app.status === 'HIRED').length,
        conversionRate: job.applications.length > 0 
          ? Math.round((job.applications.filter(app => app.status === 'HIRED').length / job.applications.length) * 100 * 100) / 100 
          : 0,
        hourlyRate: job.hourlyRate,
      })),
      hiringFunnel: [
        { stage: 'Applications', count: totalApplications },
        { stage: 'Under Review', count: applicationsByStatus.PENDING },
        { stage: 'Interviewed', count: applicationsByStatus.INTERVIEWED },
        { stage: 'Hired', count: applicationsByStatus.HIRED },
      ],
      dateRange: {
        start: validatedParams.start,
        end: validatedParams.end,
      },
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching hiring metrics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch hiring metrics' },
      { status: 500 }
    );
  }
}