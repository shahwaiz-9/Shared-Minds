import { Document as SubjectDocument } from '@/interface/document';
import firestore from '@react-native-firebase/firestore';
import { db } from '../auth/config';

const SUBJECTS_COLLECTION = 'subjects';
const SUBJECT_DOCUMENTS_SUBCOLLECTION = 'Documents';

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
