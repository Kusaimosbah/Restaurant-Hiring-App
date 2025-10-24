import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/worker/profile/upload
 * 
 * Uploads a profile picture for the authenticated worker
 * This is a simplified version that simulates file upload and returns a URL
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
      return NextResponse.json({ error: 'Forbidden - Only workers can upload profile pictures' }, { status: 403 });
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed' 
      }, { status: 400 });
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB' 
      }, { status: 400 });
    }

    // Use a real placeholder image that will actually load in the browser
    // In a production app, you would upload to a real storage service
    
    // Generate a unique identifier for the image
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Create a placeholder image URL that will actually work
    const profilePictureUrl = `https://picsum.photos/seed/${timestamp}-${randomId}/300/300`;

    return NextResponse.json({ 
      url: profilePictureUrl,
      name: file.name,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
}
