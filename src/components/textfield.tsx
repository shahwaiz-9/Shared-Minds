import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../utlis/color';

type CustomTextFieldProps = {
    type?: 'simple' | 'password';
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
};



export default function CustomTextField({
    type = 'simple',
    placeholder,
    value,
    onChangeText,
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
                    borderColor: focused ? Colors.primary : '#D9D9D9',
                },
            ]}
        >
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#8E8E93"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureText}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
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
        height: 58,
        borderWidth: 1.5,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
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
    },

    iconContainer: {
        paddingLeft: 8,
    },
});