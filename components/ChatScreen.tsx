import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat, IMessage, Send, Bubble } from 'react-native-gifted-chat';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth-store';

/**
 * ChatScreen Component
 *
 * Real-time chat interface for job communication
 */

interface ChatScreenProps {
  jobId: string;
}

export function ChatScreen({ jobId }: ChatScreenProps) {
  const user = useAuthStore((state) => state.user);
  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  } = useChat(jobId);

  // Mark messages as read when screen is focused
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;

      const message = newMessages[0];
      sendMessage(message.text);
    },
    [sendMessage]
  );

  const handleInputTextChanged = useCallback(
    (text: string) => {
      if (text.length > 0) {
        sendTypingIndicator(true);
      } else {
        sendTypingIndicator(false);
      }
    },
    [sendTypingIndicator]
  );

  const renderBubble = useCallback((props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#2c2c2c',
          },
          right: {
            backgroundColor: '#2196F3',
          },
        }}
        textStyle={{
          left: {
            color: '#fff',
          },
          right: {
            color: '#fff',
          },
        }}
      />
    );
  }, []);

  const renderSend = useCallback((props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      />
    );
  }, []);

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <GiftedChat
        messages={messages}
        onSend={handleSend}
        onInputTextChanged={handleInputTextChanged}
        user={{
          _id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        isTyping={isTyping}
        placeholder="Type a message..."
        alwaysShowSend
        scrollToBottom
        inverted={true}
        timeTextStyle={{
          left: {
            color: '#aaa',
          },
          right: {
            color: '#ddd',
          },
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
