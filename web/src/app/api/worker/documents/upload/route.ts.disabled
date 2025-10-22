import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/worker/documents/upload
 * 
 * Uploads a document file for the authenticated worker
 * This is a simplified version that simulates file upload and returns a URL
 * In a production environment, this would handle actual file uploads to a storage service
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
      return NextResponse.json({ error: 'Forbidden - Only workers can upload documents' }, { status: 403 });
    }

    // In a real implementation, we would:
    // 1. Parse the multipart form data to get the file
    // 2. Validate the file type and size
    // 3. Upload the file to a storage service (e.g., S3, Firebase Storage)
    // 4. Return the URL of the uploaded file

    // For this simplified version, we'll simulate the upload and return a fake URL
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed' 
      }, { status: 400 });
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    // Generate a fake URL with the original filename
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const documentUrl = `https://example.com/documents/${session.user.id}/${timestamp}-${fileName}`;

    return NextResponse.json({ 
      url: documentUrl,
      name: file.name,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
