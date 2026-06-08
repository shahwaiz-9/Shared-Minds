import CustomButton from '@/components/button';
import CustomTextField from '@/components/textfield';
import { register as firebaseRegister, registerWithGithub, registerWithGoogle } from '@/firebase/auth';
import { SOCIAL_CONFIG } from '@/firebase/socialConfig';
import { auth } from '@/firebase/config';
import { Colors } from '@/utlis/color';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { Image, Text, TouchableOpacity, View, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

WebBrowser.maybeCompleteAuthSession();

export default function signup() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Google Auth Request (Native Mobile)
    const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
        {
            clientId: Platform.select({
                web: SOCIAL_CONFIG.google.webClientId,
                ios: SOCIAL_CONFIG.google.iosClientId,
                android: SOCIAL_CONFIG.google.androidClientId,
            }),
            scopes: ['openid', 'profile', 'email'],
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'sharedminds',
            }),
        },
        {
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
    );

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
            handleNativeGoogleSignUp(googleResponse.authentication.idToken);
        }
    }, [googleResponse]);

    // Handle GitHub Response (Native Mobile)
    useEffect(() => {
        if (githubResponse?.type === 'success' && githubResponse.params.code) {
            handleNativeGithubSignUp(githubResponse.params.code);
        }
    }, [githubResponse]);

    const handleSignUp = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setErrorMessage('All fields are required.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            await firebaseRegister(email.trim(), password);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: name.trim(),
                });
            }
            router.replace('/application');
        } catch (error: any) {
            console.error('Signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setErrorMessage('This email address is already in use.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Please enter a valid email address.');
            } else if (error.code === 'auth/weak-password') {
                setErrorMessage('The password is too weak.');
            } else {
                setErrorMessage(error.message || 'An error occurred during account creation.');
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

    const handleNativeGoogleSignUp = async (idToken: string) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            await registerWithGoogle(idToken);
            router.replace('/application');
        } catch (e: any) {
            console.error('Google Native Signup Error:', e);
            setErrorMessage(e?.message || 'Google Native Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleNativeGithubSignUp = async (code: string) => {
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
                await registerWithGithub(data.access_token);
                router.replace('/application');
            } else {
                throw new Error(data.error_description || 'Failed to exchange GitHub access token.');
            }
        } catch (e: any) {
            console.error('GitHub Native Signup Error:', e);
            setErrorMessage(e?.message || 'GitHub Native Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (Platform.OS === 'web') {
            setLoading(true);
            setErrorMessage(null);
            try {
                const user = await registerWithGoogle();
                if (user) {
                    router.replace('/application');
                }
            } catch (e: any) {
                console.error('Google Sign Up Error:', e);
                setErrorMessage(formatAuthError(e));
            } finally {
                setLoading(false);
            }
        } else {
            if (!SOCIAL_CONFIG.google.webClientId && !SOCIAL_CONFIG.google.iosClientId && !SOCIAL_CONFIG.google.androidClientId) {
                setErrorMessage('Please configure Google Client IDs in src/firebase/socialConfig.ts to use Google login on mobile devices.');
                return;
            }
            if (googleRequest) {
                googlePromptAsync();
            } else {
                setErrorMessage('Google Sign In is initializing, please try again.');
            }
        }
    };

    const handleGithubSignUp = async () => {
        if (Platform.OS === 'web') {
            setLoading(true);
            setErrorMessage(null);
            try {
                const user = await registerWithGithub();
                if (user) {
                    router.replace('/application');
                }
            } catch (e: any) {
                console.error('Github Sign Up Error:', e);
                setErrorMessage(formatAuthError(e));
            } finally {
                setLoading(false);
            }
        } else {
            if (!SOCIAL_CONFIG.github.clientId) {
                setErrorMessage('Please configure GitHub Client ID in src/firebase/socialConfig.ts to use GitHub login on mobile devices.');
                return;
            }
            if (githubRequest) {
                githubPromptAsync();
            } else {
                setErrorMessage('GitHub Sign In is initializing, please try again.');
            }
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
            <View style={{ alignItems: 'center', marginBottom: 15, marginTop: 60 }}>
                <Image
                    source={require('../../../assets/images/logo.png')}
                    style={{ width: 100, height: 100, marginBottom: 15 }}
                />
            </View>

            <Text
                style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: Colors.primary,
                    marginBottom: 20,
                    fontFamily: 'Outfit-Bold',
                }}
            >
                Create Account
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

            {/* Name Field */}
            <View style={{ marginBottom: 10 }}>
                <Text
                    style={{
                        color: Colors.textSecondary,
                        marginBottom: 8,
                        marginLeft: 4,
                        fontFamily: 'Outfit-Medium',
                    }}
                >
                    Name
                </Text>
                <CustomTextField
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 10 }}>
                <Text
                    style={{
                        color: Colors.textSecondary,
                        marginBottom: 8,
                        marginLeft: 4,
                        fontFamily: 'Outfit-Medium',
                    }}
                >
                    Email
                </Text>
                <CustomTextField
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 10 }}>
                <Text
                    style={{
                        color: Colors.textSecondary,
                        marginBottom: 8,
                        marginLeft: 4,
                        fontFamily: 'Outfit-Medium',
                    }}
                >
                    Password
                </Text>
                <CustomTextField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    type="password"
                />
            </View>

            {/* Confirm Password Field */}
            <View style={{ marginBottom: 20 }}>
                <Text
                    style={{
                        color: Colors.textSecondary,
                        marginBottom: 8,
                        marginLeft: 4,
                        fontFamily: 'Outfit-Medium',
                    }}
                >
                    Confirm Password
                </Text>
                <CustomTextField
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    type="password"
                />
            </View>

            <View style={{ marginTop: 10 }}>
                <CustomButton
                    title="Sign Up"
                    onPress={handleSignUp}
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
                    onPress={handleGoogleSignUp}
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
                    onPress={handleGithubSignUp}
                    disabled={loading}
                >
                    <AntDesign
                        name="github"
                        size={24}
                        color="#090949"
                    />
                </TouchableOpacity>
            </View>

            {/* Already have an account? Login */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 25,
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        color: Colors.textSecondary,
                        fontFamily: 'Outfit-Regular',
                    }}
                >
                    Already have an account?
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        router.replace('/auth/login');
                    }}
                >
                    <Text
                        style={{
                            marginLeft: 5,
                            color: Colors.primary,
                            fontFamily: 'Outfit-SemiBold',
                        }}
                    >
                        Login
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    );
}