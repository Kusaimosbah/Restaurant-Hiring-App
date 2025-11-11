import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Get applications for restaurant owner's jobs
    const applications = await prisma.application.findMany({
      where: {
        job: {
          restaurant: {
            ownerId: session.user.id
          }
        },
        appliedAt: {
          gte: periodDate
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Calculate statistics
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'PENDING').length;
    const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED').length;
    const rejectedApplications = applications.filter(app => app.status === 'REJECTED').length;
    const interviewScheduled = applications.filter(app => app.status === 'INTERVIEW_SCHEDULED').length;

    // Applications by status
    const statusBreakdown = {
      PENDING: pendingApplications,
      ACCEPTED: acceptedApplications,
      REJECTED: rejectedApplications,
      INTERVIEW_SCHEDULED: interviewScheduled,
      ARCHIVED: applications.filter(app => app.status === 'ARCHIVED').length
    };

    // Applications by job
    const jobStats = applications.reduce((acc, app) => {
      const jobId = app.job.id;
      const jobTitle = app.job.title;
      
      if (!acc[jobId]) {
        acc[jobId] = {
          jobId,
          jobTitle,
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          interviews: 0
        };
      }
      
      acc[jobId].total++;
      
      switch (app.status) {
        case 'PENDING':
          acc[jobId].pending++;
          break;
        case 'ACCEPTED':
          acc[jobId].accepted++;
          break;
        case 'REJECTED':
          acc[jobId].rejected++;
          break;
        case 'INTERVIEW_SCHEDULED':
          acc[jobId].interviews++;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Timeline data (applications per day)
    const timeline = [];
    const timelineMap = new Map();

    applications.forEach(app => {
      const date = app.appliedAt.toISOString().split('T')[0];
      if (timelineMap.has(date)) {
        timelineMap.set(date, timelineMap.get(date) + 1);
      } else {
        timelineMap.set(date, 1);
      }
    });

    // Fill in missing dates with 0
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      timeline.push({
        date: dateStr,
        applications: timelineMap.get(dateStr) || 0
      });
    }

    // Response time statistics
    const respondedApplications = applications.filter(app => app.respondedAt);
    let averageResponseTime = 0;
    
    if (respondedApplications.length > 0) {
      const totalResponseTime = respondedApplications.reduce((sum, app) => {
        const responseTime = app.respondedAt!.getTime() - app.appliedAt.getTime();
        return sum + responseTime;
      }, 0);
      
      averageResponseTime = Math.round(totalResponseTime / respondedApplications.length / (1000 * 60 * 60 * 24)); // days
    }

    // Recent activity (last 5 applications)
    const recentApplications = applications
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
      .slice(0, 5)
      .map(app => ({
        id: app.id,
        jobTitle: app.job.title,
        status: app.status,
        appliedAt: app.appliedAt,
        respondedAt: app.respondedAt
      }));

    const response = {
      period: parseInt(period),
      summary: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        interviewScheduled,
        responseRate: totalApplications > 0 ? Math.round(((totalApplications - pendingApplications) / totalApplications) * 100) : 0,
        acceptanceRate: totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0,
        averageResponseTime // in days
      },
      statusBreakdown,
      jobStats: Object.values(jobStats),
      timeline,
      recentActivity: recentApplications,
      trends: {
        applicationsGrowth: timeline.length >= 2 ? 
          ((timeline.slice(-7).reduce((sum, day) => sum + day.applications, 0)) - 
           (timeline.slice(-14, -7).reduce((sum, day) => sum + day.applications, 0))) : 0,
        popularJobs: Object.values(jobStats)
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 3)
          .map((job: any) => ({
            jobTitle: job.jobTitle,
            applications: job.total
          }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Applications statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}