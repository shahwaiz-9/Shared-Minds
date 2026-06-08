import { StyleSheet, Text, View } from "react-native";

export default function FriendsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Friends</Text>
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
