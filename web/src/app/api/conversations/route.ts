import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all conversations (unique users the current user has messaged with)
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: { id: true, name: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, role: true }
        },
        application: {
          select: { 
            id: true, 
            job: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by conversation partner and get the latest message for each
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUser = message.sender.id === session.user.id 
        ? message.receiver 
        : message.sender;
      
      const key = otherUser.id;
      
      if (!conversationMap.has(key) || 
          conversationMap.get(key).createdAt < message.createdAt) {
        conversationMap.set(key, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0 // Will calculate this separately
        });
      }
    });

    // Calculate unread counts for each conversation
    for (const [userId, conversation] of conversationMap.entries()) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: userId,
          receiverId: session.user.id,
          isRead: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    return NextResponse.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}