import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CustomButton from "../../components/button";
import CustomPopup from "../../components/popup";
import CustomTextField from "../../components/textfield";
import { createSubject } from "../../firebase/collection/subject_collection";
import { useAuthStore } from "../../store/authStore";
import { Colors } from "../../utlis/color";

export default function CreateScreen() {
    const router = useRouter();
    const { user, fetchSubjects } = useAuthStore();

    // Form states
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("public");

    // UI/Interaction states
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Popup notification state
    const [popupState, setPopupState] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttonText: string;
        mainIcon: keyof typeof Ionicons.glyphMap;
        mainIconColor: string;
        buttonColor: string;
        onPress: () => void;
    }>({
        visible: false,
        title: "",
        message: "",
        buttonText: "OK",
        mainIcon: "checkmark-circle",
        mainIconColor: Colors.success,
        buttonColor: Colors.primary,
        onPress: () => { },
    });

    // Compute field evaluation errors instantly on the fly (replaces the error state useEffect hook)
    const errors = {
        subjectName: subjectName.trim() && subjectName.trim().length < 3 ? "Subject name must be at least 3 characters." : undefined,
        subjectCode: subjectCode.trim() && subjectCode.trim().length < 2 ? "Subject code must be at least 2 characters (e.g., CS101)." : undefined,
        description: description.length > 200 ? `Description cannot exceed 200 characters (current: ${description.length}).` : undefined,
    };

    // Form Validation Check
    const isFormValid =
        subjectName.trim().length >= 3 &&
        subjectCode.trim().length >= 2 &&
        !errors.subjectName &&
        !errors.subjectCode &&
        !errors.description;

    const showPopup = (
        title: string,
        message: string,
        type: "success" | "error",
        onConfirm: () => void
    ) => {
        setPopupState({
            visible: true,
            title,
            message,
            buttonText: type === "success" ? "Done" : "Try Again",
            mainIcon: type === "success" ? "checkmark-circle" : "alert-circle",
            mainIconColor: type === "success" ? Colors.success : Colors.error,
            buttonColor: type === "success" ? Colors.primary : Colors.error,
            onPress: onConfirm,
        });
    };

    const handleCreateSubject = async () => {
        if (!isFormValid || loading) return;
        console.log(user)

        if (!user?.uid) {
            showPopup(
                "Authentication Error",
                "You must be logged in to create a subject.",
                "error",
                () => setPopupState(prev => ({ ...prev, visible: false }))
            );
            return;
        }

        setLoading(true);

        try {
            await createSubject({
                subjectname: subjectName,
                subjectcode: subjectCode,
                subjectdescription: description,
                visibility: visibility,
                ownerid: user.uid,
            });

            showPopup(
                "Subject Created!",
                `"${subjectName.trim()}" has been successfully created.`,
                "success",
                async () => {
                    setPopupState(prev => ({ ...prev, visible: false }));
                    setSubjectName("");
                    setSubjectCode("");
                    setDescription("");
                    setVisibility("public");
                    await fetchSubjects();
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/application/home");
                    }
                }
            );
        } catch (error: any) {
            console.error("Failed to create subject:", error);
            showPopup(
                "Creation Failed",
                error.message || "An unexpected error occurred while saving the subject. Please try again.",
                "error",
                () => setPopupState(prev => ({ ...prev, visible: false }))
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            {/* <Header title="Create Subject" /> */}

            <View style={{
                marginTop: 50,
                alignItems: 'center'
            }}>
                <Text style={{
                    fontFamily: 'Outfit-Bold',
                    fontSize: 24,
                    color: Colors.primary,

                }}>
                    Create Subject

                </Text>
                {/* <View style={{ height: 0.2, width: '90%', backgroundColor: Colors.primary, marginTop: 5 }} /> */}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 16,
                        paddingBottom: Platform.OS === "ios" ? 120 : 80,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={{ fontSize: 15, color: Colors.textSecondary, fontFamily: "Outfit-Regular", lineHeight: 22, marginBottom: 24 }}>
                        Set up a new subject to organize your notes, flashcards, and group study.
                    </Text>

                    {/* Subject Name Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", fontFamily: "Outfit-Medium", color: Colors.textPrimary, marginBottom: 8 }}>
                            Subject Name *
                        </Text>
                        <CustomTextField
                            placeholder="e.g., Artificial Intelligence"
                            value={subjectName}
                            onChangeText={setSubjectName}
                            onFocus={() => setFocusedField("name")}
                            onBlur={() => setFocusedField(null)}
                            containerStyle={{
                                borderColor: errors.subjectName ? Colors.error : (focusedField === "name" ? Colors.primary : Colors.border),
                                backgroundColor: errors.subjectName ? "#FFF5F5" : (focusedField === "name" ? Colors.white : Colors.surface),
                                shadowColor: focusedField === "name" && !errors.subjectName ? Colors.primary : '#000',
                                shadowOffset: focusedField === "name" && !errors.subjectName ? { width: 0, height: 4 } : { width: 0, height: 2 },
                                shadowOpacity: focusedField === "name" && !errors.subjectName ? 0.05 : 0.05,
                                shadowRadius: focusedField === "name" && !errors.subjectName ? 8 : 4,
                                elevation: focusedField === "name" && !errors.subjectName ? 2 : 2,
                            }}
                            inputStyle={{ fontFamily: "Outfit-Regular", color: Colors.textPrimary }}
                        />
                        {errors.subjectName ? (
                            <Text style={{ fontSize: 12, color: Colors.error, fontFamily: "Outfit-Regular", marginTop: 6, paddingLeft: 4, fontWeight: "500" }}>{errors.subjectName}</Text>
                        ) : (
                            <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: "Outfit-Regular", marginTop: 6, paddingLeft: 4 }}>Between 3 and 50 characters.</Text>
                        )}
                    </View>

                    {/* Subject Code Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", fontFamily: "Outfit-Medium", color: Colors.textPrimary, marginBottom: 8 }}>
                            Subject Code *
                        </Text>
                        <CustomTextField
                            placeholder="e.g., CS-401"
                            value={subjectCode}
                            onChangeText={setSubjectCode}
                            onFocus={() => setFocusedField("code")}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="characters"
                            containerStyle={{
                                borderColor: errors.subjectCode ? Colors.error : (focusedField === "code" ? Colors.primary : Colors.border),
                                backgroundColor: errors.subjectCode ? "#FFF5F5" : (focusedField === "code" ? Colors.white : Colors.surface),
                                shadowColor: focusedField === "code" && !errors.subjectCode ? Colors.primary : '#000',
                                shadowOffset: focusedField === "code" && !errors.subjectCode ? { width: 0, height: 4 } : { width: 0, height: 2 },
                                shadowOpacity: focusedField === "code" && !errors.subjectCode ? 0.05 : 0.05,
                                shadowRadius: focusedField === "code" && !errors.subjectCode ? 8 : 4,
                                elevation: focusedField === "code" && !errors.subjectCode ? 2 : 2,
                            }}
                            inputStyle={{ fontFamily: "Outfit-Medium", color: Colors.textPrimary }}
                        />
                        {errors.subjectCode ? (
                            <Text style={{ fontSize: 12, color: Colors.error, fontFamily: "Outfit-Regular", marginTop: 6, paddingLeft: 4, fontWeight: "500" }}>{errors.subjectCode}</Text>
                        ) : (
                            <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: "Outfit-Regular", marginTop: 6, paddingLeft: 4 }}>Unique identifier code (e.g. CS101, MATH-10).</Text>
                        )}
                    </View>

                    {/* Description Input */}
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", fontFamily: "Outfit-Medium", color: Colors.textPrimary, marginBottom: 8 }}>Description</Text>
                            <Text style={{ fontSize: 12, fontFamily: "Outfit-Regular", color: description.length > 200 ? Colors.error : Colors.textTertiary, fontWeight: description.length > 200 ? "600" : "450" }}>
                                {description.length}/200
                            </Text>
                        </View>
                        <CustomTextField
                            placeholder="What will this subject focus on? Add key topics or notes..."
                            value={description}
                            onChangeText={setDescription}
                            onFocus={() => setFocusedField("description")}
                            onBlur={() => setFocusedField(null)}
                            multiline
                            numberOfLines={4}
                            containerStyle={{
                                borderColor: errors.description ? Colors.error : (focusedField === "description" ? Colors.primary : Colors.border),
                                backgroundColor: errors.description ? "#FFF5F5" : (focusedField === "description" ? Colors.white : Colors.surface),
                                shadowColor: focusedField === "description" && !errors.description ? Colors.primary : '#000',
                                shadowOffset: focusedField === "description" && !errors.description ? { width: 0, height: 4 } : { width: 0, height: 2 },
                                shadowOpacity: focusedField === "description" && !errors.description ? 0.05 : 0.05,
                                shadowRadius: focusedField === "description" && !errors.description ? 8 : 4,
                                elevation: focusedField === "description" && !errors.description ? 2 : 2,
                            }}
                            inputStyle={{ fontFamily: "Outfit-Regular", color: Colors.textPrimary }}
                        />
                        {errors.description && (
                            <Text style={{ fontSize: 12, color: Colors.error, fontFamily: "Outfit-Regular", marginTop: 6, paddingLeft: 4, fontWeight: "500" }}>{errors.description}</Text>
                        )}
                    </View>

                    {/* Visibility Selection */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", fontFamily: "Outfit-Medium", color: Colors.textPrimary, marginBottom: 8 }}>Privacy & Visibility</Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            {/* Public Option */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    borderWidth: 1.5,
                                    borderColor: visibility === "public" ? Colors.primary : Colors.border,
                                    borderRadius: 18,
                                    padding: 16,
                                    backgroundColor: visibility === "public" ? "#F4F4FF" : Colors.white,
                                }}
                                onPress={() => setVisibility("public")}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <Ionicons
                                        name="earth"
                                        size={22}
                                        color={visibility === "public" ? Colors.primary : Colors.textTertiary}
                                    />
                                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: visibility === "public" ? Colors.primary : Colors.border, justifyContent: "center", alignItems: "center" }}>
                                        {visibility === "public" && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />}
                                    </View>
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: "600", fontFamily: "Outfit-Medium", color: visibility === "public" ? Colors.primary : Colors.textPrimary, marginBottom: 4 }}>
                                    Public
                                </Text>
                                <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: "Outfit-Regular", lineHeight: 16 }}>
                                    Anyone can search and view this subject's materials.
                                </Text>
                            </TouchableOpacity>

                            {/* Private Option */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    borderWidth: 1.5,
                                    borderColor: visibility === "private" ? Colors.primary : Colors.border,
                                    borderRadius: 18,
                                    padding: 16,
                                    backgroundColor: visibility === "private" ? "#F4F4FF" : Colors.white,
                                }}
                                onPress={() => setVisibility("private")}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <Ionicons
                                        name="lock-closed"
                                        size={22}
                                        color={visibility === "private" ? Colors.primary : Colors.textTertiary}
                                    />
                                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: visibility === "private" ? Colors.primary : Colors.border, justifyContent: "center", alignItems: "center" }}>
                                        {visibility === "private" && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />}
                                    </View>
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: "600", fontFamily: "Outfit-Medium", color: visibility === "private" ? Colors.primary : Colors.textPrimary, marginBottom: 4 }}>
                                    Private
                                </Text>
                                <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: "Outfit-Regular", lineHeight: 16 }}>
                                    Only members you explicitly invite can access resources.
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Create Button Container */}
                    <View style={{ marginTop: 12, alignItems: "center", gap: 8 }}>
                        <CustomButton
                            title="Create Subject"
                            onPress={handleCreateSubject}
                            type="simple"
                            loading={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Custom Modal Popup for Success/Failure Alerts */}
            <CustomPopup
                visible={popupState.visible}
                title={popupState.title}
                message={popupState.message}
                buttonText={popupState.buttonText}
                buttonIcon="arrow-forward"
                onPress={popupState.onPress}
                onClose={() => setPopupState(prev => ({ ...prev, visible: false }))}
                mainIcon={popupState.mainIcon}
                mainIconColor={popupState.mainIconColor}
                buttonColor={popupState.buttonColor}
            />
        </SafeAreaView>
    );
}