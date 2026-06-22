import DeleteSubjectModal from "@/components/delete-subject-modal";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import EditSubjectModal from "../components/edit-subject-modal";
import { deleteSubject, updateSubject } from "../firebase/collection/subject_collection";
import { getUserDocument } from "../firebase/collection/user_collection";
import { useAuthStore } from "../store/authStore";
import { Colors } from "../utlis/color";

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

    const handleOnSave = () => {

    }

    if (!subject) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.white, padding: 24 }}>
                <Feather name="alert-triangle" size={48} color={Colors.error} />
                <Text style={{ fontSize: 18, fontFamily: "Outfit-Bold", color: Colors.textPrimary, marginTop: 16, marginBottom: 24 }}>Subject not found</Text>
                <TouchableOpacity style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }} onPress={() => router.back()}>
                    <Text style={{ color: Colors.white, fontFamily: "Outfit-Bold", fontSize: 14 }}>Go Back</Text>
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
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

            {/* Header */}
            <View style={{
                marginTop: 40,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9"
            }}>

                <TouchableOpacity style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.surface,
                    justifyContent: "center",
                    alignItems: "center"
                }}
                    onPress={() => router.back()}>
                    <Feather name="arrow-left" size={20} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={{
                    fontSize: 18,
                    fontFamily: "Outfit-Bold",
                    color: Colors.primary
                }}>
                    Subject Hub
                </Text>

                <TouchableOpacity style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.surface,
                    justifyContent: "center",
                    alignItems: "center"
                }}
                    onPress={() => setEditModalVisible(true)}>
                    <Feather name="edit-3" size={18} color={Colors.primary} />

                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 40
                }}
                showsVerticalScrollIndicator={false}>

                {/* Hero Section */}

                <View style={{
                    backgroundColor: Colors.primary,
                    borderRadius: 24,
                    padding: 24,
                    marginBottom: 24,
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 8
                }}>

                    <View style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16
                    }}>
                        <Text style={{
                            fontSize: 14,
                            fontFamily: "Outfit-Bold",
                            color: "#93C5FD", letterSpacing: 1
                        }}>
                            {subject.subjectcode || "NO CODE"}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, gap: 4, backgroundColor: subject.visibility === "public" ? "#EEF2FF" : "#FEE2E2" }}>
                            <Feather
                                name={subject.visibility === "public" ? "globe" : "lock"}
                                size={12}
                                color={subject.visibility === "public" ? Colors.primary : Colors.error}
                            />
                            <Text style={{ fontSize: 11, fontFamily: "Outfit-Bold", color: subject.visibility === "public" ? Colors.primary : Colors.error }}>
                                {subject.visibility === "public" ? "Public" : "Private"}
                            </Text>
                        </View>
                    </View>

                    <Text style={{ fontSize: 26, fontFamily: "Outfit-Bold", color: Colors.white, lineHeight: 32, marginBottom: 20 }}>{subject.subjectname}</Text>

                    <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.12)", marginBottom: 16 }} />

                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Feather name="user" size={14} color="#64748B" />
                            <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: "#94A3B8" }}>Owner</Text>
                            <Text style={{ fontSize: 13, fontFamily: "Outfit-Bold", color: Colors.white, flexShrink: 1 }} numberOfLines={1}>{ownerName}</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Feather name="calendar" size={14} color="#64748B" />
                            <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: "#94A3B8" }}>Created</Text>
                            <Text style={{ fontSize: 13, fontFamily: "Outfit-Bold", color: Colors.white, flexShrink: 1 }}>
                                {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : "N/A"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description Block */}
                {subject.subjectdescription ? (
                    <View style={{ backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.border }}>
                        <Text style={{ fontSize: 16, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 12 }}>Overview</Text>
                        <Text style={{ fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textSecondary, lineHeight: 22 }}>{subject.subjectdescription}</Text>
                    </View>
                ) : null}

                {/* Actions Grid */}
                <Text style={{ fontSize: 16, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 12 }}>Actions & Tools</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
                    {/* Action: Notes */}
                    <TouchableOpacity
                        style={{ width: "48%", backgroundColor: Colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 4 }}
                        onPress={() => {
                            router.push(`/notes?subjectid=${subject.subjectid}`);
                        }}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12, backgroundColor: "#EEF2FF" }}>
                            <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                        </View>
                        <Text style={{ fontSize: 15, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>Notes</Text>
                        <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>Manage materials</Text>
                    </TouchableOpacity>

                    {/* Action: Start Chat */}
                    <TouchableOpacity
                        style={{ width: "48%", backgroundColor: Colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 4 }}
                        onPress={() => {
                            router.push(`/chat?subjectid=${subject.subjectid}`);
                        }}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12, backgroundColor: "#F0FDF4" }}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.success} />
                        </View>
                        <Text style={{ fontSize: 15, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>AI Chat</Text>
                        <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>Launch assistant</Text>
                    </TouchableOpacity>

                    {/* Action: Edit */}
                    <TouchableOpacity
                        style={{ width: "48%", backgroundColor: Colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 4 }}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12, backgroundColor: "#FEF3C7" }}>
                            <Ionicons name="options-outline" size={24} color={Colors.warning} />
                        </View>
                        <Text style={{ fontSize: 15, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>Edit Info</Text>
                        <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>Update properties</Text>
                    </TouchableOpacity>

                    {/* Action: Delete */}
                    <TouchableOpacity
                        style={{ width: "48%", backgroundColor: Colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#FEE2E2", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 4 }}
                        onPress={() => setDeleteModalVisible(true)}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12, backgroundColor: "#FEE2E2" }}>
                            <Ionicons name="trash-outline" size={24} color={Colors.error} />
                        </View>
                        <Text style={{ fontSize: 15, fontFamily: "Outfit-Bold", color: Colors.error, marginBottom: 4 }}>Delete</Text>
                        <Text style={{ fontSize: 11, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>Destructive action</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <EditSubjectModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                subjectName={editName}
                subjectCode={editCode}
                subjectDescription={editDescription}
                subjectVisibility={editVisibility}
                loading={loading}
                isFormValid={isEditFormValid}
                onNameChange={setEditName}
                onCodeChange={setEditCode}
                onDescriptionChange={setEditDescription}
                onVisibilityChange={setEditVisibility}
                onSave={handleUpdate}
            />

            {/* DESTRUCTION SAFEGUARD MODAL */}
            <DeleteSubjectModal
                visible={deleteModalVisible}
                onClose={() => {
                    setDeleteConfirmText("");
                    setDeleteModalVisible(false);
                }}
                subjectName={subject.subjectname}
                confirmText={deleteConfirmText}
                onConfirmTextChange={setDeleteConfirmText}
                onDelete={handleDelete}
                isDeleting={isDeleting}
            />

        </View>
    );
}


