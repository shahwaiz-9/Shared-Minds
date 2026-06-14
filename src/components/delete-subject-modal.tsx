import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../utlis/color";

interface DeleteSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  subjectName: string;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function DeleteSubjectModal({
  visible,
  onClose,
  subjectName,
  confirmText,
  onConfirmTextChange,
  onDelete,
  isDeleting,
}: DeleteSubjectModalProps) {
  const isConfirmValid = confirmText === subjectName;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(9, 9, 73, 0.45)" }}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              style={{ width: "100%", backgroundColor: Colors.white, borderRadius: 24, padding: 24, alignItems: "center" }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="warning" size={40} color={Colors.error} />
              </View>

              <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.error, marginBottom: 8 }}>Delete Subject?</Text>

              <Text style={{ fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 }}>
                This will permanently remove <Text style={{ fontWeight: "bold", color: Colors.textPrimary }}>{subjectName}</Text> and all its notes.
              </Text>

              <Text style={{ fontSize: 13, fontFamily: "Outfit-Medium", color: Colors.textTertiary, alignSelf: "flex-start", marginBottom: 6 }}>
                Type the subject name exactly to confirm:
              </Text>

              <TextInput
                style={{ width: "100%", borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, height: 46, paddingHorizontal: 12, fontFamily: "Outfit-Regular", color: Colors.textPrimary, marginBottom: 20 }}
                placeholder={subjectName}
                value={confirmText}
                onChangeText={onConfirmTextChange}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                <TouchableOpacity
                  style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: "center", alignItems: "center" }}
                  onPress={onClose}
                >
                  <Text style={{ fontFamily: "Outfit-Medium", color: Colors.textSecondary, fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: isConfirmValid ? Colors.error : "#FCA5A5", justifyContent: "center", alignItems: "center" }}
                  onPress={onDelete}
                  disabled={!isConfirmValid || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={{ fontFamily: "Outfit-Bold", color: Colors.white, fontSize: 15 }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
