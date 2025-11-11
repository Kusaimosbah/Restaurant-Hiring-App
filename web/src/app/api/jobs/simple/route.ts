import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE JOB CREATION API ===');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Create job with minimal validation
    const job = await prisma.job.create({
      data: {
        title: body.title || 'Test Job',
        description: body.description || 'Test Description',
        requirements: body.requirements || 'No requirements',
        salary_min: Number(body.salary_min) || 1000,
        salary_max: Number(body.salary_max) || 2000,
        location: body.location || 'Kuala Lumpur',
        workType: body.workType || 'FULL_TIME',
        department: body.department || 'Kitchen',
        startDate: new Date(body.startDate || new Date()),
        endDate: new Date(body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        maxWorkers: Number(body.maxWorkers) || 1,
        employerId: 'cmhnnm6ow0000jc8l143et3w4', // Your user ID
        status: 'ACTIVE'
      }
    });

    console.log('Job created successfully:', job);
    
    return NextResponse.json({
      success: true,
      job: job
    });
    
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    }, { status: 500 });
  }
}