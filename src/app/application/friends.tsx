import ConnectionCard from "@/components/connection_card";
import { Colors } from "@/utlis/color";
import React, { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    View,
} from "react-native";

interface MockUser {
    id: string;
    name: string;
    bio: string;
    avatarUrl: string;
    isInvitation: boolean;
    isRequested?: boolean;
}

const INITIAL_USERS: MockUser[] = [
    // Invitations
    {
        id: "1",
        name: "Ahtsham Azam",
        bio: "Computer Science Student @ Fast NUCES",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        isInvitation: true,
    },
    {
        id: "2",
        name: "Talha Ramzan",
        bio: "Software Engineer | React Native Enthusiast",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        isInvitation: true,
    },
    // Discover List
    {
        id: "3",
        name: "Muhammad Waqas",
        bio: "AI Researcher | Full Stack Developer",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
        isInvitation: false,
    },
    {
        id: "4",
        name: "Ayesha Malik",
        bio: "UI/UX Designer | App developer",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        isInvitation: false,
    },
    {
        id: "5",
        name: "Zainab Fatima",
        bio: "Medical Student | Chemistry Tutor",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
        isInvitation: false,
    },
];

export default function FriendsScreen() {
    const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);

    const invitations = users.filter((u) => u.isInvitation);
    const discoverList = users.filter((u) => !u.isInvitation);

    const handleAccept = (id: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const handleDecline = (id: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const handleConnect = (id: string) => {
        setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, isRequested: true } : u))
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Standard Header Layout consistent with other screens */}
            <View
                style={{
                    marginTop: 50,
                    height: 60,
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    borderBottomWidth: 1,
                    borderColor: "#F1F5F9",
                }}
            >
                <Text style={{ fontSize: 32, fontFamily: "Outfit-Bold", color: Colors.primary }}>
                    Network
                </Text>
            </View>

            {/* Main FlatList as single root scrollable container */}
            <FlatList
                data={discoverList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                ListHeaderComponent={
                    <View>
                        {/* Invitations Section */}
                        {invitations.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: "Outfit-Bold",
                                        color: Colors.primary,
                                        marginBottom: 14,
                                    }}
                                >
                                    Invitations ({invitations.length})
                                </Text>
                                {invitations.map((item) => (
                                    <ConnectionCard
                                        key={item.id}
                                        name={item.name}
                                        bio={item.bio}
                                        avatarUrl={item.avatarUrl}
                                        type="invitation"
                                        onAccept={() => handleAccept(item.id)}
                                        onDecline={() => handleDecline(item.id)}
                                    />
                                ))}
                                <View style={{ height: 1, backgroundColor: "#E2E8F0", marginTop: 12 }} />
                            </View>
                        )}

                        {/* Discover Section Title */}
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: "Outfit-Bold",
                                color: Colors.primary,
                                marginBottom: 14,
                            }}
                        >
                            Discover Users
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ConnectionCard
                        name={item.name}
                        bio={item.bio}
                        avatarUrl={item.avatarUrl}
                        type="discover"
                        isRequested={item.isRequested}
                        onConnect={() => handleConnect(item.id)}
                    />
                )}
                ListEmptyComponent={
                    discoverList.length === 0 ? (
                        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                            <Text style={{ fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>
                                No users to discover.
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
