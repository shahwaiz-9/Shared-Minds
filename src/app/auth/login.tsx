import CustomButton from '@/components/button';
import { login as firebaseLogin, LoginWithGithub, LoginWithGoogle } from '@/firebase/auth/auth';
import { SOCIAL_CONFIG } from '@/firebase/auth/socialConfig';
import { getUserDocument } from '@/firebase/collection/user_collection';
import { useAuthStore } from '@/store';
import { Colors } from '@/utlis/color';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomTextField from '../../components/textfield';
import { User } from '@/interface/user';
WebBrowser.maybeCompleteAuthSession();

export default function login() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const setUser = useAuthStore((state) => state.setUser);

    // Google Auth Request — uses expo's Google provider for correct discovery + redirect handling
    const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
        webClientId: SOCIAL_CONFIG.google.webClientId,
        iosClientId: SOCIAL_CONFIG.google.iosClientId || undefined,
        androidClientId: SOCIAL_CONFIG.google.androidClientId || undefined,
    });

    // GitHub Auth Request (Native Mobile)
    const [githubRequest, githubResponse, githubPromptAsync] = AuthSession.useAuthRequest(
        {
            clientId: SOCIAL_CONFIG.github.clientId,
            scopes: ['identity', 'user:email'],
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'sharedminds',
            }),
        },
        {
            authorizationEndpoint: 'https://github.com/login/oauth/authorize',
            tokenEndpoint: 'https://github.com/login/oauth/access_token',
        }
    );

    // Handle Google Response (Native Mobile)
    useEffect(() => {
        if (googleResponse?.type === 'success' && googleResponse.authentication?.idToken) {
            handleNativeGoogleLogin(googleResponse.authentication.idToken);
        }
    }, [googleResponse]);

    // Handle GitHub Response (Native Mobile)
    useEffect(() => {
        if (githubResponse?.type === 'success' && githubResponse.params.code) {
            handleNativeGithubLogin(githubResponse.params.code);
        }
    }, [githubResponse]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setErrorMessage('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const result = await firebaseLogin(email.trim(), password);
            const userDoc = await getUserDocument(result.user.uid);
            // const user = result.user
            // setUser(user)
            if (userDoc && (userDoc.photoURL || userDoc.coverPhotoURL || userDoc.bio)) {
                router.replace('/application/home' as any);
            } else {
                // const user: User {


                // }
                router.replace('/auth/profilesetup' as any);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setErrorMessage('Invalid email or password.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Please enter a valid email address.');
            } else {
                setErrorMessage(error.message || 'An error occurred during sign in.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatAuthError = (error: any) => {
        if (error?.code === 'auth/operation-not-supported-in-this-environment') {
            return 'Social login popups are only supported on the Web platform. Mobile apps require native OAuth configurations.';
        }
        return error?.message || 'An error occurred during authentication.';
    };

    const handleNativeGoogleLogin = async (idToken: string) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const firebaseUser = await LoginWithGoogle(idToken);
            const userDoc = await getUserDocument(firebaseUser.uid);
            if (userDoc && (userDoc.photoURL || userDoc.coverPhotoURL || userDoc.bio)) {
                router.replace('/application/home' as any);
            } else {
                router.replace('/auth/profilesetup' as any);
            }
        } catch (e: any) {
            console.error('Google Native Login Error:', e);
            setErrorMessage(e?.message || 'Google Native Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleNativeGithubLogin = async (code: string) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            if (!SOCIAL_CONFIG.github.clientSecret) {
                throw new Error('GitHub Client Secret is not configured in socialConfig.ts');
            }

            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: SOCIAL_CONFIG.github.clientId,
                    client_secret: SOCIAL_CONFIG.github.clientSecret,
                    code,
                    redirect_uri: AuthSession.makeRedirectUri({
                        scheme: 'sharedminds',
                    }),
                }),
            });

            const data = await response.json();
            if (data.access_token) {
                const firebaseUser = await LoginWithGithub(data.access_token);
                const userDoc = await getUserDocument(firebaseUser.uid);
                if (userDoc && (userDoc.photoURL || userDoc.coverPhotoURL || userDoc.bio)) {
                    router.replace('/application/home' as any);
                } else {
                    router.replace('/auth/profilesetup' as any);
                }
            } else {
                throw new Error(data.error_description || 'Failed to exchange GitHub access token.');
            }
        } catch (e: any) {
            console.error('GitHub Native Login Error:', e);
            setErrorMessage(e?.message || 'GitHub Native Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (Platform.OS === 'web') {
            setErrorMessage('Google login is currently supported only on native mobile builds.');
            return;
        }

        if (!SOCIAL_CONFIG.google.webClientId && !SOCIAL_CONFIG.google.iosClientId && !SOCIAL_CONFIG.google.androidClientId) {
            setErrorMessage('Please configure Google Client IDs in src/firebase/socialConfig.ts to use Google login on mobile devices.');
            return;
        }

        if (googleRequest) {
            googlePromptAsync();
        } else {
            setErrorMessage('Google Sign In is initializing, please try again.');
        }
    };

    const handleGithubLogin = async () => {
        if (Platform.OS === 'web') {
            setErrorMessage('GitHub login is currently supported only on native mobile builds.');
            return;
        }

        if (!SOCIAL_CONFIG.github.clientId) {
            setErrorMessage('Please configure GitHub Client ID in src/firebase/socialConfig.ts to use GitHub login on mobile devices.');
            return;
        }
        if (githubRequest) {
            githubPromptAsync();
        } else {
            setErrorMessage('GitHub Sign In is initializing, please try again.');
        }
    };







    return (
        <KeyboardAwareScrollView
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            contentContainerStyle={{
                alignItems: 'center',
                paddingBottom: 40,
            }}
            enableOnAndroid={true}
            extraScrollHeight={20}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 100 }}>
                <Image source={require('../../../assets/images/logo.png')} style={{ width: 140, height: 140, marginBottom: 20 }} />
            </View>

            <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: Colors.primary,
                marginBottom: 30,
                fontFamily: 'Outfit-Bold',
            }}>
                Welcome Back!
            </Text>

            {/* Error Message */}
            {errorMessage && (
                <Text style={{
                    color: Colors.error,
                    marginBottom: 15,
                    fontFamily: 'Outfit-Medium',
                    fontSize: 14,
                    textAlign: 'center',
                    width: '85%',
                }}>
                    {errorMessage}
                </Text>
            )}

            <View style={{
                marginBottom: 10,
            }}>
                <Text style={{
                    color: Colors.textSecondary,
                    marginBottom: 8,
                    marginLeft: 4,
                    fontFamily: 'Outfit-Medium',
                }}>
                    Email
                </Text>
                <CustomTextField
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={{
                marginBottom: 10,
            }}>
                <Text style={{
                    color: Colors.textSecondary,
                    marginBottom: 8,
                    marginLeft: 4,
                    fontFamily: 'Outfit-Medium',
                }}>
                    Password
                </Text>
                <CustomTextField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    type="password"
                />
            </View>

            <View style={{
                width: '90%',
                alignItems: 'flex-end',
                marginTop: 5,
                marginBottom: 10,
            }}>
                <TouchableOpacity onPress={() => router.push('/auth/forgotpassword')}>
                    <Text style={{
                        color: Colors.primary,
                        fontFamily: 'Outfit-Medium',
                        fontSize: 14,
                    }}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{
                marginTop: 10,
            }}>
                <CustomButton
                    title="login"
                    onPress={handleLogin}
                    type="simple"
                    loading={loading}
                />
            </View>

            {/* Divider */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 20,
                    width: '85%',
                }}
            >
                <View
                    style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: '#E5E7EB',
                    }}
                />
                <Text
                    style={{
                        marginHorizontal: 12,
                        color: Colors.textSecondary,
                        fontFamily: 'Outfit-Regular',
                    }}
                >
                    Or continue with
                </Text>
                <View
                    style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: '#E5E7EB',
                    }}
                />
            </View>

            {/* Social Login Buttons */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 15,
                    gap: 20,
                }}
            >
                <TouchableOpacity
                    style={{
                        width: 58,
                        height: 58,
                        borderRadius: 29,
                        backgroundColor: '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                    }}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                >
                    <AntDesign
                        name="google"
                        size={24}
                        color="#EA4335"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        width: 58,
                        height: 58,
                        borderRadius: 29,
                        backgroundColor: '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                    }}
                    onPress={handleGithubLogin}
                    disabled={loading}
                >
                    <AntDesign
                        name="github"
                        size={24}
                        color="#090949"
                    />
                </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        color: Colors.textSecondary,
                        fontFamily: 'Outfit-Regular',
                    }}
                >
                    Don't have an account?
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        router.push('/auth/signup');
                    }}
                >
                    <Text
                        style={{
                            marginLeft: 5,
                            color: Colors.primary,
                            fontFamily: 'Outfit-SemiBold',
                        }}
                    >
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    );
}