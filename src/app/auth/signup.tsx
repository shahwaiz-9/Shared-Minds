import CustomButton from '@/components/button';
import CustomTextField from '@/components/textfield';
import { register as firebaseRegister } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { Colors } from '@/utlis/color';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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
                await auth.currentUser.updateProfile({
                    displayName: name.trim(),
                });
            }
            router.replace('/auth/profilesetup');
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