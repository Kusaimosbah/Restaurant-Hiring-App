import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const fileType: string | null = data.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file found' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      'resume': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'cover-letter': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'profile-picture': ['image/jpeg', 'image/png', 'image/webp'],
      'document': ['application/pdf', 'image/jpeg', 'image/png']
    };

    const validType = fileType && allowedTypes[fileType as keyof typeof allowedTypes];
    if (!validType || !validType.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types for ${fileType}: ${validType ? validType.join(', ') : 'none'}` 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${session.user.id}_${fileType}_${timestamp}.${fileExtension}`;
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileType || 'general');
    const path = join(uploadDir, fileName);

    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file
    await writeFile(path, buffer);

    // Return file URL
    const fileUrl = `/uploads/${fileType || 'general'}/${fileName}`;

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL required' }, { status: 400 });
    }

    // Validate that user owns this file
    if (!fileUrl.includes(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    const filePath = join(process.cwd(), 'public', fileUrl);
    const fs = require('fs');

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ message: 'File deleted successfully' });
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}