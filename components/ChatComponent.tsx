import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Icons from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { ChatMessage } from '@/types/service';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';

interface ChatComponentProps {
  serviceRequestId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserType: 'customer' | 'mechanic';
}

export function ChatComponent({
  serviceRequestId,
  currentUserId,
  currentUserName,
  currentUserType,
}: ChatComponentProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const utils = trpc.useUtils();
  const chatQuery = trpc.chat.listByJob.useQuery(
    { jobId: serviceRequestId },
    {
      enabled: Boolean(serviceRequestId),
    }
  );
  const sendMessageMutation = trpc.chat.send.useMutation();
  const markReadMutation = trpc.chat.markRead.useMutation();

  const messages = useMemo<ChatMessage[]>(
    () =>
      (chatQuery.data?.messages ?? []).map((message) => ({
        id: message.id,
        serviceRequestId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderType: message.senderType.toLowerCase() as ChatMessage['senderType'],
        message: message.message,
        timestamp: message.createdAt,
        isRead: message.isRead,
      })),
    [chatQuery.data?.messages, serviceRequestId]
  );
  const { messages: liveMessages, isConnected, isOtherUserTyping, setTyping } = useRealTimeChat(
    serviceRequestId,
    messages,
    currentUserId
  );

  useEffect(() => {
    const hasUnreadMessagesFromOthers = liveMessages.some(
      (message) => !message.isRead && message.senderId !== currentUserId
    );

    if (!hasUnreadMessagesFromOthers || markReadMutation.isPending) {
      return;
    }

    markReadMutation.mutate(
      { jobId: serviceRequestId },
      {
        onSuccess: () => {
          void utils.chat.listByJob.invalidate({ jobId: serviceRequestId });
        },
      }
    );
  }, [currentUserId, liveMessages, markReadMutation, serviceRequestId, utils.chat.listByJob]);

  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || sendMessageMutation.isPending) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        jobId: serviceRequestId,
        message: trimmedMessage,
      });

      setNewMessage('');
      setTyping(false);
      await utils.chat.listByJob.invalidate({ jobId: serviceRequestId });

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Message Failed', 'Unable to send message. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const isMyMessage = (message: ChatMessage) => message.senderId === currentUserId;
  const headerTitle = currentUserType === 'mechanic' ? 'Chat with Customer' : 'Chat with Mechanic';
  const placeholder = currentUserName ? `Message as ${currentUserName}` : 'Type a message...';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Icons.MessageCircle size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      {chatQuery.isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.emptyStateText}>Loading messages...</Text>
        </View>
      ) : chatQuery.error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Unable to load chat messages.</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {liveMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet. Start the conversation.</Text>
            </View>
          ) : (
            liveMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isMyMessage(message) ? styles.myMessageWrapper : styles.otherMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMyMessage(message) ? styles.myMessage : styles.otherMessage,
                  ]}
                >
                  {!isMyMessage(message) && <Text style={styles.senderName}>{message.senderName}</Text>}
                  <Text
                    style={[
                      styles.messageText,
                      isMyMessage(message) ? styles.myMessageText : styles.otherMessageText,
                    ]}
                  >
                    {message.message}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isMyMessage(message) ? styles.myMessageTime : styles.otherMessageTime,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          )}
          {isOtherUserTyping && (
            <View style={styles.typingRow}>
              <Icons.Ellipsis size={16} color={Colors.textMuted} />
              <Text style={styles.typingText}>Typing...</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={(value) => {
            setNewMessage(value);
            setTyping(value.trim().length > 0);
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          <Icons.Send
            size={20}
            color={(!newMessage.trim() || sendMessageMutation.isPending) ? Colors.textMuted : Colors.white}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.connectionStatus}>
        <Icons.Radio size={10} color={isConnected ? Colors.success : Colors.textMuted} />
        <Text style={styles.connectionStatusText}>
          {isConnected ? 'Realtime connected' : 'Realtime reconnecting'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.black,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.black,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
    gap: 12,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 12,
    backgroundColor: Colors.card,
  },
  connectionStatusText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
