import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth-store';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ChatMessage {
  id: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachments: string[];
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: Date;
}

interface RealTimeChatWidgetProps {
  jobId: string;
  visible: boolean;
  onClose: () => void;
}

export function RealTimeChatWidget({ jobId, visible, onClose }: RealTimeChatWidgetProps) {
  const { user } = useAuthStore();
  const {
    connected,
    messages,
    error,
    joinJob,
    leaveJob,
    sendMessage
  } = useWebSocket();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && jobId) {
      joinJob(jobId);
    }
    return () => {
      if (jobId) {
        leaveJob(jobId);
      }
    };
  }, [visible, jobId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && connected) {
      sendMessage(jobId, inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload the image first
      const imageUri = result.assets[0].uri;
      sendMessage(jobId, 'Image sent', 'IMAGE', [imageUri]);
    }
  };

  const handleCameraPicker = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload the image first
      const imageUri = result.assets[0].uri;
      sendMessage(jobId, 'Image sent', 'IMAGE', [imageUri]);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Send Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCameraPicker },
        { text: 'Gallery', onPress: handleImagePicker },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender.id === user?.id;
    const messageTime = format(new Date(item.createdAt), 'HH:mm');

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>
            {item.sender.firstName} {item.sender.lastName}
          </Text>
        )}
        
        {item.messageType === 'IMAGE' && item.attachments.length > 0 ? (
          <View>
            <Image source={{ uri: item.attachments[0] }} style={styles.messageImage} />
            {item.message !== 'Image sent' && (
              <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                {item.message}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
            {item.message}
          </Text>
        )}
        
        <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
          {messageTime}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Live Chat</Text>
            <View style={styles.connectionStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: connected ? Colors.success : Colors.error }
              ]} />
              <Text style={styles.statusText}>
                {connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          />

          {/* Typing indicator */}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>Someone is typing...</Text>
            </View>
          )}

          {/* Input area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={showImageOptions} style={styles.imageButton}>
              <Ionicons name="camera" size={24} color={Colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              onPress={handleSendMessage}
              style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
              disabled={!inputMessage.trim() || !connected}
            >
              <Ionicons name="send" size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: Colors.background,
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  senderName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.background,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.background,
    opacity: 0.7,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imageButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
});

export default RealTimeChatWidget;