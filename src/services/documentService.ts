import { DocumentData } from '@/interface/document';
import firestore from '@react-native-firebase/firestore';
import { supabase } from '../../supabase/supabaseClient';
import { db } from '../firebase/auth/config';


/**
 * Helper function to extract Supabase storage file path from public URL
 */
const getFilePathFromUrl = (url: string): string | null => {
    try {
        const marker = '/storage/v1/object/public/documents/';
        const index = url.indexOf(marker);
        if (index !== -1) {
            return decodeURIComponent(url.substring(index + marker.length));
        }
    } catch (error) {
        console.error('Error parsing file path from URL:', error);
    }
    return null;
};

/**
 * Uploads a file to Supabase Storage bucket and returns the public URL.
 */
export const uploadFileToStorage = async (
    subjectId: string,
    fileUri: string | Blob,
    fileName: string,
    fileType: string
): Promise<string> => {
    try {
        const blob: Blob =
            typeof fileUri === 'string'
                ? await new Promise<Blob>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        resolve(xhr.response);
                    };
                    xhr.onerror = function () {
                        reject(new TypeError('Network request failed'));
                    };
                    xhr.responseType = 'blob';
                    xhr.open('GET', fileUri, true);
                    xhr.send(null);
                })
                : fileUri;

        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');

        const filePath = `subject_${subjectId}_${Date.now()}_${cleanFileName}`;

        const { data, error } = await supabase.storage
            .from('Shared_Mind_Bucket')
            .upload(filePath, blob, {
                contentType: fileType || 'application/octet-stream',
                upsert: true,

            });

        // if (typeof blob.close === 'function') {
        //     blob.close();
        // }

        if (error) {
            throw error;
        }

        const { data: publicData } = supabase.storage
            .from('Shared_Mind_Bucket')
            .getPublicUrl(filePath);

        if (!publicData?.publicUrl) {
            throw new Error('Failed to retrieve public URL from Supabase Storage.');
        }

        return publicData.publicUrl;
    } catch (error) {
        console.error('Error uploading to storage:', error);
        throw error;
    }
};

/**
 * Creates/Saves a document metadata record in Firestore under subjects/{subjectId}/documents sub-collection.
 */
export const addDocumentToFirestore = async (
    subjectId: string,
    docData: Omit<DocumentData, 'id' | 'createdAt'>
): Promise<string> => {
    try {
        const ref = await db
            .collection('subjects')
            .doc(subjectId)
            .collection('documents')
            .add({
                fileName: docData.fileName,
                fileUrl: docData.fileUrl,
                fileType: docData.fileType,
                createdAt: firestore.FieldValue.serverTimestamp(),
                uploadedBy: docData.uploadedBy,
            });
        return ref.id;
    } catch (error) {
        console.error('Error adding document to Firestore:', error);
        throw error;
    }
};

/**
 * Sets up a real-time listener for the documents sub-collection of a subject.
 */
export const subscribeToDocuments = (
    subjectId: string,
    onUpdate: (docs: DocumentData[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return db
        .collection('subjects')
        .doc(subjectId)
        .collection('documents')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
            (snapshot) => {
                if (!snapshot) return;
                const docs: DocumentData[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    let createdDate = new Date();
                    if (data.createdAt) {
                        if (typeof data.createdAt.toDate === 'function') {
                            createdDate = data.createdAt.toDate();
                        } else if (data.createdAt.seconds) {
                            createdDate = new Date(data.createdAt.seconds * 1000);
                        } else {
                            createdDate = new Date(data.createdAt);
                        }
                    }
                    return {
                        id: doc.id,
                        fileName: data.fileName || 'Untitled Document',
                        fileUrl: data.fileUrl || '',
                        fileType: data.fileType || 'unknown',
                        createdAt: createdDate,
                        uploadedBy: data.uploadedBy || 'Anonymous',
                    };
                });
                onUpdate(docs);
            },
            (err) => {
                console.error('Firestore listener error:', err);
                if (onError) onError(err);
            }
        );
};

/**
 * Deletes a document from both Firestore sub-collection and Supabase Storage bucket.
 */
export const deleteDocument = async (
    subjectId: string,
    docId: string,
    fileUrl: string
): Promise<void> => {
    try {
        // 1. Delete from Supabase Storage first
        const filePath = getFilePathFromUrl(fileUrl);
        if (filePath) {
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([filePath]);
            if (storageError) {
                console.warn('Storage deletion warning (file may not exist):', storageError.message);
            }
        }

        // 2. Delete from Firestore sub-collection
        await db
            .collection('subjects')
            .doc(subjectId)
            .collection('documents')
            .doc(docId)
            .delete();
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};
export { DocumentData };

