import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For workers, provide personalized recommendations based on skills and experience
    if (session.user.role === 'WORKER') {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          workerSkills: true,
          applications: {
            include: {
              job: true,
            },
          },
        },
      });

      if (!workerProfile) {
        return NextResponse.json(
          { error: 'Worker profile not found' },
          { status: 404 }
        );
      }

      // Get worker's skills
      const workerSkills = workerProfile.workerSkills.map(skill => skill.name.toLowerCase());
      
      // Get job categories the worker has applied to before
      const appliedJobTitles = workerProfile.applications.map(app => app.job.title.toLowerCase());
      
      // Find active jobs that match worker's skills or previous applications
      const recommendedJobs = await prisma.job.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            // Match based on worker's skills (in job title or description)
            ...workerSkills.map(skill => ({
              OR: [
                { title: { contains: skill, mode: 'insensitive' } },
                { description: { contains: skill, mode: 'insensitive' } },
              ],
            })),
            // Match based on job titles the worker has applied to before
            ...appliedJobTitles.map(title => ({
              title: { contains: title, mode: 'insensitive' },
            })),
          ],
          // Exclude jobs the worker has already applied to
          NOT: {
            applications: {
              some: {
                workerId: workerProfile.id,
              },
            },
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: [
          { hourlyRate: 'desc' }, // Higher paying jobs first
          { createdAt: 'desc' },  // Newer jobs next
        ],
        take: 6, // Limit to 6 recommendations
      });

      return NextResponse.json(recommendedJobs);
    } 
    // For restaurant owners, provide recommendations based on similar restaurants
    else if (session.user.role === 'RESTAURANT_OWNER') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id },
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      // Find jobs from similar restaurants (same cuisine type)
      const recommendedJobs = await prisma.job.findMany({
        where: {
          status: 'ACTIVE',
          restaurant: {
            cuisineType: restaurant.cuisineType,
            id: { not: restaurant.id }, // Exclude own restaurant
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6, // Limit to 6 recommendations
      });

      return NextResponse.json(recommendedJobs);
    }

    // Fallback for unknown role
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
