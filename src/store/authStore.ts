import { User } from '@/interface/user';
import { Subject } from '@/interface/subject';
import { getUserDocument, createUserDocument } from '@/firebase/collection/user_collection';
import { getSubjectsForUser } from '@/firebase/collection/subject_collection';
import auth from '@react-native-firebase/auth';
import { create } from 'zustand';

interface AuthStore {
    user: User | null;
    subjects: Subject[];
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    setSubjects: (subjects: Subject[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setAuthenticated: (isAuthenticated: boolean) => void;
    fetchSubjects: () => Promise<void>;

    // Auth actions
    logout: () => Promise<void>;
    clearError: () => void;
    initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    subjects: [],
    loading: false,
    error: null,
    isAuthenticated: false,

    setUser: (user) => set({ user }),
    setSubjects: (subjects) => set({ subjects }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

    fetchSubjects: async () => {
        const { user } = get();
        if (!user?.uid) return;

        try {
            const subjects = await getSubjectsForUser(user.uid);
            set({ subjects });
        } catch (err: any) {
            console.error('Error fetching subjects:', err);
            set({ error: err.message || 'Failed to load subjects.' });
        }
    },

    logout: async () => {
        set({ loading: true, error: null });
        try {
            await auth().signOut();
            set({
                user: null,
                subjects: [],
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
                    
                    // Fetch subjects after user is loaded
                    const subjects = await getSubjectsForUser(firebaseUser.uid);
                    
                    set({
                        user: firestoreUser,
                        subjects,
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
                    subjects: [],
                    isAuthenticated: false,
                    loading: false,
                });
            }
        });

        return unsubscribe;
    },
}));
