import {
    createUserWithEmailAndPassword,
    GithubAuthProvider,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from 'firebase/auth';

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

export const LoginWithGithub = async () => {

    const provider = new GithubAuthProvider();


    try {

        const result = await signInWithPopup(auth, provider);

        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        console.log('Github login successful:', user);

        // User interface call in future
        return true;

    } catch (e) {
        console.error('Github login error:', e);
    }
}

export const LoginWithGoogle = async () => {

    const provider = new GoogleAuthProvider();

    try {

        const result = await signInWithPopup(auth, provider);

        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;

        console.log('Google login successful:', user);

        // User interface call in future
        return true;
    } catch (e) {

        console.error('Google login error:', e);

    }

}

export const registerWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Google registration/login successful:", user);
        return result;
    } catch (error) {
        console.error("Google Auth Error:", error);
        throw error;
    }
};

export const registerWithGithub = async () => {
    const provider = new GithubAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Github registration/login successful:", user);
        return result;
    } catch (error) {
        console.error("Github Auth Error:", error);
        throw error;
    }

}

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