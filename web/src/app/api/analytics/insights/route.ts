import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const insightsQuerySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  restaurantId: z.string().optional(),
  categories: z.array(z.enum(['performance', 'quality', 'efficiency', 'cost', 'trends'])).optional(),
});

// GET /api/analytics/insights - Get automated insights and recommendations
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
      categories: searchParams.get('categories')?.split(',') as any || undefined,
    };

    const validatedParams = insightsQuerySchema.parse(queryParams);

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

    // Gather comprehensive analytics data
    const [
      totalApplications,
      totalHires,
      totalJobs,
      avgResponseTime,
      statusDistribution,
      jobPerformanceData,
      salaryAnalysis
    ] = await Promise.all([
      prisma.application.count({ where: applicationWhereClause }),
      prisma.application.count({ where: { ...applicationWhereClause, status: 'HIRED' } }),
      prisma.job.count({ where: jobWhereClause }),
      
      // Average response time calculation
      (async () => {
        const apps = await prisma.application.findMany({
          where: { ...applicationWhereClause, respondedAt: { not: null } },
          select: { appliedAt: true, respondedAt: true }
        });
        
        if (apps.length === 0) return 0;
        
        const totalHours = apps.reduce((sum, app) => {
          return sum + (app.respondedAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60);
        }, 0);
        
        return totalHours / apps.length;
      })(),
      
      // Status distribution
      prisma.application.groupBy({
        by: ['status'],
        where: applicationWhereClause,
        _count: true,
      }),
      
      // Job performance data
      prisma.job.findMany({
        where: jobWhereClause,
        include: {
          applications: {
            where: { appliedAt: { gte: validatedParams.start, lte: validatedParams.end } }
          },
          _count: { select: { applications: true } }
        }
      }),
      
      // Salary analysis
      prisma.job.aggregate({
        where: jobWhereClause,
        _avg: { hourlyRate: true },
        _min: { hourlyRate: true },
        _max: { hourlyRate: true },
      }),
    ]);

    // Calculate key metrics
    const conversionRate = totalApplications > 0 ? (totalHires / totalApplications) * 100 : 0;
    const fillRate = totalJobs > 0 ? (jobPerformanceData.filter(job => 
      job.applications.some(app => app.status === 'HIRED')).length / totalJobs) * 100 : 0;
    
    const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0;

    // Industry benchmarks (simplified)
    const benchmarks = {
      conversionRate: 12.5, // industry average
      responseTime: 48, // hours
      fillRate: 75,
      avgApplicationsPerJob: 15,
    };

    // Generate insights
    const insights = [];

    // Performance Insights
    if (!validatedParams.categories || validatedParams.categories.includes('performance')) {
      if (conversionRate > benchmarks.conversionRate * 1.2) {
        insights.push({
          id: 'high-conversion',
          type: 'success',
          category: 'performance',
          title: 'Excellent Conversion Rate',
          description: `Your ${conversionRate.toFixed(1)}% conversion rate is ${((conversionRate / benchmarks.conversionRate - 1) * 100).toFixed(0)}% above industry average.`,
          impact: 'high',
          recommendation: 'Consider being more selective in your hiring criteria or increasing compensation to attract even higher quality candidates.',
          action: 'Raise job requirements or hourly rates',
          confidence: 95,
          metrics: { current: conversionRate.toFixed(1), benchmark: benchmarks.conversionRate, unit: '%' }
        });
      } else if (conversionRate < benchmarks.conversionRate * 0.8) {
        insights.push({
          id: 'low-conversion',
          type: 'warning',
          category: 'performance',
          title: 'Below Average Conversion Rate',
          description: `Your ${conversionRate.toFixed(1)}% conversion rate is ${((1 - conversionRate / benchmarks.conversionRate) * 100).toFixed(0)}% below industry average.`,
          impact: 'high',
          recommendation: 'Review your job descriptions, streamline the application process, or adjust hiring criteria.',
          action: 'Optimize job postings and hiring process',
          confidence: 88,
          metrics: { current: conversionRate.toFixed(1), benchmark: benchmarks.conversionRate, unit: '%' }
        });
      }

      if (fillRate > benchmarks.fillRate * 1.1) {
        insights.push({
          id: 'high-fill-rate',
          type: 'success',
          category: 'performance',
          title: 'Strong Job Fill Rate',
          description: `${fillRate.toFixed(1)}% of your jobs are being filled successfully.`,
          impact: 'medium',
          recommendation: 'Your posting strategy is working well. Consider posting similar jobs more frequently.',
          action: 'Scale successful job types',
          confidence: 82,
          metrics: { current: fillRate.toFixed(1), benchmark: benchmarks.fillRate, unit: '%' }
        });
      }
    }

    // Quality Insights
    if (!validatedParams.categories || validatedParams.categories.includes('quality')) {
      if (avgResponseTime < benchmarks.responseTime) {
        insights.push({
          id: 'fast-response',
          type: 'success',
          category: 'quality',
          title: 'Quick Response Time',
          description: `Your average response time of ${avgResponseTime.toFixed(1)} hours is faster than the ${benchmarks.responseTime}h industry average.`,
          impact: 'medium',
          recommendation: 'Your responsiveness is excellent. Consider promoting this in job postings to attract more candidates.',
          action: 'Highlight quick response in job ads',
          confidence: 90,
          metrics: { current: avgResponseTime.toFixed(1), benchmark: benchmarks.responseTime, unit: 'hours' }
        });
      } else if (avgResponseTime > benchmarks.responseTime * 1.5) {
        insights.push({
          id: 'slow-response',
          type: 'warning',
          category: 'quality',
          title: 'Slow Response Time',
          description: `Your average response time of ${avgResponseTime.toFixed(1)} hours may be deterring candidates.`,
          impact: 'high',
          recommendation: 'Set up automated responses and dedicate specific times for application review.',
          action: 'Implement faster response system',
          confidence: 85,
          metrics: { current: avgResponseTime.toFixed(1), benchmark: benchmarks.responseTime, unit: 'hours' }
        });
      }
    }

    // Efficiency Insights
    if (!validatedParams.categories || validatedParams.categories.includes('efficiency')) {
      if (avgApplicationsPerJob > benchmarks.avgApplicationsPerJob * 1.3) {
        insights.push({
          id: 'high-interest',
          type: 'info',
          category: 'efficiency',
          title: 'High Application Volume',
          description: `Your jobs receive ${avgApplicationsPerJob.toFixed(1)} applications on average, indicating strong interest.`,
          impact: 'medium',
          recommendation: 'Consider increasing selectivity or adding screening questions to filter candidates.',
          action: 'Add application screening',
          confidence: 78,
          metrics: { current: avgApplicationsPerJob.toFixed(1), benchmark: benchmarks.avgApplicationsPerJob, unit: 'apps/job' }
        });
      } else if (avgApplicationsPerJob < benchmarks.avgApplicationsPerJob * 0.7) {
        insights.push({
          id: 'low-interest',
          type: 'warning',
          category: 'efficiency',
          title: 'Low Application Volume',
          description: `Your jobs receive only ${avgApplicationsPerJob.toFixed(1)} applications on average.`,
          impact: 'high',
          recommendation: 'Improve job descriptions, increase hourly rates, or expand posting reach.',
          action: 'Enhance job attractiveness',
          confidence: 83,
          metrics: { current: avgApplicationsPerJob.toFixed(1), benchmark: benchmarks.avgApplicationsPerJob, unit: 'apps/job' }
        });
      }
    }

    // Cost Insights
    if (!validatedParams.categories || validatedParams.categories.includes('cost')) {
      const avgSalary = salaryAnalysis._avg.hourlyRate || 0;
      const marketRate = 16.50; // simplified market rate

      if (avgSalary < marketRate * 0.9) {
        insights.push({
          id: 'below-market-rate',
          type: 'warning',
          category: 'cost',
          title: 'Below Market Rate',
          description: `Your average hourly rate of $${avgSalary.toFixed(2)} is below the market rate of $${marketRate.toFixed(2)}.`,
          impact: 'high',
          recommendation: 'Consider increasing hourly rates to attract more qualified candidates.',
          action: 'Increase compensation',
          confidence: 87,
          metrics: { current: avgSalary.toFixed(2), benchmark: marketRate.toFixed(2), unit: '$/hour' }
        });
      } else if (avgSalary > marketRate * 1.15) {
        insights.push({
          id: 'above-market-rate',
          type: 'success',
          category: 'cost',
          title: 'Competitive Compensation',
          description: `Your average hourly rate of $${avgSalary.toFixed(2)} is above market rate, which should attract quality candidates.`,
          impact: 'medium',
          recommendation: 'Your compensation is competitive. Monitor hiring success to ensure good ROI.',
          action: 'Monitor hiring ROI',
          confidence: 80,
          metrics: { current: avgSalary.toFixed(2), benchmark: marketRate.toFixed(2), unit: '$/hour' }
        });
      }
    }

    // Trends Insights
    if (!validatedParams.categories || validatedParams.categories.includes('trends')) {
      const statusBreakdown = statusDistribution.reduce((acc, status) => {
        acc[status.status] = status._count;
        return acc;
      }, {} as Record<string, number>);

      const pendingRate = (statusBreakdown.PENDING || 0) / totalApplications * 100;
      
      if (pendingRate > 40) {
        insights.push({
          id: 'high-pending',
          type: 'warning',
          category: 'trends',
          title: 'High Pending Applications',
          description: `${pendingRate.toFixed(1)}% of applications are still pending review.`,
          impact: 'medium',
          recommendation: 'Process pending applications faster to improve candidate experience.',
          action: 'Review pending applications',
          confidence: 85,
          metrics: { current: pendingRate.toFixed(1), benchmark: '25', unit: '%' }
        });
      }
    }

    // Generate action plan based on insights
    const actionPlan = insights
      .filter(insight => insight.impact === 'high')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((insight, index) => ({
        priority: index + 1,
        action: insight.action,
        description: insight.recommendation,
        category: insight.category,
        expectedImpact: insight.impact,
        timeframe: insight.impact === 'high' ? 'immediate' : 'short-term',
      }));

    const automatedInsights = {
      summary: {
        totalInsights: insights.length,
        criticalIssues: insights.filter(i => i.type === 'warning' && i.impact === 'high').length,
        opportunities: insights.filter(i => i.type === 'success').length,
        overallScore: Math.round((insights.filter(i => i.type === 'success').length / Math.max(1, insights.length)) * 100),
      },
      insights: insights.sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        return (impactWeight[b.impact as keyof typeof impactWeight] * b.confidence) - 
               (impactWeight[a.impact as keyof typeof impactWeight] * a.confidence);
      }),
      actionPlan,
      benchmarks: {
        conversionRate: { current: conversionRate.toFixed(1), target: benchmarks.conversionRate },
        responseTime: { current: avgResponseTime.toFixed(1), target: benchmarks.responseTime },
        fillRate: { current: fillRate.toFixed(1), target: benchmarks.fillRate },
        applicationsPerJob: { current: avgApplicationsPerJob.toFixed(1), target: benchmarks.avgApplicationsPerJob },
      },
      dateRange: {
        start: validatedParams.start,
        end: validatedParams.end,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(automatedInsights);
  } catch (error) {
    console.error('Error generating insights:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}