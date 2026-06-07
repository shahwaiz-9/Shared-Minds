import CustomButton from '@/components/button';
import CustomTextField from '@/components/textfield';
import { forgotPassword as firebaseForgotPassword } from '@/firebase/auth';
import { Colors } from '@/utlis/color';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function forgotpassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleReset = async () => {
        if (!email.trim()) {
            setErrorMessage('Please enter your email address.');
            setSuccessMessage(null);
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await firebaseForgotPassword(email.trim());
            setSuccessMessage('Password reset email sent! Please check your inbox.');
        } catch (error: any) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/user-not-found') {
                setErrorMessage('No account found with this email address.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Please enter a valid email address.');
            } else {
                setErrorMessage(error.message || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
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
                <Image
                    source={require('../../../assets/images/logo.png')}
                    style={{ width: 140, height: 140, marginBottom: 20 }}
                />
            </View>

            <Text
                style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: Colors.primary,
                    marginBottom: 10,
                    fontFamily: 'Outfit-Bold',
                }}
            >
                Forgot Password?
            </Text>

            <Text
                style={{
                    fontSize: 16,
                    color: Colors.textSecondary,
                    textAlign: 'center',
                    marginHorizontal: '10%',
                    marginBottom: 20,
                    fontFamily: 'Outfit-Regular',
                    lineHeight: 22,
                }}
            >
                Enter your email address below and we'll send you a link to reset your password.
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

            {/* Success Message */}
            {successMessage && (
                <Text style={{
                    color: Colors.success,
                    marginBottom: 15,
                    fontFamily: 'Outfit-Medium',
                    fontSize: 14,
                    textAlign: 'center',
                    width: '85%',
                }}>
                    {successMessage}
                </Text>
            )}

            {/* Email Field */}
            <View style={{ marginBottom: 20 }}>
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

            <View style={{ marginTop: 10 }}>
                <CustomButton
                    title="Send Reset Link"
                    onPress={handleReset}
                    type="simple"
                    loading={loading}
                />
            </View>

            {/* Back to Login */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 30,
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    onPress={() => {
                        router.replace('/auth/login');
                    }}
                >
                    <Text
                        style={{
                            color: Colors.primary,
                            fontFamily: 'Outfit-SemiBold',
                            fontSize: 16,
                        }}
                    >
                        Back to Login
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    );
}