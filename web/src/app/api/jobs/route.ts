import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const job = await prisma.job.create({
      data: {
        title: body.title || 'Test Job',
        description: body.description || 'Test Description',
        requirements: body.requirements || '',
        salary_min: Number(body.salary_min) || 1000,
        salary_max: Number(body.salary_max) || 2000,
        location: body.location || 'Kuala Lumpur',
        workType: body.workType || 'FULL_TIME',
        department: body.department || 'Kitchen',
        startDate: new Date(body.startDate || new Date()),
        endDate: new Date(body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        maxWorkers: Number(body.maxWorkers) || 1,
        employerId: 'cmhnnm6ow0000jc8l143et3w4',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, job });
    
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create job' 
    }, { status: 500 });
  }
}
