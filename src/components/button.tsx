
import { ActivityIndicator, Dimensions, Text, TouchableOpacity } from "react-native";
const { width: screenWidth } = Dimensions.get("window");

type CustomButtonProps = {
    title: string;
    onPress: () => void;
    type: "transparent" | "simple";
    loading?: boolean;
}

export default function CustomButton({ title, onPress, type, loading = false }: CustomButtonProps) {
    return (
        <TouchableOpacity 
            style={{
                width: screenWidth * 0.9,
                height: 55,
                backgroundColor: type === "simple" ? "#090949" : "transparent",
                justifyContent: 'center',
                borderRadius: 25,
                borderWidth: type === "transparent" ? 2 : 0,
                borderColor: "#090949",
                opacity: loading ? 0.7 : 1,
            }} 
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={type === "simple" ? "#FFFFFF" : "#090949"} size="small" />
            ) : (
                <Text style={{
                    color: type === "simple" ? "#FFFFFF" : "#090949",
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "600",
                    fontFamily: "Outfit-Medium",
                }}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    )
}
