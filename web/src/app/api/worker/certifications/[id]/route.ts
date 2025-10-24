import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating certification updates
const certificationUpdateSchema = z.object({
  name: z.string().min(1, "Certification name is required").optional(),
  issuingOrganization: z.string().min(1, "Issuing organization is required").optional(),
  issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Issue date must be a valid date",
  }).optional(),
  expirationDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Expiration date must be a valid date",
  }).optional().nullable(),
  credentialId: z.string().optional().nullable(),
  verificationUrl: z.string().url().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
});

/**
 * GET /api/worker/certifications/[id]
 * 
 * Retrieves a specific certification for the authenticated worker
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can access this endpoint' }, { status: 403 });
    }

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Get the certification and ensure it belongs to this worker
    const certification = await prisma.certification.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    return NextResponse.json(certification);
  } catch (error) {
    console.error('Error retrieving worker certification:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker certification' }, { status: 500 });
  }
}

/**
 * PUT /api/worker/certifications/[id]
 * 
 * Updates a specific certification for the authenticated worker
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can update certifications' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = certificationUpdateSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the certification exists and belongs to this worker
    const existingCertification = await prisma.certification.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingCertification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Prepare data for update
    const updateData: any = {};
    
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.issuingOrganization) updateData.issuingOrganization = validatedData.issuingOrganization;
    if (validatedData.issueDate) updateData.issueDate = new Date(validatedData.issueDate);
    if ('expirationDate' in validatedData) {
      updateData.expirationDate = validatedData.expirationDate ? new Date(validatedData.expirationDate) : null;
    }
    if ('credentialId' in validatedData) updateData.credentialId = validatedData.credentialId;
    if ('verificationUrl' in validatedData) updateData.verificationUrl = validatedData.verificationUrl;
    if ('documentUrl' in validatedData) updateData.documentUrl = validatedData.documentUrl;

    // Update the certification
    const updatedCertification = await prisma.certification.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedCertification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating worker certification:', error);
    return NextResponse.json({ error: 'Failed to update worker certification' }, { status: 500 });
  }
}

/**
 * DELETE /api/worker/certifications/[id]
 * 
 * Deletes a specific certification for the authenticated worker
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can delete certifications' }, { status: 403 });
    }

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the certification exists and belongs to this worker
    const existingCertification = await prisma.certification.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingCertification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Delete the certification
    await prisma.certification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker certification:', error);
    return NextResponse.json({ error: 'Failed to delete worker certification' }, { status: 500 });
  }
}
