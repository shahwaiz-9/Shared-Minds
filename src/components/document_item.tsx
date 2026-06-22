import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Linking, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DocumentData } from '../services/documentService';
import { Colors } from '../utlis/color';

interface DocumentItemProps {
    document: DocumentData;
    onDelete: (doc: DocumentData) => void;
    isDeleting?: boolean;
}

export default function DocumentItem({ document, onDelete, isDeleting = false }: DocumentItemProps) {
    const [showOptions, setShowOptions] = useState(false);

    // Determine color theme and icon based on file type/extension
    const getFileMeta = (type: string, name: string) => {
        const lowerType = type.toLowerCase();
        const extension = name.substring(name.lastIndexOf('.')).toLowerCase();

        if (lowerType.includes('pdf') || extension === '.pdf') {
            return {
                iconName: 'file-text' as const,
                iconColor: '#EF4444', // Red for PDF
                bgColor: '#FEE2E2',
                label: 'PDF',
            };
        } else if (
            lowerType.includes('word') ||
            lowerType.includes('document') ||
            extension === '.docx' ||
            extension === '.doc'
        ) {
            return {
                iconName: 'file-text' as const,
                iconColor: '#3B82F6', // Blue for Word
                bgColor: '#DBEAFE',
                label: 'Word',
            };
        } else if (lowerType.includes('image') || ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)) {
            return {
                iconName: 'image' as const,
                iconColor: '#10B981', // Green for Images
                bgColor: '#D1FAE5',
                label: 'Image',
            };
        } else {
            return {
                iconName: 'file' as const,
                iconColor: '#6B7280', // Grey for Text/other
                bgColor: '#F3F4F6',
                label: 'Text',
            };
        }
    };

    const fileMeta = getFileMeta(document.fileType, document.fileName);

    const handlePress = async () => {
        if (!document.fileUrl) return;
        try {
            const supported = await Linking.canOpenURL(document.fileUrl);
            if (supported) {
                await Linking.openURL(document.fileUrl);
            }
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                style={styles.mainClickable}
            >
                {/* File Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: fileMeta.bgColor }]}>
                    <Feather
                        name={fileMeta.iconName}
                        size={24}
                        color={fileMeta.iconColor}
                    />
                </View>

                {/* Details Container */}
                <View style={styles.detailsContainer}>
                    <Text
                        style={styles.fileName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {document.fileName}
                    </Text>

                    <Text style={styles.metaText}>
                        {new Date(document.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}{' '}
                        • By {document.uploadedBy.split('@')[0]}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Menu Options / Action Button */}
            <View style={styles.actionSection}>
                {isDeleting ? (
                    <ActivityIndicator size="small" color={Colors.error} style={styles.spinner} />
                ) : (
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setShowOptions(!showOptions)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather
                            name={showOptions ? 'x' : 'more-vertical'}
                            size={18}
                            color={Colors.textTertiary}
                        />
                    </TouchableOpacity>
                )}

                {/* Option Bubble */}
                {showOptions && !isDeleting && (
                    <View style={styles.optionsBubble}>
                        <TouchableOpacity
                            style={styles.deleteOption}
                            onPress={() => {
                                setShowOptions(false);
                                onDelete(document);
                            }}
                        >
                            <Ionicons name="trash-outline" size={16} color={Colors.error} />
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
    },
    mainClickable: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        marginLeft: 14,
        flex: 1,
        justifyContent: 'center',
    },
    fileName: {
        fontSize: 15,
        fontFamily: 'Outfit-Bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
    },
    actionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    menuButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    spinner: {
        marginHorizontal: 8,
    },
    optionsBubble: {
        position: 'absolute',
        right: 40,
        backgroundColor: Colors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        padding: 6,
        minWidth: 90,
    },
    deleteOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        gap: 6,
    },
    deleteText: {
        fontSize: 13,
        fontFamily: 'Outfit-Medium',
        color: Colors.error,
    },
});
