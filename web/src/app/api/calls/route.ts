import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import WebRTCService from '@/lib/services/WebRTCService';
import RealTimeNotificationService from '@/lib/services/RealTimeNotificationService';
import { z } from 'zod';

// Validation schemas
const startCallSchema = z.object({
  conversationId: z.string(),
  participantIds: z.array(z.string()).min(1),
  type: z.enum(['audio', 'video', 'screen']),
  title: z.string().optional(),
});

const joinCallSchema = z.object({
  callId: z.string(),
  options: z.object({
    audio: z.boolean().default(true),
    video: z.boolean().default(false),
  }),
});

const updateCallSchema = z.object({
  status: z.enum(['connected', 'ended']).optional(),
  participantUpdate: z.object({
    isMuted: z.boolean().optional(),
    isVideoEnabled: z.boolean().optional(),
    connectionState: z.string().optional(),
  }).optional(),
});

// GET /api/calls - Get active calls for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const status = searchParams.get('status') as 'active' | 'ended' | null;

    // Build where clause
    const where: any = {
      participants: {
        some: {
          userId: session.user.id,
        },
      },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (status === 'active') {
      where.status = { in: ['calling', 'connected'] };
    } else if (status === 'ended') {
      where.status = 'ended';
    }

    // Get calls with participants
    const calls = await prisma.call.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ calls });

  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}

// POST /api/calls - Start a new call
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = startCallSchema.parse(body);

    // Verify user has access to conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.conversationId,
        participants: {
          some: { userId: session.user.id },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Check for existing active call
    const existingCall = await prisma.call.findFirst({
      where: {
        conversationId: validatedData.conversationId,
        status: { in: ['calling', 'connected'] },
      },
    });

    if (existingCall) {
      return NextResponse.json(
        { error: 'There is already an active call in this conversation' },
        { status: 409 }
      );
    }

    // Create call
    const call = await prisma.call.create({
      data: {
        conversationId: validatedData.conversationId,
        initiatorId: session.user.id,
        type: validatedData.type,
        title: validatedData.title || `${validatedData.type} call`,
        status: 'calling',
        participants: {
          create: [
            {
              userId: session.user.id,
              joinedAt: new Date(),
              status: 'connected',
              isMuted: false,
              isVideoEnabled: validatedData.type !== 'audio',
            },
            ...validatedData.participantIds.map(userId => ({
              userId,
              status: 'calling',
              isMuted: false,
              isVideoEnabled: validatedData.type !== 'audio',
            })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Send call notifications
    const notificationService = RealTimeNotificationService.getInstance();
    
    for (const participantId of validatedData.participantIds) {
      const participant = conversation.participants.find(p => p.userId === participantId);
      if (!participant) continue;

      // Send push notification
      await notificationService.sendNotification({
        userId: participantId,
        title: `Incoming ${validatedData.type} call`,
        body: `${session.user.name} is calling you`,
        type: 'call_incoming',
        data: {
          callId: call.id,
          conversationId: validatedData.conversationId,
          callType: validatedData.type,
          initiatorName: session.user.name,
        },
        channels: ['push', 'in-app'],
      });

      // Send real-time notification via WebSocket
      const wsService = WebSocketService.getInstance();
      wsService.notifyUser(participantId, 'call:incoming', {
        call,
        initiator: {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
      });
    }

    return NextResponse.json({ call }, { status: 201 });

  } catch (error) {
    console.error('Error starting call:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    );
  }
}

// PUT /api/calls/[id] - Update call status or participant info
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callId = params.id;
    const body = await request.json();
    const validatedData = updateCallSchema.parse(body);

    // Check if user is a participant
    const callParticipant = await prisma.callParticipant.findFirst({
      where: {
        callId,
        userId: session.user.id,
      },
      include: {
        call: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!callParticipant) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    // Update call status
    if (validatedData.status) {
      const updateData: any = { status: validatedData.status };
      
      if (validatedData.status === 'ended') {
        updateData.endedAt = new Date();
        
        // Calculate duration
        const startTime = callParticipant.call.createdAt;
        const endTime = new Date();
        updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      }

      await prisma.call.update({
        where: { id: callId },
        data: updateData,
      });

      // Update all participants status to ended
      if (validatedData.status === 'ended') {
        await prisma.callParticipant.updateMany({
          where: { callId },
          data: { 
            status: 'ended',
            leftAt: new Date(),
          },
        });
      }
    }

    // Update participant info
    if (validatedData.participantUpdate) {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: session.user.id,
          },
        },
        data: validatedData.participantUpdate,
      });
    }

    // Get updated call
    const updatedCall = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Notify other participants via WebSocket
    const wsService = WebSocketService.getInstance();
    
    if (validatedData.status === 'ended') {
      // Notify all participants that call ended
      callParticipant.call.participants.forEach(participant => {
        if (participant.userId !== session.user.id) {
          wsService.notifyUser(participant.userId, 'call:ended', {
            callId,
            endedBy: session.user.id,
          });
        }
      });
    } else if (validatedData.participantUpdate) {
      // Notify participant status update
      callParticipant.call.participants.forEach(participant => {
        if (participant.userId !== session.user.id) {
          wsService.notifyUser(participant.userId, 'call:participant-updated', {
            callId,
            participantId: session.user.id,
            updates: validatedData.participantUpdate,
          });
        }
      });
    }

    return NextResponse.json({ call: updatedCall });

  } catch (error) {
    console.error('Error updating call:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update call' },
      { status: 500 }
    );
  }
}

// POST /api/calls/[id]/join - Join an existing call
export async function POST(
  request: NextRequest,
  { params, url }: { params: { id: string }; url: string }
) {
  // Only handle join endpoint
  if (!url.includes('/join')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callId = params.id;
    const body = await request.json();
    const validatedData = joinCallSchema.parse(body);

    // Check if user is invited to this call
    const callParticipant = await prisma.callParticipant.findFirst({
      where: {
        callId,
        userId: session.user.id,
      },
      include: {
        call: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!callParticipant) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    if (callParticipant.call.status === 'ended') {
      return NextResponse.json(
        { error: 'This call has already ended' },
        { status: 410 }
      );
    }

    // Update participant status
    await prisma.callParticipant.update({
      where: {
        callId_userId: {
          callId,
          userId: session.user.id,
        },
      },
      data: {
        status: 'connected',
        joinedAt: new Date(),
        isMuted: !validatedData.options.audio,
        isVideoEnabled: validatedData.options.video,
      },
    });

    // Update call status to connected if it was calling
    if (callParticipant.call.status === 'calling') {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'connected' },
      });
    }

    // Get updated call
    const updatedCall = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Notify other participants via WebSocket
    const wsService = WebSocketService.getInstance();
    callParticipant.call.participants.forEach(participant => {
      if (participant.userId !== session.user.id) {
        wsService.notifyUser(participant.userId, 'call:participant-joined', {
          callId,
          participant: {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image,
          },
        });
      }
    });

    return NextResponse.json({ call: updatedCall });

  } catch (error) {
    console.error('Error joining call:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join call' },
      { status: 500 }
    );
  }
}