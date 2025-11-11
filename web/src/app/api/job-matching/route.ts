import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobMatchingService } from '@/lib/services/AdvancedJobMatchingService';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/job-matching/calculate
 * Calculate match score between specific job and worker
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, workerId } = body;

    if (!jobId || !workerId) {
      return NextResponse.json(
        { error: 'Job ID and Worker ID are required' },
        { status: 400 }
      );
    }

    // Verify job and worker exist
    const [job, worker] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId },
        include: {
          restaurant: {
            include: {
              owner: true,
            },
          },
        },
      }),
      prisma.workerProfile.findUnique({
        where: { id: workerId },
        include: {
          user: true,
        },
      }),
    ]);

    if (!job || !worker) {
      return NextResponse.json(
        { error: 'Job or worker not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const canAccess = 
      session.user.id === job.restaurant.owner.id || // Restaurant owner
      session.user.id === worker.userId || // Worker themselves
      session.user.role === 'ADMIN'; // Admin

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate match score
    const matchScore = await jobMatchingService.calculateJobMatch(jobId, workerId);

    // Log the calculation for analytics
    await prisma.matchCalculation.create({
      data: {
        jobId,
        workerId,
        overallScore: matchScore.overallScore,
        skillsScore: matchScore.skillsScore,
        experienceScore: matchScore.experienceScore,
        locationScore: matchScore.locationScore,
        availabilityScore: matchScore.availabilityScore,
        salaryScore: matchScore.salaryScore,
        cultureScore: matchScore.cultureScore,
        confidence: matchScore.confidence,
        calculatedBy: session.user.id,
        calculatedAt: new Date(),
      },
    });

    return NextResponse.json({
      matchScore,
      job: {
        id: job.id,
        title: job.title,
        restaurant: {
          id: job.restaurant.id,
          name: job.restaurant.name,
        },
      },
      worker: {
        id: worker.id,
        name: worker.user.name,
        email: worker.user.email,
      },
    });

  } catch (error) {
    console.error('Error calculating match score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/job-matching/analytics
 * Get matching analytics and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const restaurantId = searchParams.get('restaurantId');

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build filter conditions
    const whereConditions: any = {
      calculatedAt: {
        gte: startDate,
      },
    };

    if (restaurantId) {
      whereConditions.job = {
        restaurantId,
      };
    }

    // Get matching statistics
    const [
      totalCalculations,
      avgOverallScore,
      scoreDistribution,
      topSkillsMatches,
      conversionRates,
      recentCalculations,
    ] = await Promise.all([
      // Total calculations
      prisma.matchCalculation.count({
        where: whereConditions,
      }),

      // Average overall score
      prisma.matchCalculation.aggregate({
        where: whereConditions,
        _avg: {
          overallScore: true,
          skillsScore: true,
          experienceScore: true,
          locationScore: true,
          availabilityScore: true,
          salaryScore: true,
          cultureScore: true,
          confidence: true,
        },
      }),

      // Score distribution
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN overallScore >= 90 THEN 'Excellent (90-100)'
            WHEN overallScore >= 80 THEN 'Good (80-89)'
            WHEN overallScore >= 70 THEN 'Fair (70-79)'
            WHEN overallScore >= 60 THEN 'Poor (60-69)'
            ELSE 'Very Poor (0-59)'
          END as scoreRange,
          COUNT(*) as count
        FROM MatchCalculation 
        WHERE calculatedAt >= ${startDate}
        ${restaurantId ? `AND jobId IN (SELECT id FROM Job WHERE restaurantId = '${restaurantId}')` : ''}
        GROUP BY scoreRange
        ORDER BY MIN(overallScore) DESC
      `,

      // Top skills that lead to good matches
      prisma.$queryRaw`
        SELECT 
          skill.name,
          AVG(mc.overallScore) as avgScore,
          COUNT(*) as matches
        FROM MatchCalculation mc
        JOIN Job j ON mc.jobId = j.id
        JOIN WorkerProfile wp ON mc.workerId = wp.id
        JOIN WorkerSkill ws ON wp.id = ws.workerProfileId
        JOIN Skill skill ON ws.skillId = skill.id
        WHERE mc.calculatedAt >= ${startDate}
        ${restaurantId ? `AND j.restaurantId = '${restaurantId}'` : ''}
        GROUP BY skill.name
        HAVING COUNT(*) >= 5
        ORDER BY avgScore DESC
        LIMIT 10
      `,

      // Conversion rates (matches that led to applications/hires)
      prisma.$queryRaw`
        SELECT 
          COUNT(mc.id) as totalMatches,
          COUNT(app.id) as applications,
          COUNT(CASE WHEN app.status = 'HIRED' THEN 1 END) as hires,
          AVG(mc.overallScore) as avgMatchScore
        FROM MatchCalculation mc
        LEFT JOIN Application app ON mc.jobId = app.jobId AND mc.workerId = app.workerId
        WHERE mc.calculatedAt >= ${startDate}
        ${restaurantId ? `AND mc.jobId IN (SELECT id FROM Job WHERE restaurantId = '${restaurantId}')` : ''}
      `,

      // Recent calculations for trending
      prisma.matchCalculation.findMany({
        where: whereConditions,
        include: {
          job: {
            select: {
              title: true,
              restaurant: {
                select: {
                  name: true,
                },
              },
            },
          },
          worker: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          calculatedAt: 'desc',
        },
        take: 20,
      }),
    ]);

    // Calculate performance metrics
    const conversionData = Array.isArray(conversionRates) ? conversionRates[0] : conversionRates;
    const applicationRate = conversionData?.totalMatches > 0 
      ? (Number(conversionData.applications) / Number(conversionData.totalMatches)) * 100 
      : 0;
    const hireRate = conversionData?.applications > 0 
      ? (Number(conversionData.hires) / Number(conversionData.applications)) * 100 
      : 0;

    return NextResponse.json({
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalCalculations,
        averageScores: {
          overall: Math.round((avgOverallScore._avg.overallScore || 0) * 10) / 10,
          skills: Math.round((avgOverallScore._avg.skillsScore || 0) * 10) / 10,
          experience: Math.round((avgOverallScore._avg.experienceScore || 0) * 10) / 10,
          location: Math.round((avgOverallScore._avg.locationScore || 0) * 10) / 10,
          availability: Math.round((avgOverallScore._avg.availabilityScore || 0) * 10) / 10,
          salary: Math.round((avgOverallScore._avg.salaryScore || 0) * 10) / 10,
          culture: Math.round((avgOverallScore._avg.cultureScore || 0) * 10) / 10,
          confidence: Math.round((avgOverallScore._avg.confidence || 0) * 10) / 10,
        },
        performance: {
          applicationRate: Math.round(applicationRate * 10) / 10,
          hireRate: Math.round(hireRate * 10) / 10,
          totalApplications: Number(conversionData?.applications || 0),
          totalHires: Number(conversionData?.hires || 0),
        },
      },
      charts: {
        scoreDistribution,
        topSkills: topSkillsMatches,
        recentActivity: recentCalculations.map(calc => ({
          id: calc.id,
          score: calc.overallScore,
          confidence: calc.confidence,
          jobTitle: calc.job.title,
          restaurantName: calc.job.restaurant.name,
          workerName: `${calc.worker.user.firstName} ${calc.worker.user.lastName}`,
          calculatedAt: calc.calculatedAt,
        })),
      },
    });

  } catch (error) {
    console.error('Error getting matching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}