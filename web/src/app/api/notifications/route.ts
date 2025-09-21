import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = [];

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false
      }
    });

    if (unreadMessages > 0) {
      notifications.push({
        id: 'messages',
        type: 'messages',
        title: 'New Messages',
        message: `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`,
        count: unreadMessages,
        href: '/dashboard/messages',
        createdAt: new Date().toISOString()
      });
    }

    // Get recent application updates for restaurant owners
    if (session.user.role === 'RESTAURANT_OWNER') {
      const recentApplications = await prisma.application.findMany({
        where: {
          restaurant: {
            ownerId: session.user.id
          },
          appliedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          job: { select: { title: true } },
          worker: { 
            include: { 
              user: { select: { name: true } } 
            } 
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
      });

      recentApplications.forEach(app => {
        notifications.push({
          id: `application-${app.id}`,
          type: 'application',
          title: 'New Job Application',
          message: `${app.worker.user.name} applied for ${app.job.title}`,
          href: '/dashboard/applications',
          createdAt: app.appliedAt.toISOString()
        });
      });
    }

    // Get application status updates for workers
    if (session.user.role === 'WORKER') {
      const statusUpdates = await prisma.application.findMany({
        where: {
          worker: {
            userId: session.user.id
          },
          respondedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          job: { select: { title: true } },
          restaurant: { select: { name: true } }
        },
        orderBy: { respondedAt: 'desc' },
        take: 5
      });

      statusUpdates.forEach(app => {
        const statusText = app.status === 'ACCEPTED' ? 'accepted' : 
                          app.status === 'REJECTED' ? 'rejected' : 'updated';
        
        notifications.push({
          id: `status-${app.id}`,
          type: 'status',
          title: 'Application Update',
          message: `Your application for ${app.job.title} at ${app.restaurant.name} was ${statusText}`,
          href: '/dashboard/applications',
          createdAt: app.respondedAt?.toISOString() || app.appliedAt.toISOString()
        });
      });

      // Get new job postings that match worker's skills
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: { skills: true }
      });

      if (workerProfile?.skills && workerProfile.skills.length > 0) {
        const newJobs = await prisma.job.findMany({
          where: {
            status: 'ACTIVE',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          include: {
            restaurant: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        });

        newJobs.forEach(job => {
          notifications.push({
            id: `job-${job.id}`,
            type: 'job',
            title: 'New Job Posted',
            message: `${job.restaurant.name} posted a new job: ${job.title}`,
            href: '/dashboard/jobs',
            createdAt: job.createdAt.toISOString()
          });
        });
      }
    }

    // Sort notifications by date
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 10), // Limit to 10 most recent
      totalCount: notifications.length,
      unreadCount: notifications.filter(n => n.type === 'messages').reduce((sum, n) => sum + (n.count || 1), 0)
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}