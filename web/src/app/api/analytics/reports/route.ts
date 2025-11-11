import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const reportQuerySchema = z.object({
  reportType: z.enum(['hiring-summary', 'cost-analysis', 'performance-review', 'worker-analytics', 'custom']),
  format: z.enum(['json', 'csv']).default('json'),
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  restaurantId: z.string().optional(),
  includeCharts: z.boolean().default(false),
  customMetrics: z.array(z.string()).optional(),
});

// GET /api/analytics/reports - Generate custom reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      reportType: searchParams.get('reportType') as any || 'hiring-summary',
      format: searchParams.get('format') as any || 'json',
      start: searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: searchParams.get('end') || new Date().toISOString(),
      restaurantId: searchParams.get('restaurantId') || undefined,
      includeCharts: searchParams.get('includeCharts') === 'true',
      customMetrics: searchParams.get('customMetrics')?.split(',') || undefined,
    };

    const validatedParams = reportQuerySchema.parse(queryParams);

    // Build where clauses
    const applicationWhereClause: any = {
      appliedAt: { gte: validatedParams.start, lte: validatedParams.end },
    };

    const jobWhereClause: any = {
      createdAt: { gte: validatedParams.start, lte: validatedParams.end },
    };

    if (session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER') {
        applicationWhereClause.restaurantId = session.user.id;
        jobWhereClause.restaurantId = session.user.id;
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (validatedParams.restaurantId) {
      applicationWhereClause.restaurantId = validatedParams.restaurantId;
      jobWhereClause.restaurantId = validatedParams.restaurantId;
    }

    let reportData: any = {};

    switch (validatedParams.reportType) {
      case 'hiring-summary':
        reportData = await generateHiringSummaryReport(applicationWhereClause, jobWhereClause, validatedParams);
        break;
      case 'cost-analysis':
        reportData = await generateCostAnalysisReport(applicationWhereClause, jobWhereClause, validatedParams);
        break;
      case 'performance-review':
        reportData = await generatePerformanceReviewReport(applicationWhereClause, jobWhereClause, validatedParams);
        break;
      case 'worker-analytics':
        reportData = await generateWorkerAnalyticsReport(applicationWhereClause, validatedParams);
        break;
      case 'custom':
        reportData = await generateCustomReport(applicationWhereClause, jobWhereClause, validatedParams);
        break;
    }

    // Format response based on requested format
    if (validatedParams.format === 'csv') {
      const csv = convertToCSV(reportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${validatedParams.reportType}-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      reportType: validatedParams.reportType,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: validatedParams.start,
        end: validatedParams.end,
      },
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateHiringSummaryReport(appWhere: any, jobWhere: any, params: any) {
  const [
    totalApplications,
    totalHires,
    totalJobs,
    statusBreakdown,
    monthlyTrends,
    topJobs
  ] = await Promise.all([
    prisma.application.count({ where: appWhere }),
    prisma.application.count({ where: { ...appWhere, status: 'HIRED' } }),
    prisma.job.count({ where: jobWhere }),
    
    prisma.application.groupBy({
      by: ['status'],
      where: appWhere,
      _count: true,
    }),
    
    prisma.$queryRaw<Array<{
      month: string;
      applications: number;
      hires: number;
    }>>`
      SELECT 
        TO_CHAR(applied_at, 'YYYY-MM') as month,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'HIRED' THEN 1 END) as hires
      FROM applications 
      WHERE applied_at >= ${params.start} 
        AND applied_at <= ${params.end}
        ${params.restaurantId ? `AND restaurant_id = ${params.restaurantId}` : ''}
      GROUP BY TO_CHAR(applied_at, 'YYYY-MM')
      ORDER BY month
    `,
    
    prisma.job.findMany({
      where: jobWhere,
      include: {
        applications: { where: { appliedAt: { gte: params.start, lte: params.end } } },
        _count: { select: { applications: true } }
      },
      orderBy: { applications: { _count: 'desc' } },
      take: 10,
    })
  ]);

  const conversionRate = totalApplications > 0 ? (totalHires / totalApplications) * 100 : 0;
  const fillRate = totalJobs > 0 ? (topJobs.filter(job => job.applications.some(app => app.status === 'HIRED')).length / totalJobs) * 100 : 0;

  return {
    summary: {
      totalApplications,
      totalHires,
      totalJobs,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      fillRate: parseFloat(fillRate.toFixed(2)),
    },
    statusBreakdown: statusBreakdown.reduce((acc, status) => {
      acc[status.status] = status._count;
      return acc;
    }, {} as Record<string, number>),
    monthlyTrends: monthlyTrends.map(trend => ({
      month: trend.month,
      applications: Number(trend.applications),
      hires: Number(trend.hires),
      conversionRate: Number(trend.applications) > 0 ? (Number(trend.hires) / Number(trend.applications)) * 100 : 0,
    })),
    topPerformingJobs: topJobs.map(job => ({
      id: job.id,
      title: job.title,
      hourlyRate: job.hourlyRate,
      applicationCount: job._count.applications,
      hiredCount: job.applications.filter(app => app.status === 'HIRED').length,
      conversionRate: job._count.applications > 0 ? (job.applications.filter(app => app.status === 'HIRED').length / job._count.applications) * 100 : 0,
    })),
  };
}

async function generateCostAnalysisReport(appWhere: any, jobWhere: any, params: any) {
  const [
    salaryStats,
    costPerHire,
    jobCosts,
    hiringROI
  ] = await Promise.all([
    prisma.job.aggregate({
      where: jobWhere,
      _avg: { hourlyRate: true },
      _min: { hourlyRate: true },
      _max: { hourlyRate: true },
      _count: true,
    }),
    
    // Cost per hire calculation (simplified)
    (async () => {
      const totalHires = await prisma.application.count({ where: { ...appWhere, status: 'HIRED' } });
      const totalJobs = await prisma.job.count({ where: jobWhere });
      const estimatedCostPerJob = 50; // posting and processing costs
      return totalHires > 0 ? (totalJobs * estimatedCostPerJob) / totalHires : 0;
    })(),
    
    prisma.job.findMany({
      where: jobWhere,
      include: {
        applications: { where: { appliedAt: { gte: params.start, lte: params.end } } },
      },
      take: 20,
    }),
    
    // ROI calculation based on filled positions
    (async () => {
      const filledJobs = await prisma.job.count({
        where: {
          ...jobWhere,
          applications: { some: { status: 'HIRED' } }
        }
      });
      const totalJobPostingCost = await prisma.job.count({ where: jobWhere }) * 50;
      const estimatedRevenuePerHire = 2000; // simplified value
      return filledJobs > 0 ? (filledJobs * estimatedRevenuePerHire - totalJobPostingCost) / totalJobPostingCost : 0;
    })(),
  ]);

  return {
    salaryAnalysis: {
      averageHourlyRate: salaryStats._avg.hourlyRate || 0,
      minHourlyRate: salaryStats._min.hourlyRate || 0,
      maxHourlyRate: salaryStats._max.hourlyRate || 0,
      totalJobs: salaryStats._count,
    },
    hiringCosts: {
      costPerHire: parseFloat(costPerHire.toFixed(2)),
      estimatedTotalCost: parseFloat((costPerHire * await prisma.application.count({ where: { ...appWhere, status: 'HIRED' } })).toFixed(2)),
      roi: parseFloat((hiringROI * 100).toFixed(2)),
    },
    jobCostBreakdown: jobCosts.map(job => ({
      id: job.id,
      title: job.title,
      hourlyRate: job.hourlyRate,
      applicationCount: job.applications.length,
      estimatedPostingCost: 50,
      hiredCount: job.applications.filter(app => app.status === 'HIRED').length,
      costPerHire: job.applications.filter(app => app.status === 'HIRED').length > 0 ? 50 / job.applications.filter(app => app.status === 'HIRED').length : 0,
    })),
  };
}

async function generatePerformanceReviewReport(appWhere: any, jobWhere: any, params: any) {
  const [
    responseMetrics,
    qualityMetrics,
    efficiencyMetrics,
    trendsData
  ] = await Promise.all([
    // Response time metrics
    (async () => {
      const apps = await prisma.application.findMany({
        where: { ...appWhere, respondedAt: { not: null } },
        select: { appliedAt: true, respondedAt: true, status: true }
      });
      
      const responseTimes = apps.map(app => 
        (app.respondedAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60)
      );
      
      return {
        averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
        medianResponseTime: responseTimes.length > 0 ? responseTimes.sort()[Math.floor(responseTimes.length / 2)] : 0,
        responseRate: (apps.length / await prisma.application.count({ where: appWhere })) * 100,
      };
    })(),
    
    // Quality metrics
    (async () => {
      const totalApps = await prisma.application.count({ where: appWhere });
      const hiredApps = await prisma.application.count({ where: { ...appWhere, status: 'HIRED' } });
      const interviewedApps = await prisma.application.count({ where: { ...appWhere, status: 'INTERVIEWED' } });
      
      return {
        hireRate: totalApps > 0 ? (hiredApps / totalApps) * 100 : 0,
        interviewRate: totalApps > 0 ? (interviewedApps / totalApps) * 100 : 0,
        qualityScore: totalApps > 0 ? ((hiredApps * 2 + interviewedApps) / totalApps) * 50 : 0,
      };
    })(),
    
    // Efficiency metrics
    (async () => {
      const totalJobs = await prisma.job.count({ where: jobWhere });
      const filledJobs = await prisma.job.count({
        where: { ...jobWhere, applications: { some: { status: 'HIRED' } } }
      });
      
      return {
        fillRate: totalJobs > 0 ? (filledJobs / totalJobs) * 100 : 0,
        averageTimeToFill: 15, // simplified calculation
        jobEfficiencyScore: totalJobs > 0 ? (filledJobs / totalJobs) * 100 : 0,
      };
    })(),
    
    // Weekly trends
    prisma.$queryRaw<Array<{
      week: string;
      applications: number;
      hires: number;
      response_rate: number;
    }>>`
      SELECT 
        TO_CHAR(date_trunc('week', applied_at), 'YYYY-MM-DD') as week,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'HIRED' THEN 1 END) as hires,
        AVG(CASE WHEN responded_at IS NOT NULL THEN 100.0 ELSE 0.0 END) as response_rate
      FROM applications 
      WHERE applied_at >= ${params.start} 
        AND applied_at <= ${params.end}
        ${params.restaurantId ? `AND restaurant_id = ${params.restaurantId}` : ''}
      GROUP BY date_trunc('week', applied_at)
      ORDER BY week
    `,
  ]);

  return {
    responseMetrics: {
      averageResponseTime: parseFloat(responseMetrics.averageResponseTime.toFixed(2)),
      medianResponseTime: parseFloat(responseMetrics.medianResponseTime.toFixed(2)),
      responseRate: parseFloat(responseMetrics.responseRate.toFixed(2)),
    },
    qualityMetrics: {
      hireRate: parseFloat(qualityMetrics.hireRate.toFixed(2)),
      interviewRate: parseFloat(qualityMetrics.interviewRate.toFixed(2)),
      qualityScore: parseFloat(qualityMetrics.qualityScore.toFixed(2)),
    },
    efficiencyMetrics: {
      fillRate: parseFloat(efficiencyMetrics.fillRate.toFixed(2)),
      averageTimeToFill: efficiencyMetrics.averageTimeToFill,
      jobEfficiencyScore: parseFloat(efficiencyMetrics.jobEfficiencyScore.toFixed(2)),
    },
    weeklyTrends: trendsData.map(week => ({
      week: week.week,
      applications: Number(week.applications),
      hires: Number(week.hires),
      responseRate: parseFloat(Number(week.response_rate).toFixed(2)),
    })),
  };
}

async function generateWorkerAnalyticsReport(appWhere: any, params: any) {
  const [
    workerMetrics,
    topWorkers,
    skillsAnalysis
  ] = await Promise.all([
    prisma.workerProfile.count({
      where: {
        applications: { some: { appliedAt: { gte: params.start, lte: params.end } } }
      }
    }),
    
    prisma.workerProfile.findMany({
      where: {
        applications: { some: { appliedAt: { gte: params.start, lte: params.end } } }
      },
      include: {
        user: { select: { name: true } },
        applications: {
          where: { appliedAt: { gte: params.start, lte: params.end } }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { applications: { _count: 'desc' } },
      take: 10,
    }),
    
    // Skills analysis (simplified)
    prisma.workerProfile.findMany({
      where: {
        applications: { some: { appliedAt: { gte: params.start, lte: params.end } } }
      },
      select: { skills: true, applications: { select: { status: true } } }
    }).then(workers => {
      const skillStats: Record<string, { count: number; hireRate: number }> = {};
      
      workers.forEach(worker => {
        const hiredCount = worker.applications.filter(app => app.status === 'HIRED').length;
        const totalApps = worker.applications.length;
        
        worker.skills.forEach(skill => {
          if (!skillStats[skill]) {
            skillStats[skill] = { count: 0, hireRate: 0 };
          }
          skillStats[skill].count++;
          skillStats[skill].hireRate += totalApps > 0 ? (hiredCount / totalApps) * 100 : 0;
        });
      });
      
      return Object.entries(skillStats).map(([skill, stats]) => ({
        skill,
        workerCount: stats.count,
        averageHireRate: stats.count > 0 ? stats.hireRate / stats.count : 0,
      })).sort((a, b) => b.workerCount - a.workerCount);
    }),
  ]);

  return {
    overview: {
      activeWorkers: workerMetrics,
      averageApplicationsPerWorker: topWorkers.length > 0 ? 
        topWorkers.reduce((sum, worker) => sum + worker._count.applications, 0) / topWorkers.length : 0,
    },
    topWorkers: topWorkers.map(worker => ({
      id: worker.id,
      name: worker.user.name,
      applicationCount: worker._count.applications,
      hiredCount: worker.applications.filter(app => app.status === 'HIRED').length,
      successRate: worker._count.applications > 0 ? 
        (worker.applications.filter(app => app.status === 'HIRED').length / worker._count.applications) * 100 : 0,
      skills: worker.skills.slice(0, 5), // Top 5 skills
    })),
    skillsAnalysis: skillsAnalysis.slice(0, 15), // Top 15 skills
  };
}

async function generateCustomReport(appWhere: any, jobWhere: any, params: any) {
  // Custom report based on specified metrics
  const metrics = params.customMetrics || ['applications', 'hires', 'jobs'];
  const reportData: any = {};

  if (metrics.includes('applications')) {
    reportData.applications = await prisma.application.count({ where: appWhere });
  }

  if (metrics.includes('hires')) {
    reportData.hires = await prisma.application.count({ where: { ...appWhere, status: 'HIRED' } });
  }

  if (metrics.includes('jobs')) {
    reportData.jobs = await prisma.job.count({ where: jobWhere });
  }

  if (metrics.includes('response_time')) {
    const apps = await prisma.application.findMany({
      where: { ...appWhere, respondedAt: { not: null } },
      select: { appliedAt: true, respondedAt: true }
    });
    
    reportData.averageResponseTime = apps.length > 0 ? 
      apps.reduce((sum, app) => sum + (app.respondedAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60), 0) / apps.length : 0;
  }

  return reportData;
}

function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') return '';

  const flattenObject = (obj: any, prefix = ''): any => {
    let result: any = {};
    
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], prefix + key + '.'));
      } else if (Array.isArray(obj[key])) {
        result[prefix + key] = JSON.stringify(obj[key]);
      } else {
        result[prefix + key] = obj[key];
      }
    }
    
    return result;
  };

  const flatData = flattenObject(data);
  const headers = Object.keys(flatData);
  const values = Object.values(flatData);

  return [
    headers.join(','),
    values.map(value => typeof value === 'string' ? `"${value}"` : value).join(',')
  ].join('\n');
}