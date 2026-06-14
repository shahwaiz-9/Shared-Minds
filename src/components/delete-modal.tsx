// import { Ionicons } from "@expo/vector-icons";
// import React from 'react';
// import {
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Modal,
//     Platform,
//     Pressable,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View
// } from 'react-native';
// import { Colors } from "../utlis/color";

// interface DeleteModalProps {
//     visible: boolean;
//     onClose: () => void;
//     onDelete: () => void;
//     subjectName: string;
//     confirmText: string;
//     setConfirmText: (text: string) => void;
//     isDeleting: boolean;
// }

// export default function DeleteSubjectModal({
//     visible,
//     onClose,
//     onDelete,
//     subjectName,
//     confirmText,
//     setConfirmText,
//     isDeleting
// }: DeleteModalProps) {
//     return (
//         <Modal
//             visible={visible}
//             animationType="fade"
//             transparent
//             statusBarTranslucent
//             onRequestClose={onClose}
//         >
//             <Pressable style={styles.overlay} onPress={onClose}>
//                 <KeyboardAvoidingView
//                     behavior={Platform.OS === "ios" ? "padding" : "height"}
//                     style={styles.avoidingView}
//                 >
//                     <ScrollView
//                         contentContainerStyle={styles.scrollContent}
//                         keyboardShouldPersistTaps="handled"
//                     >
//                         <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
//                             <View style={styles.iconContainer}>
//                                 <Ionicons name="warning" size={40} color={Colors.error} />
//                             </View>

//                             <Text style={styles.title}>Delete Subject?</Text>
//                             <Text style={styles.message}>
//                                 This will permanently remove <Text style={styles.bold}>{subjectName}</Text> and all its notes. This action is irreversible.
//                             </Text>

//                             <Text style={styles.label}>Type the subject name exactly to confirm:</Text>
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder={subjectName}
//                                 value={confirmText}
//                                 onChangeText={setConfirmText}
//                                 autoCapitalize="none"
//                                 autoCorrect={false}
//                             />

//                             <View style={styles.buttonRow}>
//                                 <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//                                     <Text style={styles.cancelText}>Cancel</Text>
//                                 </TouchableOpacity>

//                                 <TouchableOpacity
//                                     style={[styles.deleteButton, confirmText !== subjectName && styles.disabledButton]}
//                                     onPress={onDelete}
//                                     disabled={confirmText !== subjectName || isDeleting}
//                                 >
//                                     {isDeleting ? (
//                                         <ActivityIndicator size="small" color={Colors.white} />
//                                     ) : (
//                                         <Text style={styles.deleteText}>Delete</Text>
//                                     )}
//                                 </TouchableOpacity>
//                             </View>
//                         </Pressable>
//                     </ScrollView>
//                 </KeyboardAvoidingView>
//             </Pressable>
//         </Modal>
//     );
// }

// const styles = StyleSheet.create({
//     overlay: { flex: 1, backgroundColor: "rgba(9, 9, 73, 0.45)" },
//     avoidingView: { flex: 1 },
//     scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
//     card: {
//         width: "100%", backgroundColor: Colors.white, borderRadius: 24,
//         padding: 24, alignItems: "center"
//     },
//     iconContainer: {
//         width: 70, height: 70, borderRadius: 35, backgroundColor: "#FEE2E2",
//         justifyContent: "center", alignItems: "center", marginBottom: 16
//     },
//     title: { fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.error, marginBottom: 8 },
//     message: { fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 },
//     bold: { fontWeight: "bold", color: Colors.textPrimary },
//     label: { fontSize: 13, fontFamily: "Outfit-Medium", color: Colors.textTertiary, alignSelf: "flex-start", marginBottom: 6 },
//     input: {
//         width: "100%", borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
//         height: 46, paddingHorizontal: 12, fontFamily: "Outfit-Regular", color: Colors.textPrimary, marginBottom: 20
//     },
//     buttonRow: { flexDirection: "row", gap: 12, width: "100%" },
//     cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: "center", alignItems: "center" },
//     cancelText: { fontFamily: "Outfit-Medium", color: Colors.textSecondary, fontSize: 15 },
//     deleteButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.error, justifyContent: "center", alignItems: "center" },
//     disabledButton: { backgroundColor: "#FCA5A5" },
//     deleteText: { fontFamily: "Outfit-Bold", color: Colors.white, fontSize: 15 }
// });