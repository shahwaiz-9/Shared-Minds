import { Chat } from '@/interface/chat';
import { Document as SubjectDocument } from '@/interface/document';
import { Subject, SubjectMember } from '@/interface/subject';
import firestore from '@react-native-firebase/firestore';
import { db } from '../auth/config';



const SUBJECTS_COLLECTION = 'subjects';
const SUBJECT_MEMBERS_SUBCOLLECTION = 'Subject_Members';
const SUBJECT_DOCUMENTS_SUBCOLLECTION = 'Documents';
const SUBJECT_CHATS_SUBCOLLECTION = 'Chats';



export const createSubject = async (
    subjectData: Omit<Subject, 'subjectid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const subjectRef = db.collection(SUBJECTS_COLLECTION).doc();
        const subjectId = subjectRef.id;
        const now = new Date();


        const sanitizedSubjectName = subjectData.subjectname.trim();
        const sanitizedSubjectCode = subjectData.subjectcode.trim().toUpperCase();
        const sanitizedSubjectDescription = subjectData.subjectdescription.trim();

        const newSubject: Subject = {
            subjectid: subjectId,
            subjectname: sanitizedSubjectName,
            subjectcode: sanitizedSubjectCode,
            subjectdescription: sanitizedSubjectDescription,
            visibility: subjectData.visibility,
            ownerid: subjectData.ownerid,
            createdAt: now,
            updatedAt: now,
        };


        await subjectRef.set({
            subjectid: newSubject.subjectid,
            subjectname: newSubject.subjectname,
            subjectcode: newSubject.subjectcode,
            subjectdescription: newSubject.subjectdescription,
            visibility: newSubject.visibility,
            ownerid: newSubject.ownerid,
            createdAt: firestore.Timestamp.fromDate(newSubject.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newSubject.updatedAt),
        });


        const memberRef = subjectRef.collection(SUBJECT_MEMBERS_SUBCOLLECTION).doc();
        const newMember: SubjectMember = {
            memberid: memberRef.id,
            subjectid: subjectId,
            userid: newSubject.ownerid,
            role: 'owner',
            createdAt: now,
            updatedAt: now,
        };

        await memberRef.set({
            memberid: newMember.memberid,
            subjectid: newMember.subjectid,
            userid: newMember.userid,
            role: newMember.role,
            createdAt: firestore.Timestamp.fromDate(newMember.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newMember.updatedAt),
        });

        return subjectId;
    } catch (error) {
        console.error('Error creating subject in Firestore:', error);
        throw error;
    }
};


export const getSubjectsByOwner = async (ownerId: string): Promise<Subject[]> => {
    try {
        const querySnap = await db.collection(SUBJECTS_COLLECTION)
            .where('ownerid', '==', ownerId)
            .get();

        const subjects: Subject[] = [];
        querySnap.forEach(doc => {
            const data = doc.data();
            subjects.push({
                subjectid: data.subjectid || doc.id,
                subjectname: data.subjectname || '',
                subjectcode: data.subjectcode || '',
                subjectdescription: data.subjectdescription || '',
                visibility: data.visibility || 'public',
                ownerid: data.ownerid || ownerId,
                createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
            });
        });

        return subjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
        console.error('Error fetching subjects by owner:', error);
        throw error;
    }
};


