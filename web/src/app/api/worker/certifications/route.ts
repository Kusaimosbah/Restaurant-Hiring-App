import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating certification creation
const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Issue date must be a valid date",
  }),
  expirationDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Expiration date must be a valid date",
  }).optional().nullable(),
  credentialId: z.string().optional().nullable(),
  verificationUrl: z.string().url().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
});

/**
 * GET /api/worker/certifications
 * 
 * Retrieves all certifications for the authenticated worker
 */
export async function GET(req: NextRequest) {
  try {
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

    // Get all certifications for this worker
    const certifications = await prisma.certification.findMany({
      where: { workerId: workerProfile.id },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error('Error retrieving worker certifications:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker certifications' }, { status: 500 });
  }
}

/**
 * POST /api/worker/certifications
 * 
 * Creates a new certification for the authenticated worker
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can create certifications' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = certificationSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Create the new certification
    const newCertification = await prisma.certification.create({
      data: {
        name: validatedData.name,
        issuingOrganization: validatedData.issuingOrganization,
        issueDate: new Date(validatedData.issueDate),
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null,
        credentialId: validatedData.credentialId,
        verificationUrl: validatedData.verificationUrl,
        documentUrl: validatedData.documentUrl,
        workerId: workerProfile.id,
      },
    });

    return NextResponse.json(newCertification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating worker certification:', error);
    return NextResponse.json({ error: 'Failed to create worker certification' }, { status: 500 });
  }
}
