import { Colors } from "@/utlis/color";
import { StatusBar, StyleSheet, Text, View } from "react-native";

export default function DiscoverScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <Text style={styles.title}>Discover</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingBottom: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
    },
});
