import firestore from '@react-native-firebase/firestore';
import { db } from '../firebase/auth/config';

export interface Message {
  messageId: string;
  senderId: string;
  senderType: 'user' | 'assistant';
  message: string;
  createdAt: Date;
}

export interface ChatSession {
  sessionId: string;
  subjectId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service to manage chat sessions and messages inside Firestore,
 * fully isolating sessions based on the subjectId.
 */

/**
 * Creates a new chat session under subjects/{subjectId}/chat_sessions
 */
export async function createNewSession(subjectId: string, title: string): Promise<ChatSession> {
  try {
    const docRef = await db
      .collection('subjects')
      .doc(subjectId)
      .collection('chat_sessions')
      .add({
        title,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return {
      sessionId: docRef.id,
      subjectId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

/**
 * Fetches all chat sessions for a specific subject, ordered by last update
 */
export async function fetchChatSessions(subjectId: string): Promise<ChatSession[]> {
  try {
    const snapshot = await db
      .collection('subjects')
      .doc(subjectId)
      .collection('chat_sessions')
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        sessionId: doc.id,
        subjectId,
        title: data.title || 'New Conversation',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

/**
 * Fetches all messages for a specific session, ordered chronologically
 */
export async function fetchMessages(subjectId: string, sessionId: string): Promise<Message[]> {
  try {
    const snapshot = await db
      .collection('subjects')
      .doc(subjectId)
      .collection('chat_sessions')
      .doc(sessionId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        messageId: doc.id,
        senderId: data.senderId || '',
        senderType: data.senderType || 'user',
        message: data.message || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Saves a new message to subjects/{subjectId}/chat_sessions/{sessionId}/messages
 * and updates the session's updatedAt timestamp.
 */
export async function saveMessage(
  subjectId: string,
  sessionId: string,
  message: Omit<Message, 'messageId' | 'createdAt'>
): Promise<string> {
  try {
    const sessionRef = db
      .collection('subjects')
      .doc(subjectId)
      .collection('chat_sessions')
      .doc(sessionId);

    // Save message document
    const messageRef = await sessionRef.collection('messages').add({
      senderId: message.senderId,
      senderType: message.senderType,
      message: message.message,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update session timestamp
    await sessionRef.update({
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}
