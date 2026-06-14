import { Colors } from "@/utlis/color";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
    name,
    nameFilled,
    color,
    size,
    focused,
}: {
    name: IoniconsName;
    nameFilled: IoniconsName;
    color: string;
    size: number;
    focused: boolean;
}) {
    return (
        <View style={styles.iconWrapper}>
            <Ionicons
                name={focused ? nameFilled : name}
                size={size}
                color={color}
            />
            {focused && <View style={styles.activeIndicator} />}
        </View>
    );
}

export default function ApplicationLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: "absolute",
                    left: 20,
                    right: 20,
                    bottom: Platform.OS === "ios" ? 28 : 16,
                    height: 70,
                    borderRadius: 28,
                    backgroundColor: Colors.white,
                    borderTopWidth: 0,
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.14,
                    shadowRadius: 24,
                    elevation: 16,
                    paddingBottom: 0,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: "#94A3B8",
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontFamily: "Outfit-SemiBold",
                    marginTop: 2,
                    marginBottom: 8,
                },
                tabBarItemStyle: {
                    paddingTop: 10,
                },
            }}
        >

            {/* Home */}
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon
                            name="home-outline"
                            nameFilled="home"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                }}
            />

            {/* Network */}
            <Tabs.Screen
                name="friends"
                options={{
                    title: "Network",
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon
                            name="people-outline"
                            nameFilled="people"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                }}
            />

            {/* Create (FAB center) */}
            <Tabs.Screen
                name="create"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View style={styles.centerButton}>
                            <Ionicons name="add" size={32} color={Colors.white} />
                        </View>
                    ),
                    tabBarLabelStyle: { display: "none" },
                    tabBarItemStyle: { paddingTop: 15 },
                }}
            />

            {/* Discover */}
            <Tabs.Screen
                name="discover"
                options={{
                    title: "Discover",
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon
                            name="compass-outline"
                            nameFilled="compass"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                }}
            />

            {/* Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon
                            name="person-outline"
                            nameFilled="person"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                }}
            />

            {/* Settings — exists on disk but hidden from tab bar */}
            <Tabs.Screen
                name="settings"
                options={{
                    href: null,
                    title: "Settings",
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 3,
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        // marginBottom: Platform.OS === "ios" ? 18 : 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        // elevation: 10,
    },
});