export const getSubjectsForUser = async (userId: string): Promise<Subject[]> => {
    console.log(`[getSubjectsForUser] 🚀 Starting fetch for userId: ${userId}`);
    try {
        console.log(`[getSubjectsForUser] 🔍 Querying collectionGroup: '${SUBJECT_MEMBERS_SUBCOLLECTION}'...`);

        // FIX: Ensure collectionGroup() is invoked properly as a method
        const memberQuerySnap = await db.collectionGroup(SUBJECT_MEMBERS_SUBCOLLECTION)
            .where('userid', '==', userId)
            .where('subjectid', '>=', '')
            .get();

        console.log(`[getSubjectsForUser] ✅ CollectionGroup query completed. Found ${memberQuerySnap.size} documents.`);

        if (memberQuerySnap.empty) {
            console.log('[getSubjectsForUser] 🚪 No memberships found. Returning empty array.');
            return [];
        }

        const subjectIds = memberQuerySnap.docs.map(doc => {
            const data = doc.data();
            console.log(`   -> Found Membership Doc ID: ${doc.id} | links to subjectid: ${data.subjectid}`);
            return data.subjectid;
        });

        const uniqueSubjectIds = [...new Set(subjectIds)];
        console.log(`[getSubjectsForUser] 🧼 Unique subject count to fetch: ${uniqueSubjectIds.length}`);

        console.log(`[getSubjectsForUser] 🏎️ Triggering concurrent document fetches...`);
        const subjectPromises = uniqueSubjectIds.map(async (subjectId, index) => {
            try {
                // FIX: Ensured clean .collection().doc() method chains
                const subjectDoc = await db.collection(SUBJECTS_COLLECTION).doc(subjectId).get();

                if (!subjectDoc.exists) {
                    console.warn(`   ⚠️ [Task ${index}] Document ${subjectId} does not exist in '${SUBJECTS_COLLECTION}'!`);
                    return null;
                }

                const data = subjectDoc.data()!;
                console.log(`   ✅ [Task ${index}] Successfully retrieved: "${data.subjectname || 'Unnamed'}"`);

                return {
                    subjectid: data.subjectid || subjectDoc.id,
                    subjectname: data.subjectname || '',
                    subjectcode: data.subjectcode || '',
                    subjectdescription: data.subjectdescription || '',
                    visibility: data.visibility || 'public',
                    ownerid: data.ownerid || '',
                    createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                    updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
                };
            } catch (innerDocError) {
                console.error(`   ❌ [Task ${index}] Failed during fetch for ID ${subjectId}:`, innerDocError);
                return null;
            }
        });

        const results = await Promise.all(subjectPromises);
        const subjects = results.filter((s): s is Subject => s !== null);

        const sortedSubjects = subjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        console.log(`[getSubjectsForUser] 🎉 Done! Returning ${sortedSubjects.length} subjects.`);
        return sortedSubjects;

    } catch (error: any) {
        console.error('💥 [getSubjectsForUser] CRITICAL FAILURE caught in main try/catch block:');
        console.error('Error Code:', error?.code);
        console.error('Error Message:', error?.message);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        throw error;
    }
};

export const getSubjectMembers = async (subjectId: string): Promise<SubjectMember[]> => {
    try {
        const memberSnap = await db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
            .get();

        return memberSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                memberid: data.memberid || doc.id,
                subjectid: data.subjectid || subjectId,
                userid: data.userid || '',
                role: data.role || 'viewer',
                createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
            };
        });
    } catch (error) {
        console.error('Error fetching subject members:', error);
        throw error;
    }
};

export const addSubjectMember = async (
    subjectId: string,
    memberData: Omit<SubjectMember, 'memberid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const memberRef = db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
            .doc();

        const now = new Date();
        const newMember: SubjectMember = {
            memberid: memberRef.id,
            subjectid: subjectId,
            userid: memberData.userid,
            role: memberData.role,
            createdAt: now,
            updatedAt: now,
        };

        await memberRef.set({
            memberid: newMember.memberid,
            subjectid: newMember.subjectid,
            userid: newMember.userid,
            role: newMember.role,
            createdAt: firestore.Timestamp.fromDate(newMember.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newMember.updatedAt),
        });

        return newMember.memberid;
    } catch (error) {
        console.error('Error adding subject member:', error);
        throw error;
    }
};


export const getSubjectDocuments = async (subjectId: string): Promise<SubjectDocument[]> => {
    try {
        const docSnap = await db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_DOCUMENTS_SUBCOLLECTION)
            .get();

        return docSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                documentid: data.documentid || doc.id,
                subjectid: data.subjectid || subjectId,
                filename: data.filename || '',
                filetype: data.filetype || '',
                fileurl: data.fileurl || '',
                createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
            };
        });
    } catch (error) {
        console.error('Error fetching subject documents:', error);
        throw error;
    }
};

