import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { processDocument } from '../ai/documentProcessor';
import DocumentItem from '../components/document_item';
import CustomPopup from '../components/popup';
import {
    DocumentData,
    addDocumentToFirestore,
    deleteDocument,
    subscribeToDocuments,
    uploadFileToStorage,
} from '../services/documentService';
import { useAuthStore } from '../store';
import { Colors } from '../utlis/color';

export default function NotesScreen() {
    const router = useRouter();
    const { subjectid } = useLocalSearchParams<{ subjectid: string }>();
    const { user, subjects } = useAuthStore();

    // Find current subject
    const subject = subjects.find((s) => s.subjectid === subjectid);

    // States
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [textNoteOpen, setTextNoteOpen] = useState(false);
    const [textNoteTitle, setTextNoteTitle] = useState('');
    const [textNoteContent, setTextNoteContent] = useState('');
    const [textNoteLoading, setTextNoteLoading] = useState(false);

    // Popup State
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');

    // Subscribe to real-time updates
    useEffect(() => {
        if (!subjectid) return;
        setLoading(true);
        const unsubscribe = subscribeToDocuments(
            subjectid,
            (updatedDocs) => {
                setDocuments(updatedDocs);
                setLoading(false);
            },
            (error) => {
                console.error('Subscription error:', error);
                showErrorPopup('Error', 'Failed to sync documents in real-time.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [subjectid]);

    const showSuccessPopup = (title: string, message: string) => {
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupType('success');
        setPopupVisible(true);
    };

    const showErrorPopup = (title: string, message: string) => {
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupType('error');
        setPopupVisible(true);
    };

    const handlePickAndUpload = async (typeCategory: 'PDF' | 'Word' | 'Image' | 'Text') => {
        if (!subjectid || !user) return;

        let mimeTypes: string[] = [];
        switch (typeCategory) {
            case 'PDF':
                mimeTypes = ['application/pdf'];
                break;
            case 'Word':
                mimeTypes = [
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                ];
                break;
            case 'Image':
                mimeTypes = ['image/*'];
                break;
            case 'Text':
                mimeTypes = ['text/plain'];
                break;
        }

        try {
            const pickerResult = await DocumentPicker.getDocumentAsync({
                type: mimeTypes,
                copyToCacheDirectory: true,
            });

            if (pickerResult.canceled) return;

            const selectedAsset = pickerResult.assets[0];
            if (!selectedAsset.uri) {
                showErrorPopup('Pick Failed', 'Could not retrieve selected file URI.');
                return;
            }

            setActionMessage(`Uploading ${selectedAsset.name}...`);
            setActionLoading(true);

            // 1. Upload file to Supabase Storage
            const publicUrl = await uploadFileToStorage(
                subjectid,
                selectedAsset.uri,
                selectedAsset.name,
                selectedAsset.mimeType || 'application/octet-stream'
            );

            console.log("Uploaded to supabase successfully")

            // 2. Save document metadata to Firestore
            const docId = await addDocumentToFirestore(subjectid, {
                fileName: selectedAsset.name,
                fileUrl: publicUrl,
                fileType: typeCategory.toLowerCase(),
                uploadedBy: user.displayName || user.email || 'Author',
            });

            // 3. Generate document embeddings asynchronously using LangChain pipeline
            try {
                setActionMessage(`Processing embeddings for ${selectedAsset.name}...`);
                const result = await processDocument(
                    { type: 'local', uri: selectedAsset.uri },
                    typeCategory.toLowerCase(),
                    {
                        documentId: docId,
                        subjectId: subjectid,
                        userId: user.uid,
                        source: publicUrl,
                        fileType: typeCategory.toLowerCase(),
                    }
                );
                console.log(`[AI Embeddings] Successfully processed ${result.metadata.totalChunks} chunks:`, result);
            } catch (embedError: any) {
                console.error('[AI Embeddings] Embedding generation failed:', embedError);
            }

            showSuccessPopup('Upload Success', `"${selectedAsset.name}" has been uploaded and processed successfully.`);
        } catch (error: any) {
            console.error('File pick or upload failed:', error);
            showErrorPopup('Upload Error', error?.message || 'An error occurred while uploading the file.');
        } finally {
            setActionLoading(false);
            setActionMessage('');
        }
    };

    const handleOpenTextEntry = () => {
        setTextNoteOpen(true);
        setTextNoteTitle('');
        setTextNoteContent('');
    };

    const handleSaveTextNote = async () => {
        if (!subjectid || !user) return;
        if (!textNoteContent.trim()) {
            showErrorPopup('Empty Note', 'Please enter some text before saving.');
            return;
        }

        setTextNoteLoading(true);
        const title = textNoteTitle.trim() || 'Text Note';
        const safeName = title.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        const fileName = `${safeName || 'Text_Note'}_${Date.now()}.txt`;

        try {
            const textBlob = new Blob([textNoteContent], { type: 'text/plain' });
            const publicUrl = await uploadFileToStorage(subjectid, textBlob, fileName, 'text/plain');

            const docId = await addDocumentToFirestore(subjectid, {
                fileName,
                fileUrl: publicUrl,
                fileType: 'text',
                uploadedBy: user.displayName || user.email || 'Author',
            });

            try {
                setActionMessage(`Processing embeddings for ${title}...`);
                await processDocument(
                    { type: 'remote', url: publicUrl },
                    'text',
                    {
                        documentId: docId,
                        subjectId: subjectid,
                        userId: user.uid,
                        source: publicUrl,
                        fileType: 'text',
                    }
                );
                console.log(`[AI Embeddings] Successfully processed text note ${title}`);
            } catch (embedError: any) {
                console.error('[AI Embeddings] Text note embedding generation failed:', embedError);
            }

            setTextNoteOpen(false);
            setTextNoteTitle('');
            setTextNoteContent('');
            showSuccessPopup('Note Saved', `"${title}" has been added to your notes.`);
        } catch (error: any) {
            console.error('Saving text note failed:', error);
            showErrorPopup('Save Error', error?.message || 'Unable to save your text note.');
        } finally {
            setTextNoteLoading(false);
        }
    };

    const handleDelete = async (doc: DocumentData) => {
        if (!subjectid) return;
        try {
            setDeletingId(doc.id);
            setActionMessage('Deleting document...');
            setActionLoading(true);

            await deleteDocument(subjectid, doc.id, doc.fileUrl);

            showSuccessPopup('Deleted', `"${doc.fileName}" has been deleted.`);
        } catch (error: any) {
            console.error('Delete failed:', error);
            showErrorPopup('Delete Error', error?.message || 'Could not delete the file.');
        } finally {
            setDeletingId(null);
            setActionLoading(false);
            setActionMessage('');
        }
    };

    if (!subject) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Feather name="alert-triangle" size={48} color={Colors.error} />
                <Text style={styles.errorTitle}>Subject not found</Text>
                <TouchableOpacity
                    style={styles.backButtonLarge}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonLargeText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={20} color={Colors.primary} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {subject.subjectname}
                    </Text>
                    <Text style={styles.headerSubtitle}>Notes & Resources</Text>
                </View>

                <View style={{ width: 40 }} />
            </View>

            {/* Action Bar / Category triggers */}
            <View style={styles.actionBarContainer}>
                <Text style={styles.sectionTitle}>Add New Document</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => handlePickAndUpload('PDF')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="document-text" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.actionLabel}>PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => handlePickAndUpload('Word')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="logo-wordpress" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>Word</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => handlePickAndUpload('Image')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="image" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionLabel}>Images</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={handleOpenTextEntry}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="reader" size={24} color="#6B7280" />
                        </View>
                        <Text style={styles.actionLabel}>Text</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Document List View */}
            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Uploaded Materials ({documents.length})</Text>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Syncing subject notes...</Text>
                    </View>
                ) : documents.length > 0 ? (
                    <FlatList
                        data={documents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <DocumentItem
                                document={item}
                                onDelete={handleDelete}
                                isDeleting={deletingId === item.id}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Feather name="folder-plus" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No notes uploaded yet</Text>
                        <Text style={styles.emptySub}>
                            Tap one of the formats above to upload your study material.
                        </Text>
                    </View>
                )}
            </View>

            {/* Global Activity Overlay */}
            {actionLoading && (
                <View style={styles.overlay}>
                    <View style={styles.overlayCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.overlayText}>{actionMessage}</Text>
                    </View>
                </View>
            )}

            {/* Text Note Input Overlay */}
            {textNoteOpen && (
                <View style={styles.textNoteOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                            setTextNoteOpen(false);
                            setTextNoteTitle('');
                            setTextNoteContent('');
                        }}
                    />
                    <View style={styles.textNoteContainer}>
                        <Text style={styles.sectionTitle}>Write a Text Note</Text>
                        <TextInput
                            value={textNoteTitle}
                            onChangeText={setTextNoteTitle}
                            placeholder="Note title (optional)"
                            placeholderTextColor={Colors.inputPlaceholder}
                            style={styles.textNoteTitleInput}
                        />
                        <TextInput
                            value={textNoteContent}
                            onChangeText={setTextNoteContent}
                            placeholder="Type your note here..."
                            placeholderTextColor={Colors.inputPlaceholder}
                            style={styles.textNoteInput}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        <View style={styles.textNoteActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setTextNoteOpen(false);
                                    setTextNoteTitle('');
                                    setTextNoteContent('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, (!textNoteContent.trim() || textNoteLoading) && styles.saveButtonDisabled]}
                                onPress={handleSaveTextNote}
                                disabled={!textNoteContent.trim() || textNoteLoading}
                            >
                                {textNoteLoading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Note</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Custom Popup Feedback */}
            <CustomPopup
                visible={popupVisible}
                title={popupTitle}
                message={popupMessage}
                buttonText="Okay"
                buttonIcon={popupType === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                mainIcon={popupType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                mainIconColor={popupType === 'success' ? Colors.success : Colors.error}
                buttonColor={Colors.primary}
                onPress={() => setPopupVisible(false)}
                onClose={() => setPopupVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        color: Colors.textPrimary,
        marginTop: 16,
        marginBottom: 24,
    },
    backButtonLarge: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    backButtonLargeText: {
        color: Colors.white,
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
    },
    header: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        color: Colors.primary,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 11,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
        marginTop: 1,
    },
    actionBarContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    textNoteOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 9, 73, 0.4)',
        justifyContent: 'flex-end',
        zIndex: 100,
    },
    textNoteContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    textNoteTitleInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    textNoteInput: {
        width: '100%',
        minHeight: 140,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        color: Colors.textPrimary,
    },
    textNoteActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        color: Colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: Colors.tabInactive,
    },
    saveButtonText: {
        fontSize: 14,
        fontFamily: 'Outfit-Bold',
        color: Colors.white,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: 'Outfit-Bold',
        color: Colors.primary,
        marginBottom: 14,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        width: '22%',
    },
    actionIconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontFamily: 'Outfit-Medium',
        color: Colors.textSecondary,
    },
    listSection: {
        flex: 1,
        padding: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        color: Colors.textSecondary,
        marginTop: 16,
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 13,
        fontFamily: 'Outfit-Regular',
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 9, 73, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    overlayCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        width: '80%',
    },
    overlayText: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
