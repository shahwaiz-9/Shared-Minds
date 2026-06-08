import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { logout } from "../../firebase/auth";
export default function HomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>

            <TouchableOpacity onPress={() => logout().then(() => router.replace('/auth/login'))}>
                <Text style={styles.title}>Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
    },
});
