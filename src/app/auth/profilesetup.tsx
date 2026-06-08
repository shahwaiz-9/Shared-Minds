import CustomButton from '@/components/button';
import { auth } from '@/firebase/config';
import { User } from '@/interface/user';
import { useAuthStore } from '@/store';
import { uploadToCloudinary } from '@/utlis/cloudinary';
import { Colors } from '@/utlis/color';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width: screenWidth } = Dimensions.get('window');
const COVER_HEIGHT = 200;
const AVATAR_SIZE = 110;
const BIO_MAX_LENGTH = 150;

export default function ProfileSetupScreen() {
    const router = useRouter();

    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [pickingCover, setPickingCover] = useState(false);
    const [pickingAvatar, setPickingAvatar] = useState(false);
    const [bioFocused, setBioFocused] = useState(false);

    const pickImage = async (type: 'cover' | 'avatar') => {
        const setter = type === 'cover' ? setPickingCover : setPickingAvatar;
        setter(true);

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setter(false);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: type === 'cover' ? [16, 9] : [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                if (type === 'cover') {
                    setCoverUri(result.assets[0].uri);
                } else {
                    setAvatarUri(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error(`Error picking ${type} image:`, error);
        } finally {
            setter(false);
        }
    };

    const handleImageUpload = async (pickerResult: any) => {
        try {
            const imageUrl = await uploadToCloudinary(pickerResult.uri);
            console.log('Image uploaded successfully:', imageUrl);

            return imageUrl;
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const setUser = useAuthStore((state) => state.setUser);

    const handleContinue = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('No authenticated user available for profile setup.');
            return;
        }

        const coveruri = coverUri ? (await handleImageUpload({ uri: coverUri })) || null : null;
        const profileuri = avatarUri ? (await handleImageUpload({ uri: avatarUri })) || null : null;

        if (profileuri) {
            try {
                await currentUser.updateProfile({ photoURL: profileuri });
            } catch (error) {
                console.error('Failed to update auth profile photoURL:', error);
            }
        }

        const user: User = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: profileuri ?? currentUser.photoURL,
            coverPhotoURL: coveruri,
            bio: bio.trim() || null,
            createdAt: new Date(currentUser.metadata.creationTime || Date.now()),
            updatedAt: new Date(),
        };

        setUser(user);
        router.replace('/application/' as any);
    };

    const handleSkip = () => {
        router.replace('/application/' as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                enableOnAndroid={true}
                extraScrollHeight={30}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Cover Photo Section ── */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => pickImage('cover')}
                    style={styles.coverContainer}
                >
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.coverImage} />
                    ) : (
                        <View style={styles.coverPlaceholder}>
                            {/* Decorative circles for the default cover */}
                            <View style={[styles.decorCircle, styles.decorCircle1]} />
                            <View style={[styles.decorCircle, styles.decorCircle2]} />
                            <View style={[styles.decorCircle, styles.decorCircle3]} />
                        </View>
                    )}

                    {/* Cover overlay with icon */}
                    <View style={styles.coverOverlay}>
                        {pickingCover ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <View style={styles.coverIconBadge}>
                                <Ionicons name="camera-outline" size={18} color={Colors.white} />
                                <Text style={styles.coverIconText}>
                                    {coverUri ? 'Change Cover' : 'Add Cover Photo'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Skip button floating on top-right of cover */}
                    <TouchableOpacity
                        style={styles.skipButtonTop}
                        onPress={handleSkip}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.skipButtonTopText}>Skip for now</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                    </TouchableOpacity>
                </TouchableOpacity>

                {/* ── Avatar Section ── */}
                <View style={styles.avatarWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => pickImage('avatar')}
                        style={styles.avatarContainer}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                {pickingAvatar ? (
                                    <ActivityIndicator color={Colors.primary} size="small" />
                                ) : (
                                    <Ionicons
                                        name="person"
                                        size={44}
                                        color={Colors.inputPlaceholder}
                                    />
                                )}
                            </View>
                        )}

                        {/* Camera badge */}
                        <View style={styles.avatarBadge}>
                            {pickingAvatar ? (
                                <ActivityIndicator color={Colors.white} size={12} />
                            ) : (
                                <Ionicons name="camera" size={16} color={Colors.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Heading Section ── */}
                <View style={styles.headingSection}>
                    <Text style={styles.heading}>Set up your profile</Text>
                    <Text style={styles.subtitle}>
                        Tell the world a little about yourself.{'\n'}
                        All fields are optional — you can update anytime.
                    </Text>
                </View>

                {/* ── Bio Section ── */}
                <View style={styles.bioSection}>
                    <Text style={styles.bioLabel}>Bio</Text>
                    <View
                        style={[
                            styles.bioInputContainer,
                            bioFocused && styles.bioInputContainerFocused,
                        ]}
                    >
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Write something about yourself..."
                            placeholderTextColor={Colors.inputPlaceholder}
                            multiline
                            maxLength={BIO_MAX_LENGTH}
                            value={bio}
                            onChangeText={setBio}
                            onFocus={() => setBioFocused(true)}
                            onBlur={() => setBioFocused(false)}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={styles.charCounter}>
                        {bio.length}/{BIO_MAX_LENGTH}
                    </Text>
                </View>

                {/* ── Buttons Section ── */}
                <View style={styles.buttonsSection}>
                    <CustomButton
                        title="Continue"
                        onPress={handleContinue}
                        type="simple"
                    />
                    <TouchableOpacity
                        style={styles.skipButtonBottom}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipButtonBottomText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 50,
    },

    /* ── Cover Photo ── */
    coverContainer: {
        width: screenWidth,
        height: COVER_HEIGHT,
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.primary,
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.08,
        backgroundColor: Colors.white,
    },
    decorCircle1: {
        width: 220,
        height: 220,
        top: -60,
        right: -40,
    },
    decorCircle2: {
        width: 160,
        height: 160,
        bottom: -50,
        left: -30,
    },
    decorCircle3: {
        width: 100,
        height: 100,
        top: 30,
        left: screenWidth * 0.4,
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverIconBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    coverIconText: {
        color: Colors.white,
        fontFamily: 'Outfit-Medium',
        fontSize: 13,
    },

    /* ── Skip (Top) ── */
    skipButtonTop: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 38,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 2,
    },
    skipButtonTopText: {
        color: Colors.white,
        fontFamily: 'Outfit-Medium',
        fontSize: 13,
    },

    /* ── Avatar ── */
    avatarWrapper: {
        alignItems: 'center',
        marginTop: -(AVATAR_SIZE / 2),
        zIndex: 10,
    },
    avatarContainer: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 4,
        borderColor: Colors.background,
        elevation: 6,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: AVATAR_SIZE / 2,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.background,
    },

    /* ── Heading ── */
    headingSection: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 30,
    },
    heading: {
        fontSize: 26,
        fontFamily: 'Outfit-Bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },

    /* ── Bio ── */
    bioSection: {
        marginTop: 30,
        paddingHorizontal: screenWidth * 0.05,
    },
    bioLabel: {
        fontSize: 15,
        fontFamily: 'Outfit-Medium',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    bioInputContainer: {
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
    },
    bioInputContainerFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.background,
    },
    bioInput: {
        height: 120,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
        color: Colors.textPrimary,
    },
    charCounter: {
        textAlign: 'right',
        marginTop: 6,
        marginRight: 4,
        fontSize: 12,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
    },

    /* ── Buttons ── */
    buttonsSection: {
        alignItems: 'center',
        marginTop: 36,
        gap: 14,
    },
    skipButtonBottom: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    skipButtonBottomText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 15,
        color: Colors.textTertiary,
    },
});
