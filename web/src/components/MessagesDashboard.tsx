import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatInterface, { ChatModal } from './ChatInterface';

/**
 * Messages Dashboard Component
 * Displays user conversations and provides chat interface
 */

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export default function MessagesDashboard() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load contacts and conversations
  useEffect(() => {
    if (session?.user) {
      loadContacts();
    }
  }, [session]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      // For now, we'll get contacts from applications and recent messages
      const [applicationsRes, messagesRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/messages')
      ]);

      const contacts: Contact[] = [];
      const contactMap = new Map<string, Contact>();

      // Add contacts from applications (if user is restaurant owner)
      if (applicationsRes.ok && session?.user?.role === 'RESTAURANT_OWNER') {
        const applicationsData = await applicationsRes.json();
        const applications = applicationsData.applications || [];

        applications.forEach((app: any) => {
          if (app.worker?.user && !contactMap.has(app.worker.user.id)) {
            contactMap.set(app.worker.user.id, {
              id: app.worker.user.id,
              name: app.worker.user.name,
              email: app.worker.user.email,
              role: app.worker.user.role,
              unreadCount: 0
            });
          }
        });
      }

      // Add contacts from messages
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const messages = messagesData.messages || [];

        messages.forEach((message: any) => {
          const otherUserId = message.senderId === session?.user?.id ? message.recipientId : message.senderId;
          const otherUser = message.senderId === session?.user?.id ? message.recipient : message.sender;

          if (otherUser && !contactMap.has(otherUserId)) {
            contactMap.set(otherUserId, {
              id: otherUserId,
              name: otherUser.name,
              email: otherUser.email,
              role: otherUser.role || 'USER',
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId
              },
              unreadCount: message.senderId !== session?.user?.id ? 1 : 0
            });
          } else if (contactMap.has(otherUserId)) {
            const contact = contactMap.get(otherUserId)!;
            if (!contact.lastMessage || new Date(message.createdAt) > new Date(contact.lastMessage.createdAt)) {
              contact.lastMessage = {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId
              };
            }
            if (message.senderId !== session?.user?.id) {
              contact.unreadCount++;
            }
          }
        });
      }

      setContacts(Array.from(contactMap.values()));

    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
    setSelectedContact(null);
    // Refresh contacts to update unread counts
    loadContacts();
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'RESTAURANT_OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'WORKER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Connect with employers and job applicants
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {contacts.reduce((sum, contact) => sum + contact.unreadCount, 0)} unread messages
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contacts List */}
          {filteredContacts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {session?.user?.role === 'RESTAURANT_OWNER' 
                  ? 'Start conversations with job applicants'
                  : 'Apply to jobs to start conversations with employers'
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {contact.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatLastMessageTime(contact.lastMessage.createdAt)}
                              </span>
                            )}
                            {contact.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(contact.role)}`}>
                              {contact.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {contact.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {contact.lastMessage.senderId === session?.user?.id ? 'You: ' : ''}
                            {contact.lastMessage.content}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {selectedContact && (
        <ChatModal
          isOpen={showChatModal}
          recipientId={selectedContact.id}
          recipientName={selectedContact.name}
          onClose={handleCloseChat}
        />
      )}
    </>
  );
}