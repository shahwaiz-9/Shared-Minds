import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function ApplicationLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#f0f0f0",
                    height: 80,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "#999",
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginTop: -5,
                },
            })}
        >
            {/* Home Tab */}
            <Tabs.Screen
                name="home"
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size} />
                    ),
                }}
            />

            {/* Friends Tab */}
            <Tabs.Screen
                name="friends"
                options={{
                    tabBarLabel: "Friends",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" color={color} size={size} />
                    ),
                }}
            />

            {/* Create/Plus Tab - Centered with larger icon */}
            <Tabs.Screen
                name="create"
                options={{
                    tabBarLabel: "Create",
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.centerIconContainer}>
                            <View style={styles.centerIconCircle}>
                                <Ionicons name="add" color="#fff" size={32} />
                            </View>
                        </View>
                    ),
                }}
            />

            {/* Profile Tab */}
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            />

            {/* Settings Tab */}
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarLabel: "Settings",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    centerIconContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    centerIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
});
