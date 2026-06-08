import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

export const register = (email: string, password: string) => {
    return auth().createUserWithEmailAndPassword(email, password);
};

export const login = (email: string, password: string) => {
    return auth().signInWithEmailAndPassword(email, password);
};

export const LoginWithGithub = async (token?: string) => {
    if (Platform.OS === 'web') {
        throw new Error('GitHub sign-in is only supported on native mobile builds with React Native Firebase.');
    }

    if (!token) {
        throw new Error('Access token is required for native GitHub sign in.');
    }

    try {
        const credential = auth.GithubAuthProvider.credential(token);
        const result = await auth().signInWithCredential(credential);
        return result.user;
    } catch (e) {
        console.error('Github native login error:', e);
        throw e;
    }
};

export const LoginWithGoogle = async (idToken?: string) => {
    if (Platform.OS === 'web') {
        throw new Error('Google sign-in is only supported on native mobile builds with React Native Firebase.');
    }

    if (!idToken) {
        throw new Error('ID Token is required for native Google sign in.');
    }

    try {
        const credential = auth.GoogleAuthProvider.credential(idToken);
        const result = await auth().signInWithCredential(credential);
        return result.user;
    } catch (e) {
        console.error('Google native login error:', e);
        throw e;
    }
};

export const registerWithGoogle = async (idToken?: string) => {
    return LoginWithGoogle(idToken);
};

export const registerWithGithub = async (token?: string) => {
    return LoginWithGithub(token);
};

export const forgotPassword = (email: string) => {
    return auth().sendPasswordResetEmail(email);
};

export const logout = () => {
    return auth().signOut();
};