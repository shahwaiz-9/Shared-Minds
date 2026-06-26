import firestore from '@react-native-firebase/firestore';
import { db } from '../auth/config';

const CHAT_SESSIONS_SUBCOLLECTION = 'chat_sessions';

export async function createNewSession(subjectId: string, title: string): Promise<import('@/interface/chat').ChatSession> {
    try {
        const docRef = await db
            .collection('subjects')
            .doc(subjectId)
            .collection(CHAT_SESSIONS_SUBCOLLECTION)
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

export async function fetchChatSessions(subjectId: string): Promise<import('@/interface/chat').ChatSession[]> {
    try {
        const snapshot = await db
            .collection('subjects')
            .doc(subjectId)
            .collection(CHAT_SESSIONS_SUBCOLLECTION)
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

export async function fetchMessages(subjectId: string, sessionId: string): Promise<import('@/interface/chat').Message[]> {
    try {
        const snapshot = await db
            .collection('subjects')
            .doc(subjectId)
            .collection(CHAT_SESSIONS_SUBCOLLECTION)
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

export async function saveMessage(
    subjectId: string,
    sessionId: string,
    message: Omit<import('@/interface/chat').Message, 'messageId' | 'createdAt'>
): Promise<string> {
    try {
        const sessionRef = db
            .collection('subjects')
            .doc(subjectId)
            .collection(CHAT_SESSIONS_SUBCOLLECTION)
            .doc(sessionId);

        const messageRef = await sessionRef.collection('messages').add({
            senderId: message.senderId,
            senderType: message.senderType,
            message: message.message,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        await sessionRef.update({
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return messageRef.id;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}
