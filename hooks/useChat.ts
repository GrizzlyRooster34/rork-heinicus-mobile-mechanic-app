import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '@/lib/websocket';
import { trpcClient } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Message interface compatible with GiftedChat
 */
export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

/**
 * useChat Hook
 *
 * Manages real-time chat for a job
 */
export function useChat(jobId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load message history
   */
  const loadMessages = useCallback(async () => {
    if (!jobId || !userId) return;

    setIsLoading(true);

    try {
      const result = await trpcClient.messages.getJobMessages.query({
        jobId,
        userId,
        limit: 50,
      });

      if (result.success && result.messages) {
        // Convert to GiftedChat format
        const chatMessages: ChatMessage[] = result.messages.map((msg: any) => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.sender.id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
          },
          ...(msg.mediaUrl && { image: msg.mediaUrl }),
          sent: true,
          received: msg.read,
        }));

        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, userId]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    (text: string, mediaUrl?: string) => {
      if (!jobId || !userId || !user) return;

      const tempId = `temp-${Date.now()}`;

      // Optimistically add message
      const newMessage: ChatMessage = {
        _id: tempId,
        text,
        createdAt: new Date(),
        user: {
          _id: userId,
          name: `${user.firstName} ${user.lastName}`,
        },
        ...(mediaUrl && { image: mediaUrl }),
        pending: true,
      };

      setMessages((prev) => [newMessage, ...prev]);

      // Send via WebSocket
      wsClient.getSocket()?.emit('message:send', {
        jobId,
        content: text,
        type: mediaUrl ? 'IMAGE' : 'TEXT',
        mediaUrl,
      });
    },
    [jobId, userId, user]
  );

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!jobId) return;

      wsClient.getSocket()?.emit('message:typing', {
        jobId,
        isTyping,
      });

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          wsClient.getSocket()?.emit('message:typing', {
            jobId,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [jobId]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    if (!jobId || !userId) return;

    try {
      await trpcClient.messages.markJobMessagesAsRead.mutate({
        jobId,
        userId,
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          received: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [jobId, userId]);

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    if (!jobId || !userId) return;

    try {
      const result = await trpcClient.messages.getUnreadCount.query({
        jobId,
        userId,
      });

      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [jobId, userId]);

  // Load messages on mount
  useEffect(() => {
    if (jobId) {
      loadMessages();
      loadUnreadCount();
    }
  }, [jobId, loadMessages, loadUnreadCount]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!jobId) return;

    const socket = wsClient.getSocket();
    if (!socket) return;

    // New message handler
    const handleNewMessage = (data: any) => {
      const { message } = data;

      if (message.jobId !== jobId) return;

      const chatMessage: ChatMessage = {
        _id: message.id,
        text: message.content,
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.sender.id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
        },
        ...(message.mediaUrl && { image: message.mediaUrl }),
        sent: true,
        received: false,
      };

      setMessages((prev) => {
        // Remove temporary message if exists
        const filtered = prev.filter((msg) => !msg.pending);
        return [chatMessage, ...filtered];
      });

      // If message is from other user, increment unread count
      if (message.senderId !== userId) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Typing indicator handler
    const handleTypingIndicator = (data: any) => {
      if (data.jobId !== jobId) return;
      if (data.userId === userId) return; // Don't show own typing

      setIsTyping(data.isTyping);
    };

    // Read receipt handler
    const handleReadReceipt = (data: any) => {
      const { messageId } = data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, received: true } : msg
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing-indicator', handleTypingIndicator);
    socket.on('message:read-receipt', handleReadReceipt);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing-indicator', handleTypingIndicator);
      socket.off('message:read-receipt', handleReadReceipt);
    };
  }, [jobId, userId]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    unreadCount,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    loadMessages,
  };
}
