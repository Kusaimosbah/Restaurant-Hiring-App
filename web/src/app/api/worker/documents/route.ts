import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating document creation
const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  documentType: z.enum(['RESUME', 'WORK_HISTORY', 'ID_VERIFICATION', 'REFERENCE_LETTER', 'BACKGROUND_CHECK', 'OTHER']),
  filePath: z.string().min(1, "File path is required"),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/worker/documents
 * 
 * Retrieves all documents for the authenticated worker
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

    // Get all documents for this worker
    const documents = await prisma.workerDocument.findMany({
      where: { workerId: workerProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error retrieving worker documents:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker documents' }, { status: 500 });
  }
}

/**
 * POST /api/worker/documents
 * 
 * Creates a new document for the authenticated worker
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
      return NextResponse.json({ error: 'Forbidden - Only workers can create documents' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = documentSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Create the new document
    const newDocument = await prisma.workerDocument.create({
      data: {
        ...validatedData,
        workerId: workerProfile.id,
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating worker document:', error);
    return NextResponse.json({ error: 'Failed to create worker document' }, { status: 500 });
  }
}
