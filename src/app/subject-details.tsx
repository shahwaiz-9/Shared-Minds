import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "../utlis/color";
import { useAuthStore } from "../store/authStore";
import { getUserDocument } from "../firebase/collection/user_collection";
import { deleteSubject, updateSubject } from "../firebase/collection/subject_collection";
import CustomTextField from "../components/textfield";
import CustomButton from "../components/button";

export default function SubjectDetailsScreen() {
    const router = useRouter();
    const { subjectid } = useLocalSearchParams<{ subjectid: string }>();
    const { subjects, fetchSubjects } = useAuthStore();

    // Finding current subject in store
    const subject = subjects.find((s) => s.subjectid === subjectid);
    const [ownerName, setOwnerName] = useState<string>("Loading...");

    // UI/Interaction States
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editCode, setEditCode] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editVisibility, setEditVisibility] = useState<"public" | "private">("public");
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Deletion states
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch owner name
    useEffect(() => {
        if (subject) {
            setEditName(subject.subjectname);
            setEditCode(subject.subjectcode || "");
            setEditDescription(subject.subjectdescription || "");
            setEditVisibility(subject.visibility);

            const fetchOwner = async () => {
                try {
                    const userDoc = await getUserDocument(subject.ownerid);
                    setOwnerName(userDoc?.displayName || "Unknown");
                } catch (err) {
                    console.error("Error fetching owner:", err);
                    setOwnerName("Unknown");
                }
            };
            fetchOwner();
        }
    }, [subject]);

    if (!subject) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Feather name="alert-triangle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>Subject not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Validation for editing
    const isEditFormValid =
        editName.trim().length >= 3 &&
        editCode.trim().length >= 2;

    const handleUpdate = async () => {
        if (!isEditFormValid || loading) return;
        setLoading(true);
        try {
            await updateSubject(subject.subjectid, {
                subjectname: editName,
                subjectcode: editCode,
                subjectdescription: editDescription,
                visibility: editVisibility,
            });
            await fetchSubjects();
            setEditModalVisible(false);
        } catch (error) {
            console.error("Failed to update subject:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== subject.subjectname || isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteSubject(subject.subjectid);
            await fetchSubjects();
            setDeleteModalVisible(false);
            router.replace("/application/home");
        } catch (error) {
            console.error("Failed to delete subject:", error);
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subject Hub</Text>
                <TouchableOpacity style={styles.circleBtn} onPress={() => setEditModalVisible(true)}>
                    <Feather name="edit-3" size={18} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <Text style={styles.subjectCode}>{subject.subjectcode || "NO CODE"}</Text>
                        <View style={[styles.badge, { backgroundColor: subject.visibility === "public" ? "#EEF2FF" : "#FEE2E2" }]}>
                            <Feather
                                name={subject.visibility === "public" ? "globe" : "lock"}
                                size={12}
                                color={subject.visibility === "public" ? Colors.primary : Colors.error}
                            />
                            <Text style={[styles.badgeText, { color: subject.visibility === "public" ? Colors.primary : Colors.error }]}>
                                {subject.visibility === "public" ? "Public" : "Private"}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.subjectName}>{subject.subjectname}</Text>

                    <View style={styles.divider} />

                    <View style={styles.metaRow}>
                        <View style={styles.metaCol}>
                            <Feather name="user" size={14} color="#64748B" />
                            <Text style={styles.metaLabel}>Owner</Text>
                            <Text style={styles.metaValue} numberOfLines={1}>{ownerName}</Text>
                        </View>
                        <View style={styles.metaCol}>
                            <Feather name="calendar" size={14} color="#64748B" />
                            <Text style={styles.metaLabel}>Created</Text>
                            <Text style={styles.metaValue}>
                                {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : "N/A"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description Block */}
                {subject.subjectdescription ? (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <Text style={styles.descriptionText}>{subject.subjectdescription}</Text>
                    </View>
                ) : null}

                {/* Actions Grid */}
                <Text style={styles.sectionTitle}>Actions & Tools</Text>
                <View style={styles.gridContainer}>
                    {/* Action: Notes */}
                    <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() => {
                            // In the future, this will link to notes list: router.push(`/application/notes?subjectid=${subject.subjectid}`)
                            alert(`Navigate to Notes list for: ${subject.subjectname}`);
                        }}
                    >
                        <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
                            <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.gridItemTitle}>Notes</Text>
                        <Text style={styles.gridItemSub}>Manage materials</Text>
                    </TouchableOpacity>

                    {/* Action: Start Chat */}
                    <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() => {
                            // In the future, this launches AI chat: router.push(`/application/chat?subjectid=${subject.subjectid}`)
                            alert(`Start AI Chat for: ${subject.subjectname}`);
                        }}
                    >
                        <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.success} />
                        </View>
                        <Text style={styles.gridItemTitle}>AI Chat</Text>
                        <Text style={styles.gridItemSub}>Launch assistant</Text>
                    </TouchableOpacity>

                    {/* Action: Edit */}
                    <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                            <Ionicons name="options-outline" size={24} color={Colors.warning} />
                        </View>
                        <Text style={styles.gridItemTitle}>Edit Info</Text>
                        <Text style={styles.gridItemSub}>Update properties</Text>
                    </TouchableOpacity>

                    {/* Action: Delete */}
                    <TouchableOpacity
                        style={[styles.gridItem, styles.deleteGridItem]}
                        onPress={() => setDeleteModalVisible(true)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
                            <Ionicons name="trash-outline" size={24} color={Colors.error} />
                        </View>
                        <Text style={[styles.gridItemTitle, { color: Colors.error }]}>Delete</Text>
                        <Text style={styles.gridItemSub}>Destructive action</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* EDIT MODAL / BOTTOM SHEET */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                statusBarTranslucent
                onRequestClose={() => setEditModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.sheetWrapper}
                    >
                        <Pressable style={styles.sheetContainer} onPress={() => {}}>
                            {/* Drag Handle Indicator */}
                            <View style={styles.dragHandle} />

                            <View style={styles.sheetHeader}>
                                <Text style={styles.sheetTitle}>Edit Subject</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Feather name="x" size={20} color={Colors.textTertiary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                                {/* Name Input */}
                                <Text style={styles.inputLabel}>Subject Name *</Text>
                                <CustomTextField
                                    placeholder="Subject Name"
                                    value={editName}
                                    onChangeText={setEditName}
                                    onFocus={() => setFocusedField("name")}
                                    onBlur={() => setFocusedField(null)}
                                    containerStyle={getInputStyle(focusedField === "name")}
                                    inputStyle={styles.textInputStyle}
                                />

                                {/* Code Input */}
                                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Subject Code *</Text>
                                <CustomTextField
                                    placeholder="Subject Code"
                                    value={editCode}
                                    onChangeText={setEditCode}
                                    onFocus={() => setFocusedField("code")}
                                    onBlur={() => setFocusedField(null)}
                                    autoCapitalize="characters"
                                    containerStyle={getInputStyle(focusedField === "code")}
                                    inputStyle={styles.textInputStyle}
                                />

                                {/* Description Input */}
                                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Description</Text>
                                <CustomTextField
                                    placeholder="Details or learning outcomes..."
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    onFocus={() => setFocusedField("desc")}
                                    onBlur={() => setFocusedField(null)}
                                    multiline
                                    numberOfLines={3}
                                    containerStyle={getInputStyle(focusedField === "desc")}
                                    inputStyle={styles.textInputStyle}
                                />

                                {/* Visibility Toggles */}
                                <Text style={[styles.inputLabel, { marginTop: 14, marginBottom: 8 }]}>Visibility</Text>
                                <View style={styles.visibilityRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.visibilityBtn,
                                            editVisibility === "public" && styles.visibilityBtnActive,
                                        ]}
                                        onPress={() => setEditVisibility("public")}
                                    >
                                        <Feather name="globe" size={16} color={editVisibility === "public" ? Colors.white : Colors.primary} />
                                        <Text style={[styles.visibilityBtnTxt, editVisibility === "public" && styles.visibilityBtnTxtActive]}>
                                            Public
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.visibilityBtn,
                                            editVisibility === "private" && styles.visibilityBtnActive,
                                        ]}
                                        onPress={() => setEditVisibility("private")}
                                    >
                                        <Feather name="lock" size={16} color={editVisibility === "private" ? Colors.white : Colors.primary} />
                                        <Text style={[styles.visibilityBtnTxt, editVisibility === "private" && styles.visibilityBtnTxtActive]}>
                                            Private
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Action Buttons */}
                                <View style={[styles.sheetActionContainer, { opacity: isEditFormValid ? 1 : 0.5 }]}>
                                    <CustomButton
                                        title="Save Changes"
                                        onPress={isEditFormValid ? handleUpdate : () => {}}
                                        type="simple"
                                        loading={loading}
                                    />
                                </View>
                            </ScrollView>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>

            {/* DESTRUCTION SAFEGUARD MODAL */}
            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setDeleteModalVisible(false)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.centerModalWrapper}
                    >
                        <Pressable style={styles.deleteModalContainer} onPress={() => {}}>
                            <View style={styles.warningIconContainer}>
                                <Ionicons name="warning" size={40} color={Colors.error} />
                            </View>

                            <Text style={styles.deleteTitle}>Delete Subject?</Text>
                            <Text style={styles.deleteDesc}>
                                This will permanently remove <Text style={{ fontWeight: "bold", color: Colors.textPrimary }}>{subject.subjectname}</Text> and all its notes. This action is irreversible.
                            </Text>

                            <Text style={styles.confirmInstruction}>
                                Type the subject name exactly to confirm:
                            </Text>
                            <TextInput
                                style={styles.confirmInput}
                                placeholder={subject.subjectname}
                                value={deleteConfirmText}
                                onChangeText={setDeleteConfirmText}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={styles.deleteActionRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        setDeleteConfirmText("");
                                        setDeleteModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.deleteBtn,
                                        deleteConfirmText !== subject.subjectname && styles.deleteBtnDisabled,
                                    ]}
                                    onPress={handleDelete}
                                    disabled={deleteConfirmText !== subject.subjectname || isDeleting}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color={Colors.white} />
                                    ) : (
                                        <Text style={styles.deleteBtnText}>Delete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const getInputStyle = (focused: boolean) => ({
    borderColor: focused ? Colors.primary : Colors.border,
    backgroundColor: focused ? Colors.white : Colors.surface,
    borderRadius: 14,
    height: 50,
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.white,
        padding: 24,
    },
    errorText: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        color: Colors.textPrimary,
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    backButtonText: {
        color: Colors.white,
        fontFamily: "Outfit-Bold",
        fontSize: 14,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        color: Colors.primary,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroCard: {
        backgroundColor: Colors.primary,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    heroHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    subjectCode: {
        fontSize: 14,
        fontFamily: "Outfit-Bold",
        color: "#93C5FD",
        letterSpacing: 1,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 4,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: "Outfit-Bold",
    },
    subjectName: {
        fontSize: 26,
        fontFamily: "Outfit-Bold",
        color: Colors.white,
        lineHeight: 32,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metaCol: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaLabel: {
        fontSize: 11,
        fontFamily: "Outfit-Regular",
        color: "#94A3B8",
    },
    metaValue: {
        fontSize: 13,
        fontFamily: "Outfit-Bold",
        color: Colors.white,
        flexShrink: 1,
    },
    descriptionSection: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        color: Colors.primary,
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 14,
    },
    gridItem: {
        width: "48%",
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 4,
    },
    deleteGridItem: {
        borderColor: "#FEE2E2",
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    gridItemTitle: {
        fontSize: 15,
        fontFamily: "Outfit-Bold",
        color: Colors.primary,
        marginBottom: 4,
    },
    gridItemSub: {
        fontSize: 11,
        fontFamily: "Outfit-Regular",
        color: Colors.textTertiary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(9, 9, 73, 0.45)",
        justifyContent: "flex-end",
    },
    sheetWrapper: {
        width: "100%",
    },
    sheetContainer: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 10,
        maxHeight: "90%",
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#E2E8F0",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        color: Colors.primary,
    },
    sheetScroll: {
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: "Outfit-Bold",
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    textInputStyle: {
        fontFamily: "Outfit-Regular",
        color: Colors.textPrimary,
    },
    visibilityRow: {
        flexDirection: "row",
        gap: 12,
    },
    visibilityBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 14,
        paddingVertical: 12,
        backgroundColor: Colors.white,
    },
    visibilityBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    visibilityBtnTxt: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
        color: Colors.primary,
    },
    visibilityBtnTxtActive: {
        color: Colors.white,
    },
    sheetActionContainer: {
        marginTop: 24,
        alignItems: "center",
    },
    centerModalWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    deleteModalContainer: {
        width: "100%",
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    warningIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        color: Colors.error,
        marginBottom: 8,
    },
    deleteDesc: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    confirmInstruction: {
        fontSize: 13,
        fontFamily: "Outfit-Medium",
        color: Colors.textTertiary,
        alignSelf: "flex-start",
        marginBottom: 6,
    },
    confirmInput: {
        width: "100%",
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        height: 46,
        paddingHorizontal: 12,
        fontFamily: "Outfit-Regular",
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    deleteActionRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelBtnText: {
        fontFamily: "Outfit-Medium",
        color: Colors.textSecondary,
        fontSize: 15,
    },
    deleteBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.error,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteBtnDisabled: {
        backgroundColor: "#FCA5A5",
    },
    deleteBtnText: {
        fontFamily: "Outfit-Bold",
        color: Colors.white,
        fontSize: 15,
    },
});
