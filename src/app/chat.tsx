import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  ChatSession,
  Message,
  createNewSession,
  fetchChatSessions,
  fetchMessages,
  saveMessage,
} from '../ai/chat_service';
import { useSpinAnimation } from '../ai/hooks/useSpinAnimation';
import { getRAGResponse } from '../ai/rag_service';
import { useAuthStore } from '../store';
import { Colors } from '../utlis/color';

export default function ChatScreen() {
  const router = useRouter();
  const { subjectid } = useLocalSearchParams<{ subjectid: string }>();
  const { user, subjects } = useAuthStore();

  // Find subject details
  const subject = subjects.find((s) => s.subjectid === subjectid);

  // Core States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sidebar Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Animation references
  const spin = useSpinAnimation(isProcessing);
  const drawerTranslation = useRef(new Animated.Value(280)).current;
  const flatListRef = useRef<FlatList<Message>>(null);

  // Fetch all chat sessions for this subject
  useEffect(() => {
    if (!subjectid) return;
    loadSessions();
  }, [subjectid]);

  // Handle active session change
  useEffect(() => {
    if (!activeSession || !subjectid) return;
    loadMessages(activeSession.sessionId);
  }, [activeSession]);

  const loadSessions = async (selectLatest = true) => {
    if (!subjectid) return;
    setLoading(true);
    try {
      const fetchedSessions = await fetchChatSessions(subjectid);
      setSessions(fetchedSessions);

      if (fetchedSessions.length > 0) {
        if (selectLatest) {
          setActiveSession(fetchedSessions[0]);
        }
      } else {
        // Automatically create a first chat session if empty
        const defaultSession = await createNewSession(subjectid, 'First Discussion');
        setSessions([defaultSession]);
        setActiveSession(defaultSession);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    if (!subjectid) return;
    try {
      const fetchedMessages = await fetchMessages(subjectid, sessionId);
      setMessages(fetchedMessages);
      setTimeout(scrollToBottom, 200);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleCreateNewSession = async () => {
    if (!subjectid) return;
    try {
      const title = `Chat Session ${sessions.length + 1}`;
      const newSession = await createNewSession(subjectid, title);
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Error creating new session:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeSession || !user || !subjectid || isProcessing) return;

    const currentText = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    const userMessage: Omit<Message, 'messageId' | 'createdAt'> = {
      senderId: user.uid,
      senderType: 'user',
      message: currentText,
    };

    // Optimistically update local message list
    const tempUserMsg: Message = {
      messageId: Date.now().toString(),
      senderId: user.uid,
      senderType: 'user',
      message: currentText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      // 1. Save user message in Firestore
      await saveMessage(subjectid, activeSession.sessionId, userMessage);

      // 2. Prepare Gemini history formatting
      const historyFormatted = messages.map((m) => ({
        role: m.senderType === 'user' ? ('user' as const) : ('model' as const),
        parts: [m.message],
      }));

      // 3. Trigger RAG + Gemini generation
      const replyText = await getRAGResponse(currentText, subjectid, historyFormatted);

      // 4. Save AI Response
      const assistantMessage: Omit<Message, 'messageId' | 'createdAt'> = {
        senderId: 'ai-assistant',
        senderType: 'assistant',
        message: replyText,
      };
      const responseId = await saveMessage(subjectid, activeSession.sessionId, assistantMessage);

      // Add to state
      const tempAiMsg: Message = {
        messageId: responseId,
        senderId: 'ai-assistant',
        senderType: 'assistant',
        message: replyText,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempAiMsg]);
    } catch (err: any) {
      console.error('Error completing AI turn:', err);
      // Insert fallback error bubble
      const errorMsg: Message = {
        messageId: Date.now().toString(),
        senderId: 'system',
        senderType: 'assistant',
        message: 'Sorry, I encountered a connection issue. Please verify your connection and try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prevState) => {
      const newState = !prevState;
      const toValue = newState ? 0 : 280;
      Animated.timing(drawerTranslation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return newState;
    });
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.senderType === 'user';
    const isSystemError = item.senderId === 'system';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.avatarWrapper}>
            <Ionicons name="sparkles" size={14} color={Colors.white} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isSystemError && styles.errorBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.userTime : styles.aiTime]}>
            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!subject) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Feather name="alert-triangle" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Subject not found</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonLargeText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={Colors.primary} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {subject.subjectname}
              </Text>
              <Text style={styles.headerSubtitle}>AI Study Assistant</Text>
            </View>

            <TouchableOpacity style={styles.headerButton} onPress={toggleDrawer}>
              <Feather name="menu" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Syncing session history...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.messageId}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listContent}
              maxToRenderPerBatch={10}
              windowSize={5}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>Ask anything about your study notes</Text>
                  <Text style={styles.emptySub}>
                    Ask questions, query formulas, or request summaries matching resources.
                  </Text>
                </View>
              }
            />
          )}

          {/* AI Generating Indicator */}
          {isProcessing && (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.typingText}>Gemini is typing...</Text>
            </View>
          )}

          {/* Action Bar Input - fixed at bottom */}
          <View style={styles.actionBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask the AI Tutor..."
              placeholderTextColor={Colors.inputPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Sidebar Drawer Overlay */}
      {isDrawerOpen && (
        <TouchableOpacity style={styles.drawerBackdrop} onPress={toggleDrawer} activeOpacity={1} />
      )}

      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslation }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Conversations</Text>
          <TouchableOpacity onPress={toggleDrawer}>
            <Feather name="x" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.newChatButton} onPress={handleCreateNewSession}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId}
          renderItem={({ item }) => {
            const isActive = activeSession?.sessionId === item.sessionId;
            return (
              <TouchableOpacity
                style={[styles.sessionItem, isActive && styles.sessionItemActive]}
                onPress={() => {
                  setActiveSession(item);
                  toggleDrawer();
                }}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={isActive ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[styles.sessionText, isActive && styles.sessionTextActive]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.drawerList}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonLargeText: {
    color: Colors.white,
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
  },
  header: {
    marginTop: Platform.OS === 'android' ? 40 : 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  headerLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 26,
    height: 26,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: Colors.textTertiary,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBubble: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
  },
  userText: {
    color: Colors.white,
  },
  aiText: {
    color: Colors.textPrimary,
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTime: {
    color: Colors.textTertiary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  typingText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: Colors.textTertiary,
    marginLeft: 8,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: 'Outfit-Regular',
    backgroundColor: Colors.surface,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.tabInactive,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 280,
    backgroundColor: Colors.white,
    zIndex: 101,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: Colors.primary,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newChatButtonText: {
    color: Colors.white,
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    marginLeft: 8,
  },
  drawerList: {
    paddingHorizontal: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  sessionItemActive: {
    backgroundColor: Colors.surface,
  },
  sessionText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  sessionTextActive: {
    color: Colors.primary,
    fontFamily: 'Outfit-Bold',
  },
});
