'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useChatWebSocket } from '@/hooks/useWebSocket';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: User;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
  receiver: User;
  readAt?: string;
}

export default function EnhancedMessagesPage() {
  return <EnhancedMessagesContent />;
}

function EnhancedMessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendChatMessage,
    sendTypingIndicator,
    markMessagesSeen,
    error: wsError
  } = useChatWebSocket();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadConversations();
  }, [session, status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (selectedConversation && newMessage.trim()) {
      sendTypingIndicator(selectedConversation.id, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(selectedConversation.id, false);
      }, 1000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, selectedConversation, sendTypingIndicator]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as seen
        const unseenMessages = data
          .filter((msg: Message) => msg.receiver.id === session?.user?.id && !msg.readAt)
          .map((msg: Message) => msg.id);
        
        if (unseenMessages.length > 0) {
          markMessagesSeen(unseenMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    sendTypingIndicator(selectedConversation.id, false);

    // Send via WebSocket if connected, otherwise fallback to REST
    if (isConnected) {
      const success = sendChatMessage(content, selectedConversation.id);
      if (!success) {
        // Fallback to REST API
        await sendMessageViaRest(content, selectedConversation.id);
      }
    } else {
      await sendMessageViaRest(content, selectedConversation.id);
    }
  }, [newMessage, selectedConversation, isConnected, sendChatMessage, sendTypingIndicator]);

  const sendMessageViaRest = async (content: string, receiverId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId,
          content,
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        loadConversations(); // Refresh conversations to update last message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const selectConversation = (user: User) => {
    setSelectedConversation(user);
    loadMessages(user.id);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const isUserOnline = (userId: string) => onlineUsers.has(userId);
  const isUserTyping = (userId: string) => typingUsers.has(userId);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <DashboardHeader 
          title="Messages" 
          subtitle="Communicate with team members and applicants"
        />
        
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r bg-white">
            <div className="p-4 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Connection Status */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Real-time connected' : 'Offline mode'}
                  </span>
                </div>
                {wsError && (
                  <span className="text-xs text-red-600">{wsError}</span>
                )}
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation.otherUser)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.otherUser.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserCircleIcon className="h-12 w-12 text-gray-400" />
                        {isUserOnline(conversation.otherUser.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 capitalize mb-1">
                          {conversation.otherUser.role.replace('_', ' ').toLowerCase()}
                        </p>
                        
                        {isUserTyping(conversation.otherUser.id) ? (
                          <p className="text-xs text-blue-600 italic">typing...</p>
                        ) : conversation.lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.sender.id === session?.user?.id ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">No messages yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <UserCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No conversations found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Start a conversation by applying to jobs'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        {isUserOnline(selectedConversation.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedConversation.name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {isUserTyping(selectedConversation.id) 
                            ? 'typing...' 
                            : isUserOnline(selectedConversation.id) 
                              ? 'Online' 
                              : selectedConversation.role.replace('_', ' ').toLowerCase()
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <PhoneIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <VideoCameraIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isOwn = message.sender.id === session?.user?.id;
                      const showDate = index === 0 || 
                        formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className={`text-xs ${
                                  isOwn ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.createdAt)}
                                </p>
                                {isOwn && message.readAt && (
                                  <div className="text-xs text-blue-100">✓✓</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <UserCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t p-4">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isConnected && !selectedConversation}
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="px-4"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </Button>
                  </form>
                  
                  {!isConnected && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Real-time messaging unavailable. Messages will be sent when connection is restored.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <UserCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}