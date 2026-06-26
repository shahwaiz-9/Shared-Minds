import { User } from '@/interface/user';
import firestore from '@react-native-firebase/firestore';
import { db } from '../auth/config';


export const getUserDocument = async (uid: string): Promise<User | null> => {
    try {
        const docSnap = await db.collection('users').doc(uid).get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data()!;
        return {
            uid: data.uid || uid,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            coverPhotoURL: data.coverPhotoURL || null,
            bio: data.bio || null,
            createdAt: data.createdAt ? (data.createdAt as firestore.FirebaseFirestoreTypes.Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as firestore.FirebaseFirestoreTypes.Timestamp).toDate() : new Date(),
        };
    } catch (error) {
        console.error('Error fetching user document:', error);
        throw error;
    }
};


export const createUserDocument = async (user: User): Promise<void> => {
    try {
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            coverPhotoURL: user.coverPhotoURL,
            bio: user.bio,
            createdAt: firestore.Timestamp.fromDate(user.createdAt),
            updatedAt: firestore.Timestamp.fromDate(user.updatedAt),
        });
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
};


export const updateUserDocument = async (uid: string, data: Partial<User>): Promise<void> => {
    try {
        const updateData: any = { ...data };

        // Handle dates conversion
        if (data.createdAt) {
            updateData.createdAt = firestore.Timestamp.fromDate(data.createdAt);
        }
        if (data.updatedAt) {
            updateData.updatedAt = firestore.Timestamp.fromDate(data.updatedAt);
        }

        await db.collection('users').doc(uid).update(updateData);
    } catch (error) {
        console.error('Error updating user document:', error);
        throw error;
    }
};




// Public subjects handling moved to subject_collection.ts

