import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { Colors } from '../utlis/color';

type CustomTextFieldProps = {
    type?: 'simple' | 'password';
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    onFocus?: () => void;
    onBlur?: () => void;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
};

export default function CustomTextField({
    type = 'simple',
    placeholder,
    value,
    onChangeText,
    multiline = false,
    numberOfLines = 1,
    autoCapitalize = 'none',
    onFocus,
    onBlur,
    containerStyle,
    inputStyle,
}: CustomTextFieldProps) {
    const width = Dimensions.get('window').width;

    const [focused, setFocused] = useState(false);
    const [secureText, setSecureText] = useState(type === 'password');

    return (
        <View
            style={[
                styles.container,
                {
                    width: width * 0.9,
                    minHeight: multiline ? 120 : 58,
                    alignItems: multiline ? 'flex-start' : 'center',
                    borderColor: focused ? Colors.primary : '#D9D9D9',
                },
                containerStyle,
            ]}
        >
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                    inputStyle,
                ]}
                placeholder={placeholder}
                placeholderTextColor="#8E8E93"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureText}
                onFocus={() => {
                    setFocused(true);
                    onFocus?.();
                }}
                onBlur={() => {
                    setFocused(false);
                    onBlur?.();
                }}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize={autoCapitalize}
            />

            {type === 'password' && (
                <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.iconContainer}
                >
                    <Ionicons
                        name={secureText ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#666"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1.5,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        paddingHorizontal: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,

        elevation: 2,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: '#090949',
        fontFamily: 'Outfit-Regular',
        height: '100%',
    },

    multilineInput: {
        paddingTop: 12,
    },

    iconContainer: {
        paddingLeft: 8,
    },
});