export const addSubjectDocument = async (
    subjectId: string,
    documentData: Omit<SubjectDocument, 'documentid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const documentRef = db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_DOCUMENTS_SUBCOLLECTION)
            .doc();

        const now = new Date();
        const newDocument: SubjectDocument = {
            documentid: documentRef.id,
            subjectid: subjectId,
            filename: documentData.filename,
            filetype: documentData.filetype,
            fileurl: documentData.fileurl,
            createdAt: now,
            updatedAt: now,
        };

        await documentRef.set({
            documentid: newDocument.documentid,
            subjectid: newDocument.subjectid,
            filename: newDocument.filename,
            filetype: newDocument.filetype,
            fileurl: newDocument.fileurl,
            createdAt: firestore.Timestamp.fromDate(newDocument.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newDocument.updatedAt),
        });

        return newDocument.documentid;
    } catch (error) {
        console.error('Error adding subject document:', error);
        throw error;
    }
};


export const getSubjectChats = async (subjectId: string): Promise<Chat[]> => {
    try {
        const chatSnap = await db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_CHATS_SUBCOLLECTION)
            .get();

        return chatSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                chatid: data.chatid || doc.id,
                subjectid: data.subjectid || subjectId,
                senderid: data.senderid || '',
                message: data.message || '',
                createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
            };
        });
    } catch (error) {
        console.error('Error fetching subject chats:', error);
        throw error;
    }
};

export const addSubjectChat = async (
    subjectId: string,
    chatData: Omit<Chat, 'chatid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const chatRef = db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_CHATS_SUBCOLLECTION)
            .doc();

        const now = new Date();
        const newChat: Chat = {
            chatid: chatRef.id,
            subjectid: subjectId,
            senderid: chatData.senderid,
            message: chatData.message,
            createdAt: now,
            updatedAt: now,
        };

        await chatRef.set({
            chatid: newChat.chatid,
            subjectid: newChat.subjectid,
            senderid: newChat.senderid,
            message: newChat.message,
            createdAt: firestore.Timestamp.fromDate(newChat.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newChat.updatedAt),
        });

        return newChat.chatid;
    } catch (error) {
        console.error('Error adding subject chat:', error);
        throw error;
    }
};


export const updateSubject = async (
    subjectId: string,
    subjectData: Partial<Omit<Subject, 'subjectid' | 'createdAt' | 'updatedAt' | 'ownerid'>>
): Promise<void> => {
    try {
        const subjectRef = db.collection(SUBJECTS_COLLECTION).doc(subjectId);
        const updates: any = {
            updatedAt: firestore.Timestamp.fromDate(new Date()),
        };

        if (subjectData.subjectname !== undefined) {
            updates.subjectname = subjectData.subjectname.trim();
        }
        if (subjectData.subjectcode !== undefined) {
            updates.subjectcode = subjectData.subjectcode.trim().toUpperCase();
        }
        if (subjectData.subjectdescription !== undefined) {
            updates.subjectdescription = subjectData.subjectdescription.trim();
        }
        if (subjectData.visibility !== undefined) {
            updates.visibility = subjectData.visibility;
        }

        await subjectRef.update(updates);
    } catch (error) {
        console.error('Error updating subject in Firestore:', error);
        throw error;
    }
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
    try {
        const subjectRef = db.collection(SUBJECTS_COLLECTION).doc(subjectId);
        const batch = db.batch();

        const deleteSubcollectionDocuments = async (subcollectionName: string) => {
            const querySnap = await subjectRef.collection(subcollectionName).get();
            querySnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
        };

        await Promise.all([
            deleteSubcollectionDocuments(SUBJECT_MEMBERS_SUBCOLLECTION),
            deleteSubcollectionDocuments(SUBJECT_DOCUMENTS_SUBCOLLECTION),
            deleteSubcollectionDocuments(SUBJECT_CHATS_SUBCOLLECTION),
        ]);

        batch.delete(subjectRef);
        await batch.commit();
    } catch (error) {
        console.error('Error deleting subject in Firestore:', error);
        throw error;
    }
};


