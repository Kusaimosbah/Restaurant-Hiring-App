import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating document updates
const documentUpdateSchema = z.object({
  name: z.string().min(1, "Document name is required").optional(),
  documentType: z.enum(['RESUME', 'WORK_HISTORY', 'ID_VERIFICATION', 'REFERENCE_LETTER', 'BACKGROUND_CHECK', 'OTHER']).optional(),
  filePath: z.string().min(1, "File path is required").optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/worker/documents/[id]
 * 
 * Retrieves a specific document for the authenticated worker
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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

    // Get the document and ensure it belongs to this worker
    const document = await prisma.workerDocument.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error retrieving worker document:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker document' }, { status: 500 });
  }
}

/**
 * PUT /api/worker/documents/[id]
 * 
 * Updates a specific document for the authenticated worker
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can update documents' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = documentUpdateSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the document exists and belongs to this worker
    const existingDocument = await prisma.workerDocument.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update the document
    const updatedDocument = await prisma.workerDocument.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating worker document:', error);
    return NextResponse.json({ error: 'Failed to update worker document' }, { status: 500 });
  }
}

/**
 * DELETE /api/worker/documents/[id]
 * 
 * Deletes a specific document for the authenticated worker
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can delete documents' }, { status: 403 });
    }

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the document exists and belongs to this worker
    const existingDocument = await prisma.workerDocument.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    await prisma.workerDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker document:', error);
    return NextResponse.json({ error: 'Failed to delete worker document' }, { status: 500 });
  }
}
