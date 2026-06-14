// import { useRouter } from 'expo-router';
// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Colors } from '../utlis/color';

// type HeaderProps = {
//     title: string;
//     onBackPress?: () => void;
//     rightComponent?: React.ReactNode;
// };

// export default function Header({ title, onBackPress, rightComponent }: HeaderProps) {
//     const router = useRouter();
//     const insets = useSafeAreaInsets();

//     const handleBack = () => {
//         if (onBackPress) {
//             onBackPress();
//         } else {
//             if (router.canGoBack()) {
//                 router.back();
//             }
//         }
//     };

//     return (
//         <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
//             <View style={styles.headerContent}>
//                 {/* <TouchableOpacity
//                     style={styles.backButton}
//                     onPress={handleBack}
//                     activeOpacity={0.7}
//                     accessibilityLabel="Go back"
//                     accessibilityRole="button"
//                 >
//                     <Ionicons name="chevron-back" size={24} color={Colors.primary} />
//                 </TouchableOpacity> */}

//                 <Text style={styles.title} numberOfLines={1}>
//                     {title}
//                 </Text>

//                 <View style={styles.rightContainer}>
//                     {rightComponent || <View style={styles.placeholder} />}
//                 </View>
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     headerContainer: {
//         backgroundColor: Colors.white,
//         borderBottomWidth: 1,
//         borderBottomColor: Colors.border,
//         paddingBottom: 12,
//         shadowColor: Colors.shadow,
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 3,
//         elevation: 2,
//     },
//     headerContent: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         alignContent: 'center',
//         paddingHorizontal: 16,
//         height: 44,
//     },
//     backButton: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: Colors.surface,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: Colors.border,
//     },
//     title: {
//         flex: 1,
//         fontSize: 20,
//         fontWeight: '700',
//         fontFamily: 'Outfit-Bold',
//         color: Colors.primary,
//         textAlign: 'center',
//         // marginHorizontal: 8,
//     },
//     rightContainer: {
//         minWidth: 40,
//         alignItems: 'flex-end',
//         justifyContent: 'center',
//     },
//     placeholder: {
//         width: 40,
//         height: 40,
//     },
// });
