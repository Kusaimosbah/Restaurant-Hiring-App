import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for saved job operations
const savedJobSchema = z.object({
  jobId: z.string(),
  saved: z.boolean(),
});

// In a real app, we would store saved jobs in the database
// For now, we'll use a simple in-memory store
const savedJobs: Record<string, string[]> = {};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // In a real app, we would fetch saved jobs from the database
    // For now, we'll use our in-memory store
    const userSavedJobs = savedJobs[userId] || [];
    
    // If we have job IDs, fetch the actual job details
    if (userSavedJobs.length > 0) {
      const jobs = await prisma.job.findMany({
        where: {
          id: { in: userSavedJobs },
          status: 'ACTIVE',
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
      });
      
      // Add isSaved flag to each job
      const jobsWithSavedStatus = jobs.map(job => ({
        ...job,
        isSaved: true,
      }));
      
      return NextResponse.json(jobsWithSavedStatus);
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { jobId, saved } = savedJobSchema.parse(body);
    
    // Ensure the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // In a real app, we would update the database
    // For now, we'll use our in-memory store
    if (!savedJobs[userId]) {
      savedJobs[userId] = [];
    }
    
    if (saved) {
      // Add to saved jobs if not already saved
      if (!savedJobs[userId].includes(jobId)) {
        savedJobs[userId].push(jobId);
      }
    } else {
      // Remove from saved jobs
      savedJobs[userId] = savedJobs[userId].filter(id => id !== jobId);
    }
    
    return NextResponse.json({ success: true, saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating saved job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
