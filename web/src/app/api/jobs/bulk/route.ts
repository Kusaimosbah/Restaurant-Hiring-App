import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/jobs/bulk
 * Perform bulk actions on multiple jobs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owners only' },
        { status: 401 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { jobIds, action } = body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Job IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Verify all jobs belong to this restaurant
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        restaurantId: restaurant.id
      }
    });

    if (jobs.length !== jobIds.length) {
      return NextResponse.json(
        { error: 'Some jobs not found or do not belong to your restaurant' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
      case 'publish':
        updateData = { status: 'ACTIVE' };
        message = `${jobs.length} job(s) activated successfully`;
        break;
      
      case 'pause':
        updateData = { status: 'PAUSED' };
        message = `${jobs.length} job(s) paused successfully`;
        break;
      
      case 'close':
        updateData = { status: 'CLOSED' };
        message = `${jobs.length} job(s) closed successfully`;
        break;
      
      case 'delete':
        // Delete jobs and their applications
        await prisma.$transaction([
          prisma.application.deleteMany({
            where: { jobId: { in: jobIds } }
          }),
          prisma.job.deleteMany({
            where: { id: { in: jobIds } }
          })
        ]);
        
        return NextResponse.json({
          message: `${jobs.length} job(s) deleted successfully`
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update jobs
    await prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: updateData
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Failed to perform bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}