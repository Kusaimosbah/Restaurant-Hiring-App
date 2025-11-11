import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Conversations API Endpoint
 * GET /api/chat/conversations - Get user's conversations
 * POST /api/chat/conversations - Create new conversation
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's conversations
    const conversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            },
            lastMessage: {
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                restaurant: {
                  select: {
                    name: true
                  }
                }
              }
            },
            application: {
              select: {
                id: true,
                status: true
              }
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: session.user.id }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc'
        }
      },
      take: limit,
      skip: offset
    });

    const formattedConversations = conversations.map(cp => ({
      id: cp.conversation.id,
      title: cp.conversation.title,
      type: cp.conversation.type,
      isGroup: cp.conversation.isGroup,
      createdAt: cp.conversation.createdAt,
      lastMessageAt: cp.conversation.lastMessageAt,
      lastMessage: cp.conversation.lastMessage ? {
        id: cp.conversation.lastMessage.id,
        content: cp.conversation.lastMessage.content,
        messageType: cp.conversation.lastMessage.messageType,
        createdAt: cp.conversation.lastMessage.createdAt,
        sender: cp.conversation.lastMessage.sender
      } : null,
      participants: cp.conversation.participants.map(p => ({
        userId: p.user.id,
        name: p.user.name,
        email: p.user.email,
        role: p.user.role,
        conversationRole: p.role,
        joinedAt: p.joinedAt
      })),
      job: cp.conversation.job,
      application: cp.conversation.application,
      unreadCount: cp.conversation._count.messages,
      userRole: cp.role
    }));

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      participantIds, 
      title, 
      type = 'DIRECT',
      jobId,
      applicationId 
    } = body;

    // Validate required fields
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Participant IDs are required' },
        { status: 400 }
      );
    }

    // Add current user to participants if not already included
    const allParticipantIds = [...new Set([...participantIds, session.user.id])];

    // Check if conversation already exists for direct messages
    if (type === 'DIRECT' && allParticipantIds.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          isGroup: false,
          participants: {
            every: {
              userId: { in: allParticipantIds }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return NextResponse.json({
          success: true,
          conversation: {
            id: existingConversation.id,
            title: existingConversation.title,
            type: existingConversation.type,
            isGroup: existingConversation.isGroup,
            createdAt: existingConversation.createdAt,
            participants: existingConversation.participants.map(p => ({
              userId: p.user.id,
              name: p.user.name,
              email: p.user.email,
              role: p.user.role,
              conversationRole: p.role,
              joinedAt: p.joinedAt
            }))
          },
          isExisting: true
        });
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: title || (type === 'DIRECT' ? null : 'Group Chat'),
        type,
        isGroup: allParticipantIds.length > 2,
        jobId,
        applicationId,
        createdBy: session.user.id,
        participants: {
          create: allParticipantIds.map((userId, index) => ({
            userId,
            role: userId === session.user.id ? 'ADMIN' : 'MEMBER',
            joinedAt: new Date()
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            restaurant: {
              select: {
                name: true
              }
            }
          }
        },
        application: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Send system message for group creation
    if (conversation.isGroup) {
      await prisma.message.create({
        data: {
          content: `${session.user.name} created the group`,
          messageType: 'SYSTEM',
          senderId: session.user.id,
          conversationId: conversation.id,
          isRead: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        type: conversation.type,
        isGroup: conversation.isGroup,
        createdAt: conversation.createdAt,
        participants: conversation.participants.map(p => ({
          userId: p.user.id,
          name: p.user.name,
          email: p.user.email,
          role: p.user.role,
          conversationRole: p.role,
          joinedAt: p.joinedAt
        })),
        job: conversation.job,
        application: conversation.application
      },
      isExisting: false
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}