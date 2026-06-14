import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../utlis/color";
import CustomButton from "./button";
import CustomTextField from "./textfield";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;
const BOTTOM_INSET = Platform.OS === "ios" ? 34 : 0;

interface EditSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  subjectName: string;
  subjectCode: string;
  subjectDescription: string;
  subjectVisibility: "public" | "private";
  loading: boolean;
  isFormValid: boolean;
  onNameChange: (text: string) => void;
  onCodeChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onVisibilityChange: (visibility: "public" | "private") => void;
  onSave: () => void;
}

export default function EditSubjectModal({
  visible,
  onClose,
  subjectName,
  subjectCode,
  subjectDescription,
  subjectVisibility,
  loading,
  isFormValid,
  onNameChange,
  onCodeChange,
  onDescriptionChange,
  onVisibilityChange,
  onSave,
}: EditSubjectModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [isModalMounted, setIsModalMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsModalMounted(true); // Mount the modal
      // Trigger animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    } else {
      // Play closing animation then unmount
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start(() => setIsModalMounted(false));
    }
  }, [visible]);

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal
      visible={isModalMounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: Colors.overlay,
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? -BOTTOM_INSET : 0}
        >
          <Animated.View
            style={{
              backgroundColor: Colors.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: SHEET_MAX_HEIGHT,
              transform: [{ translateY: sheetTranslateY }],
            }}
          >
            <Pressable onPress={() => { }}>
              <View style={{ paddingTop: 10, paddingBottom: BOTTOM_INSET }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: "#E2E8F0",
                    borderRadius: 2,
                    alignSelf: "center",
                    marginBottom: 16,
                  }}
                />


                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 24,
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    {/* Icon Circle */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: Colors.surface, // Adjust based on your theme
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: Colors.border,
                      }}
                    >
                      <Feather name="edit-3" size={18} color={Colors.primary} />
                    </View>

                    <Text
                      style={{
                        fontSize: 20,
                        fontFamily: "Outfit-Bold",
                        color: Colors.textPrimary,
                      }}
                    >
                      Edit Subject
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose}>
                    <Feather name="x" size={20} color={Colors.textTertiary} />
                  </TouchableOpacity>

                </View>
                <View
                  style={{
                    height: 1,
                    width: '90%',
                    backgroundColor: Colors.border,
                    alignSelf: 'center',
                    marginBottom: 20,
                  }}
                />


                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Outfit-Bold",
                      color: Colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    Subject Name *
                  </Text>
                  <CustomTextField
                    placeholder="Subject Name"
                    value={subjectName}
                    onChangeText={onNameChange}
                    onFocus={() => { }}
                    onBlur={() => { }}
                    containerStyle={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surface,
                      borderRadius: 14,
                      height: 50,
                    }}
                    inputStyle={{
                      fontFamily: "Outfit-Regular",
                      color: Colors.textPrimary,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Outfit-Bold",
                      color: Colors.textPrimary,
                      marginBottom: 6,
                      marginTop: 14,
                    }}
                  >
                    Subject Code *
                  </Text>
                  <CustomTextField
                    placeholder="Subject Code"
                    value={subjectCode}
                    onChangeText={onCodeChange}
                    onFocus={() => { }}
                    onBlur={() => { }}
                    autoCapitalize="characters"
                    containerStyle={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surface,
                      borderRadius: 14,
                      height: 50,
                    }}
                    inputStyle={{
                      fontFamily: "Outfit-Regular",
                      color: Colors.textPrimary,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Outfit-Bold",
                      color: Colors.textPrimary,
                      marginBottom: 6,
                      marginTop: 14,
                    }}
                  >
                    Description
                  </Text>
                  <CustomTextField
                    placeholder="Details or learning outcomes..."
                    value={subjectDescription}
                    onChangeText={onDescriptionChange}
                    onFocus={() => { }}
                    onBlur={() => { }}
                    multiline
                    numberOfLines={3}
                    containerStyle={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surface,
                      borderRadius: 14,
                    }}
                    inputStyle={{
                      fontFamily: "Outfit-Regular",
                      color: Colors.textPrimary,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Outfit-Bold",
                      color: Colors.textPrimary,
                      marginTop: 14,
                      marginBottom: 8,
                    }}
                  >
                    Visibility
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      style={[
                        {
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
                        subjectVisibility === "public" && {
                          backgroundColor: Colors.primary,
                          borderColor: Colors.primary,
                        },
                      ]}
                      onPress={() => onVisibilityChange("public")}
                    >
                      <Feather
                        name="globe"
                        size={16}
                        color={
                          subjectVisibility === "public"
                            ? Colors.white
                            : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          {
                            fontSize: 14,
                            fontFamily: "Outfit-Medium",
                            color: Colors.primary,
                          },
                          subjectVisibility === "public" && {
                            color: Colors.white,
                          },
                        ]}
                      >
                        Public
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        {
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
                        subjectVisibility === "private" && {
                          backgroundColor: Colors.primary,
                          borderColor: Colors.primary,
                        },
                      ]}
                      onPress={() => onVisibilityChange("private")}
                    >
                      <Feather
                        name="lock"
                        size={16}
                        color={
                          subjectVisibility === "private"
                            ? Colors.white
                            : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          {
                            fontSize: 14,
                            fontFamily: "Outfit-Medium",
                            color: Colors.primary,
                          },
                          subjectVisibility === "private" && {
                            color: Colors.white,
                          },
                        ]}
                      >
                        Private
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingTop: 12,
                    marginBottom: 10,
                    marginTop: 10,
                    paddingBottom: Platform.OS === "ios" ? 8 : 16,
                    alignItems: "center",
                    opacity: isFormValid ? 1 : 0.5,
                  }}
                >
                  <CustomButton
                    title="Save Changes"
                    onPress={isFormValid ? onSave : () => { }}
                    type="simple"
                    loading={loading}
                  />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
