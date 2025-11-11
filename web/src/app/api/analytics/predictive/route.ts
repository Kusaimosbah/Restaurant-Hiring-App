import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const predictiveQuerySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  restaurantId: z.string().optional(),
  horizon: z.enum(['week', 'month', 'quarter']).default('month'),
});

// GET /api/analytics/predictive - Get predictive analytics and forecasting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      start: searchParams.get('start') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      end: searchParams.get('end') || new Date().toISOString(),
      restaurantId: searchParams.get('restaurantId') || undefined,
      horizon: (searchParams.get('horizon') as 'week' | 'month' | 'quarter') || 'month',
    };

    const validatedParams = predictiveQuerySchema.parse(queryParams);

    // Build where clauses
    const applicationWhereClause: any = {
      appliedAt: { gte: validatedParams.start, lte: validatedParams.end },
    };

    if (session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER') {
        applicationWhereClause.restaurantId = session.user.id;
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (validatedParams.restaurantId) {
      applicationWhereClause.restaurantId = validatedParams.restaurantId;
    }

    // Get historical data for trend analysis
    const historicalData = await prisma.$queryRaw<Array<{
      date: string;
      applications: number;
      hires: number;
      avg_time_to_hire: number;
    }>>`
      SELECT 
        DATE_TRUNC('week', applied_at)::date as date,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'HIRED' THEN 1 END) as hires,
        AVG(
          CASE 
            WHEN status = 'HIRED' AND responded_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (responded_at - applied_at)) / 86400 
          END
        ) as avg_time_to_hire
      FROM applications 
      WHERE applied_at >= ${validatedParams.start} 
        AND applied_at <= ${validatedParams.end}
        ${validatedParams.restaurantId ? `AND restaurant_id = ${validatedParams.restaurantId}` : ''}
      GROUP BY DATE_TRUNC('week', applied_at)
      ORDER BY date
    `;

    // Calculate trend analysis
    const calculateTrend = (data: number[]) => {
      if (data.length < 2) return { trend: 'stable', change: 0 };
      
      const recent = data.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, data.length);
      const earlier = data.slice(0, -4).reduce((a, b) => a + b, 0) / Math.max(1, data.length - 4);
      
      const change = earlier > 0 ? ((recent - earlier) / earlier) * 100 : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(change) > 5) {
        trend = change > 0 ? 'increasing' : 'decreasing';
      }
      
      return { trend, change: Math.round(change * 100) / 100 };
    };

    const applicationTrend = calculateTrend(historicalData.map(d => Number(d.applications)));
    const hireTrend = calculateTrend(historicalData.map(d => Number(d.hires)));

    // Simple linear projection for next period
    const projectNextPeriod = (data: number[], horizon: string) => {
      if (data.length < 3) return data[data.length - 1] || 0;
      
      const recentData = data.slice(-4);
      const sum = recentData.reduce((a, b) => a + b, 0);
      const avg = sum / recentData.length;
      
      // Apply trend multiplier based on horizon and recent trend
      const trendMultiplier = applicationTrend.change / 100;
      const horizonMultiplier = horizon === 'week' ? 0.1 : horizon === 'month' ? 0.5 : 1.5;
      
      return Math.max(0, Math.round(avg * (1 + (trendMultiplier * horizonMultiplier))));
    };

    const applications = historicalData.map(d => Number(d.applications));
    const hires = historicalData.map(d => Number(d.hires));

    // Generate forecasts
    const forecasts = {
      applications: {
        current: applications[applications.length - 1] || 0,
        projected: projectNextPeriod(applications, validatedParams.horizon),
        trend: applicationTrend,
      },
      hires: {
        current: hires[hires.length - 1] || 0,
        projected: projectNextPeriod(hires, validatedParams.horizon),
        trend: hireTrend,
      },
    };

    // Calculate demand forecasting by analyzing job posting patterns
    const jobDemandAnalysis = await prisma.$queryRaw<Array<{
      title_pattern: string;
      avg_applications: number;
      success_rate: number;
      recommended_rate: number;
    }>>`
      SELECT 
        CASE 
          WHEN LOWER(title) LIKE '%server%' THEN 'Server/Waitstaff'
          WHEN LOWER(title) LIKE '%cook%' OR LOWER(title) LIKE '%chef%' THEN 'Kitchen Staff'
          WHEN LOWER(title) LIKE '%manager%' THEN 'Management'
          WHEN LOWER(title) LIKE '%host%' OR LOWER(title) LIKE '%hostess%' THEN 'Host/Hostess'
          WHEN LOWER(title) LIKE '%bartender%' OR LOWER(title) LIKE '%bar%' THEN 'Bartender'
          ELSE 'Other'
        END as title_pattern,
        AVG(app_count) as avg_applications,
        AVG(CASE WHEN hire_count > 0 THEN 1.0 ELSE 0.0 END) * 100 as success_rate,
        AVG(hourly_rate) as recommended_rate
      FROM (
        SELECT 
          j.title,
          j.hourly_rate,
          COUNT(a.id) as app_count,
          COUNT(CASE WHEN a.status = 'HIRED' THEN 1 END) as hire_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id 
          AND a.applied_at >= ${validatedParams.start}
          AND a.applied_at <= ${validatedParams.end}
        WHERE j.created_at >= ${validatedParams.start}
          ${validatedParams.restaurantId ? `AND j.restaurant_id = ${validatedParams.restaurantId}` : ''}
        GROUP BY j.id, j.title, j.hourly_rate
      ) job_stats
      GROUP BY title_pattern
      HAVING COUNT(*) > 0
      ORDER BY avg_applications DESC
    `;

    // Generate insights based on data analysis
    const insights = [];

    // Application volume insights
    if (applicationTrend.trend === 'increasing' && applicationTrend.change > 10) {
      insights.push({
        type: 'positive',
        category: 'volume',
        title: 'Application Volume Surge',
        description: `Applications are up ${applicationTrend.change}% with strong momentum. Consider preparing for increased candidate flow.`,
        recommendation: 'Scale up your review process and consider raising job requirements.',
        confidence: 85,
      });
    } else if (applicationTrend.trend === 'decreasing' && applicationTrend.change < -10) {
      insights.push({
        type: 'warning',
        category: 'volume',
        title: 'Declining Applications',
        description: `Applications have decreased by ${Math.abs(applicationTrend.change)}%. This may indicate market competition or posting issues.`,
        recommendation: 'Review job descriptions, increase hourly rates, or improve posting visibility.',
        confidence: 78,
      });
    }

    // Hiring efficiency insights
    const conversionRate = applications.length > 0 && hires.length > 0 
      ? (hires.reduce((a, b) => a + b, 0) / applications.reduce((a, b) => a + b, 0)) * 100 
      : 0;

    if (conversionRate > 15) {
      insights.push({
        type: 'positive',
        category: 'efficiency',
        title: 'High Conversion Rate',
        description: `Your ${conversionRate.toFixed(1)}% conversion rate is excellent, indicating strong candidate quality.`,
        recommendation: 'Consider being more selective or increasing compensation to attract top talent.',
        confidence: 92,
      });
    } else if (conversionRate < 5) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Low Conversion Rate',
        description: `Your ${conversionRate.toFixed(1)}% conversion rate suggests potential process issues.`,
        recommendation: 'Review hiring criteria, improve job descriptions, or streamline the application process.',
        confidence: 88,
      });
    }

    // Market demand insights
    jobDemandAnalysis.forEach(demand => {
      if (Number(demand.success_rate) > 70) {
        insights.push({
          type: 'info',
          category: 'market',
          title: `High Demand: ${demand.title_pattern}`,
          description: `${demand.title_pattern} positions have a ${Number(demand.success_rate).toFixed(1)}% fill rate with average ${Number(demand.avg_applications).toFixed(1)} applications.`,
          recommendation: `Recommended rate: $${Number(demand.recommended_rate).toFixed(2)}/hr. Consider posting more ${demand.title_pattern} positions.`,
          confidence: 82,
        });
      }
    });

    // Seasonal patterns (simplified)
    const currentMonth = new Date().getMonth();
    const seasonalInsights = {
      0: 'January typically sees 15% fewer applications due to post-holiday lull.',
      1: 'February applications usually increase as people seek new opportunities.',
      2: 'March marks the beginning of spring hiring season with 20% more activity.',
      5: 'June is peak hiring season for restaurants with summer staff needs.',
      8: 'September sees renewed hiring as students return and fall season begins.',
      11: 'December hiring slows due to holidays, plan accordingly.',
    };

    if (seasonalInsights[currentMonth as keyof typeof seasonalInsights]) {
      insights.push({
        type: 'info',
        category: 'seasonal',
        title: 'Seasonal Pattern',
        description: seasonalInsights[currentMonth as keyof typeof seasonalInsights],
        recommendation: 'Adjust hiring strategies based on seasonal patterns.',
        confidence: 75,
      });
    }

    const predictiveAnalytics = {
      forecasts,
      trends: {
        applications: applicationTrend,
        hires: hireTrend,
        conversionRate: conversionRate.toFixed(1),
      },
      marketDemand: jobDemandAnalysis.map(demand => ({
        category: demand.title_pattern,
        avgApplications: Number(demand.avg_applications).toFixed(1),
        successRate: Number(demand.success_rate).toFixed(1),
        recommendedRate: Number(demand.recommended_rate).toFixed(2),
      })),
      insights: insights.sort((a, b) => b.confidence - a.confidence),
      historicalData: historicalData.map(d => ({
        date: d.date,
        applications: Number(d.applications),
        hires: Number(d.hires),
        avgTimeToHire: Number(d.avg_time_to_hire) || 0,
      })),
      dateRange: {
        start: validatedParams.start,
        end: validatedParams.end,
      },
      horizon: validatedParams.horizon,
    };

    return NextResponse.json(predictiveAnalytics);
  } catch (error) {
    console.error('Error fetching predictive analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch predictive analytics' },
      { status: 500 }
    );
  }
}