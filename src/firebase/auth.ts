import {
    createUserWithEmailAndPassword,
    GithubAuthProvider,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithCredential,
    signOut,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../firebase/config';

export const register = (
    email: string,
    password: string,
) => {
    return createUserWithEmailAndPassword(
        auth,
        email,
        password,
    );
};

export const login = (
    email: string,
    password: string,
) => {
    return signInWithEmailAndPassword(
        auth,
        email,
        password,
    );
};

export const LoginWithGithub = async (token?: string) => {
    if (Platform.OS === 'web') {
        const provider = new GithubAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (e) {
            console.error('Github Web login error:', e);
            throw e;
        }
    } else {
        if (!token) {
            throw new Error('Access token is required for native GitHub sign in.');
        }
        try {
            const credential = GithubAuthProvider.credential(token);
            const result = await signInWithCredential(auth, credential);
            return result.user;
        } catch (e) {
            console.error('Github native login error:', e);
            throw e;
        }
    }
};

export const LoginWithGoogle = async (idToken?: string) => {
    if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (e) {
            console.error('Google Web login error:', e);
            throw e;
        }
    } else {
        if (!idToken) {
            throw new Error('ID Token is required for native Google sign in.');
        }
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            return result.user;
        } catch (e) {
            console.error('Google native login error:', e);
            throw e;
        }
    }
};

export const registerWithGoogle = async (idToken?: string) => {
    return LoginWithGoogle(idToken);
};

export const registerWithGithub = async (token?: string) => {
    return LoginWithGithub(token);
};

export const forgotPassword = (
    email: string,
) => {
    return sendPasswordResetEmail(
        auth,
        email,
    );
};

export const logout = () => {
    return signOut(auth);
};