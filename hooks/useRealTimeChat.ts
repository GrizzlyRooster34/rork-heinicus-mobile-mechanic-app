import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getRealtimeSocket } from '@/lib/socket';
import { ChatMessage } from '@/types/service';

type RawRealtimeMessage = {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
};

const normalizeMessage = (jobId: string, message: RawRealtimeMessage): ChatMessage => ({
  id: message.id,
  serviceRequestId: jobId,
  senderId: message.senderId,
  senderName: message.senderName,
  senderType: message.senderType.toLowerCase() as ChatMessage['senderType'],
  message: message.message,
  timestamp: new Date(message.createdAt),
  isRead: message.isRead,
});

const dedupeMessages = (messages: ChatMessage[]) => {
  const seen = new Map<string, ChatMessage>();
  messages.forEach((message) => {
    seen.set(message.id, message);
  });
  return Array.from(seen.values()).sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
};

export const useRealTimeChat = (
  jobId: string | null | undefined,
  initialMessages: ChatMessage[],
  currentUserId: string
) => {
  const token = useAuthStore((state) => state.token);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!jobId || !token) {
      setIsConnected(false);
      return;
    }

    const socket = getRealtimeSocket(token);
    if (!socket) {
      return;
    }

    const joinJobRoom = () => {
      socket.emit('job:join', { jobId });
    };

    const handleConnect = () => {
      setIsConnected(true);
      joinJobRoom();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (payload: { message?: RawRealtimeMessage }) => {
      const nextMessage = payload.message;
      if (!nextMessage || nextMessage.jobId !== jobId) {
        return;
      }

      setMessages((current) => dedupeMessages([...current, normalizeMessage(jobId, nextMessage)]));
    };

    const handleReadReceipt = (payload: { messageId: string }) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === payload.messageId ? { ...message, isRead: true } : message
        )
      );
    };

    const handleTypingIndicator = (payload: { jobId: string; userId: string; isTyping: boolean }) => {
      if (payload.jobId !== jobId || payload.userId === currentUserId) {
        return;
      }

      setIsOtherUserTyping(payload.isTyping);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:read-receipt', handleReadReceipt);
    socket.on('message:typing-indicator', handleTypingIndicator);

    return () => {
      socket.emit('job:leave', { jobId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read-receipt', handleReadReceipt);
      socket.off('message:typing-indicator', handleTypingIndicator);
    };
  }, [currentUserId, jobId, token]);

  const actions = useMemo(
    () => ({
      setTyping: (isTyping: boolean) => {
        if (!jobId || !token) {
          return;
        }

        getRealtimeSocket(token)?.emit('message:typing', {
          jobId,
          isTyping,
        });
      },
    }),
    [jobId, token]
  );

  return {
    messages,
    isConnected,
    isOtherUserTyping,
    ...actions,
  };
};
