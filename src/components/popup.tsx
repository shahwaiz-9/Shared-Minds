import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CustomPopupProps {
    visible: boolean;
    title: string;
    message: string;
    buttonText: string;
    buttonIcon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    onClose: () => void;
    mainIcon?: keyof typeof Ionicons.glyphMap;
    mainIconColor?: string;
    buttonColor?: string;
}

const CustomPopup: React.FC<CustomPopupProps> = ({
    visible,
    title,
    message,
    buttonText,
    buttonIcon,
    onPress,
    onClose,
    mainIcon = "checkmark-circle",
    mainIconColor = "#090949",
    buttonColor = "#090949",
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <Pressable
                    style={styles.container}
                    onPress={() => { }}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={mainIcon}
                            size={64}
                            color={mainIconColor}
                        />
                    </View>

                    <Text style={styles.title}>
                        {title}
                    </Text>

                    <Text style={styles.message}>
                        {message}
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: buttonColor }]}
                        activeOpacity={0.8}
                        onPress={onPress}
                    >
                        <Text style={styles.buttonText}>
                            {buttonText}
                        </Text>

                        <Ionicons
                            name={buttonIcon}
                            size={18}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default CustomPopup;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },

    iconContainer: {
        marginBottom: 16,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#090949',
        marginBottom: 10,
        textAlign: 'center',
    },

    message: {
        fontSize: 15,
        lineHeight: 22,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },

    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
        width: '100%',
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});