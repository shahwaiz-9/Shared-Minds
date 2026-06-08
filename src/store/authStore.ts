import { User } from '@/interface/user';
import { getUserDocument, createUserDocument } from '@/firebase/collection/user_collection';
import auth from '@react-native-firebase/auth';
import { create } from 'zustand';

interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setAuthenticated: (isAuthenticated: boolean) => void;

    // Auth actions
    logout: () => Promise<void>;
    clearError: () => void;
    initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

    logout: async () => {
        set({ loading: true, error: null });
        try {
            await auth().signOut();
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to logout',
                loading: false,
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),

    initializeAuth: () => {
        set({ loading: true });
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    let firestoreUser = await getUserDocument(firebaseUser.uid);
                    if (!firestoreUser) {
                        // Fallback creation step
                        firestoreUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            coverPhotoURL: null,
                            bio: null,
                            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
                            updatedAt: new Date(),
                        };
                        await createUserDocument(firestoreUser);
                    }
                    set({
                        user: firestoreUser,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });
                } catch (err: any) {
                    console.error('Error fetching or creating Firestore user:', err);
                    set({
                        error: err.message || 'Failed to load user profile.',
                        loading: false,
                    });
                }
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    loading: false,
                });
            }
        });

        return unsubscribe;
    },
}));
