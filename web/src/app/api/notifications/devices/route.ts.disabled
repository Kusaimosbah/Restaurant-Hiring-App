import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for device registration
const deviceSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.string().refine(val => ['ios', 'android', 'web'].includes(val), {
    message: "Platform must be 'ios', 'android', or 'web'"
  })
});

/**
 * GET /api/notifications/devices
 * Get all registered devices for the current user
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const devices = await prisma.notificationDevice.findMany({
      where: { userId: session.user.id }
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error('Error fetching notification devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/devices
 * Register a new device for push notifications
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, platform } = deviceSchema.parse(body);

    // Check if device already exists
    const existingDevice = await prisma.notificationDevice.findFirst({
      where: { token }
    });

    if (existingDevice) {
      // If device exists but belongs to another user, update it
      if (existingDevice.userId !== session.user.id) {
        const updatedDevice = await prisma.notificationDevice.update({
          where: { id: existingDevice.id },
          data: { userId: session.user.id }
        });
        return NextResponse.json(updatedDevice);
      }
      
      // Device already registered to this user
      return NextResponse.json(existingDevice);
    }

    // Create new device registration
    const device = await prisma.notificationDevice.create({
      data: {
        userId: session.user.id,
        token,
        platform
      }
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error registering notification device:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/devices
 * Unregister a device
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Delete the device
    await prisma.notificationDevice.deleteMany({
      where: {
        token,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    console.error('Error unregistering notification device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
