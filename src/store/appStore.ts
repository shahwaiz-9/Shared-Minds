import { User } from '@/interface/user'; // Ensure your interface is imported here
import auth from '@react-native-firebase/auth';
import { create } from 'zustand';

interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Setters
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Auth & Profile Actions
    updateUserProfile: (data: Partial<User>) => void;
    logout: () => Promise<void>;
    initializeAuth: () => () => void; // Returns unsubscribe function
}

export const useAppStore = create<AuthStore>((set, get) => ({
    user: null,
    loading: true, // Start as true to handle initial check
    error: null,
    isAuthenticated: false,

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Helper to partially update the user object in state
    updateUserProfile: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data, updatedAt: new Date() } : null
    })),

    logout: async () => {
        try {
            await auth().signOut();
            set({ user: null, isAuthenticated: false, loading: false });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    initializeAuth: () => {
        const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                // Map Firebase Auth user to your custom interface
                const user: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || null,
                    photoURL: firebaseUser.photoURL || null,
                    coverPhotoURL: null, // Initialize default
                    bio: null,
                    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
                    updatedAt: new Date(),
                };
                set({ user, isAuthenticated: true, loading: false, error: null });
            } else {
                set({ user: null, isAuthenticated: false, loading: false });
            }
        });
        return unsubscribe; // Return so the component can call it to clean up
    },
}));