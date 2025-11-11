import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  Surface,
  Card,
  Chip,
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { OfflineService } from '../../services/OfflineService';
import { theme } from '../../config/theme';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isDelivered: boolean;
  isRead: boolean;
}

interface ChatParticipant {
  id: string;
  name: string;
  userType: 'WORKER' | 'EMPLOYER';
  avatar?: string;
  isOnline: boolean;
}

const ChatScreen = ({ route, navigation }: any) => {
  const { chatId, participant } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    setupOfflineListener();
    
    // Set up typing indicators and real-time updates
    // In a real app, this would connect to WebSocket
    
    return () => {
      // Cleanup listeners
    };
  }, [chatId]);

  const setupOfflineListener = () => {
    const removeListener = OfflineService.addNetworkListener((online) => {
      setIsOnline(online);
      if (online) {
        syncOfflineMessages();
      }
    });

    return removeListener;
  };

  const loadMessages = async () => {
    try {
      if (OfflineService.isOnlineStatus()) {
        await loadOnlineMessages();
      } else {
        await loadOfflineMessages();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      await loadOfflineMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnlineMessages = async () => {
    // Simulate API call - replace with actual API integration
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hi! I saw your application for the server position. Your experience looks great!',
        senderId: participant.id,
        senderName: participant.name,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'text',
        isDelivered: true,
        isRead: true,
      },
      {
        id: '2',
        text: 'Thank you! I\'m very interested in the position. When would be a good time for an interview?',
        senderId: user?.id || '',
        senderName: user?.name || '',
        timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
        type: 'text',
        isDelivered: true,
        isRead: true,
      },
      {
        id: '3',
        text: 'How about tomorrow at 2 PM? We can do a video call first.',
        senderId: participant.id,
        senderName: participant.name,
        timestamp: new Date(Date.now() - 3400000), // 56 minutes ago
        type: 'text',
        isDelivered: true,
        isRead: true,
      },
      {
        id: '4',
        text: 'Perfect! I\'ll be ready. Should I prepare anything specific?',
        senderId: user?.id || '',
        senderName: user?.name || '',
        timestamp: new Date(Date.now() - 3300000), // 55 minutes ago
        type: 'text',
        isDelivered: true,
        isRead: false,
      },
    ];

    setMessages(mockMessages);
    
    // Cache messages for offline use
    await OfflineService.cacheMessagesData(mockMessages);
  };

  const loadOfflineMessages = async () => {
    const cachedMessages = await OfflineService.getCachedMessages();
    // Filter messages for this chat
    const chatMessages = cachedMessages.filter((msg: Message) => 
      msg.senderId === participant.id || msg.senderId === user?.id
    );
    setMessages(chatMessages);
  };

  const syncOfflineMessages = async () => {
    // Sync any pending messages when back online
    try {
      const actions = await OfflineService.getOfflineActions();
      const messageActions = actions.filter(action => action.type === 'SEND_MESSAGE');
      
      for (const action of messageActions) {
        // In a real app, this would send the message to the server
        console.log('Syncing offline message:', action.data);
      }
    } catch (error) {
      console.error('Error syncing offline messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: Message = {
      id: messageId,
      text: newMessage.trim(),
      senderId: user?.id || '',
      senderName: user?.name || '',
      timestamp: new Date(),
      type: 'text',
      isDelivered: isOnline,
      isRead: false,
    };

    // Add message to local state immediately
    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      if (isOnline) {
        // Send message via API
        // await ChatService.sendMessage(chatId, message);
        console.log('Sending message online:', message);
      } else {
        // Store for offline sync
        await OfflineService.storeOfflineAction({
          type: 'SEND_MESSAGE',
          endpoint: `/chats/${chatId}/messages`,
          method: 'POST',
          data: message,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. It will be sent when you\'re back online.');
    }
  };

  const handleAttachFile = () => {
    // Implement file attachment
    Alert.alert('File Attachment', 'File attachment feature coming soon!');
  };

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours >= 24) {
      return timestamp.toLocaleDateString();
    } else if (hours >= 1) {
      return `${hours}h ago`;
    } else if (minutes >= 1) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMyMessage = message.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Avatar.Text
            size={32}
            label={message.senderName.substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(message.timestamp)}
            </Text>
            
            {isMyMessage && (
              <View style={styles.messageStatus}>
                {message.isDelivered ? (
                  message.isRead ? (
                    <Text style={styles.readStatus}>✓✓</Text>
                  ) : (
                    <Text style={styles.deliveredStatus}>✓</Text>
                  )
                ) : (
                  <Text style={styles.pendingStatus}>⏰</Text>
                )}
              </View>
            )}
          </View>
        </View>
        
        {isMyMessage && (
          <Avatar.Text
            size={32}
            label={(user?.name || 'You').substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={40}
            label={participant.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.participantStatus}>
              {participant.isOnline ? 'Online' : 'Last seen recently'}
            </Text>
          </View>
        </View>
        
        {!isOnline && (
          <Chip
            icon="wifi-off"
            mode="outlined"
            style={styles.offlineChip}
            textStyle={styles.offlineText}
          >
            Offline
          </Chip>
        )}
      </Surface>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{participant.name} is typing...</Text>
        </View>
      )}

      {/* Message Input */}
      <Surface style={styles.inputContainer}>
        <IconButton
          icon="attachment"
          size={24}
          onPress={handleAttachFile}
          style={styles.attachButton}
        />
        
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          outlineStyle={styles.textInputOutline}
        />
        
        <IconButton
          icon="send"
          size={24}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          style={[
            styles.sendButton,
            { backgroundColor: newMessage.trim() ? theme.colors.primary : theme.colors.outline }
          ]}
          iconColor={newMessage.trim() ? '#fff' : theme.colors.onSurface}
        />
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: theme.elevation.small,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  participantStatus: {
    fontSize: 14,
    color: theme.colors.outline,
  },
  offlineChip: {
    backgroundColor: theme.colors.warning,
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: theme.spacing.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginHorizontal: theme.spacing.xs,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    elevation: theme.elevation.small,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: theme.colors.onSurface,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: theme.colors.outline,
  },
  messageStatus: {
    marginLeft: theme.spacing.xs,
  },
  readStatus: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  deliveredStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  pendingStatus: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  typingContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.outline,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    elevation: theme.elevation.medium,
  },
  attachButton: {
    margin: 0,
  },
  textInput: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
    maxHeight: 100,
  },
  textInputContent: {
    paddingVertical: theme.spacing.sm,
  },
  textInputOutline: {
    borderRadius: theme.borderRadius.large,
  },
  sendButton: {
    margin: 0,
    borderRadius: 25,
  },
});

export default ChatScreen;