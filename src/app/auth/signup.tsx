import CustomButton from '@/components/button';
import CustomPopup from '@/components/popup';
import CustomTextField from '@/components/textfield';
import { register as firebaseRegister } from '@/firebase/auth/auth';
import { auth } from '@/firebase/auth/config';
import { User } from '@/interface/user';
import { useAuthStore } from '@/store';
import { Colors } from '@/utlis/color';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
WebBrowser.maybeCompleteAuthSession();

export default function signup() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupType, setPopupType] = useState<'success' | 'error'>('error');
    const [popupMessage, setPopupMessage] = useState('');

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    const handleSignUp = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setPopupMessage('All fields are required.');
            setPopupType('error');
            setShowPopup(true);
            return;
        }

        if (password !== confirmPassword) {
            setPopupMessage('Passwords do not match.');
            setPopupType('error');
            setShowPopup(true);
            return;
        }

        if (password.length < 6) {
            setPopupMessage('Password must be at least 6 characters long.');
            setPopupType('error');
            setShowPopup(true);
            return;
        }

        setLoading(true);

        try {
            await firebaseRegister(email.trim(), password);
            if (auth.currentUser) {
                await auth.currentUser.updateProfile({
                    displayName: name.trim(),
                });
            }

            const currentUser = auth.currentUser;
            if (currentUser) {
                const stateUser: User = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    coverPhotoURL: null,
                    bio: null,
                    createdAt: new Date(currentUser.metadata.creationTime || Date.now()),
                    updatedAt: new Date(),
                };
                setUser(stateUser);
            }

            router.replace('/auth/profilesetup');
        } catch (error: any) {
            console.error('Signup error:', error);
            let msg = 'An error occurred during account creation.';
            if (error.code === 'auth/email-already-in-use') {
                msg = 'This email address is already in use.';
            } else if (error.code === 'auth/invalid-email') {
                msg = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                msg = 'The password is too weak.';
            } else {
                msg = error.message || msg;
            }
            setPopupMessage(msg);
            setPopupType('error');
            setShowPopup(true);
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
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
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

            <CustomPopup
                visible={showPopup}
                title={popupType === 'success' ? 'Success' : 'Error'}
                message={popupMessage}
                buttonText={popupType === 'success' ? 'Continue' : 'Try Again'}
                buttonIcon={popupType === 'success' ? 'checkmark-circle' : 'alert-circle-outline'}
                mainIcon={popupType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                mainIconColor={popupType === 'success' ? '#10B981' : '#EF4444'}
                buttonColor={popupType === 'success' ? '#10B981' : '#EF4444'}
                onPress={handleClosePopup}
                onClose={handleClosePopup}
            />
        </KeyboardAwareScrollView>
    );
}