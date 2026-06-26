import { Colors } from "@/utlis/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type ConnectionCardProps = {
    name: string;
    bio: string;
    avatarUrl?: string;
    type: "invitation" | "discover";
    isRequested?: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    onConnect?: () => void;
};

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";

export default function ConnectionCard({
    name,
    bio,
    avatarUrl,
    type,
    isRequested = false,
    onAccept,
    onDecline,
    onConnect,
}: ConnectionCardProps) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.white,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 2,
            }}
        >
            {/* Avatar */}
            <Image
                source={{ uri: avatarUrl || DEFAULT_AVATAR }}
                style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: Colors.surface,
                    marginRight: 14,
                }}
            />

            {/* User details */}
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 16,
                        fontFamily: "Outfit-Bold",
                        color: Colors.primary,
                        marginBottom: 2,
                    }}
                >
                    {name}
                </Text>
                <Text
                    numberOfLines={2}
                    style={{
                        fontSize: 13,
                        fontFamily: "Outfit-Regular",
                        color: Colors.textSecondary,
                    }}
                >
                    {bio}
                </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                {type === "invitation" ? (
                    <>
                        <TouchableOpacity
                            onPress={onAccept}
                            activeOpacity={0.7}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#EEFBF3",
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 8,
                            }}
                        >
                            <Ionicons name="checkmark" size={20} color="#22C55E" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onDecline}
                            activeOpacity={0.7}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#FEF2F2",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Ionicons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        onPress={onConnect}
                        disabled={isRequested}
                        activeOpacity={0.7}
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: isRequested ? Colors.surface : Colors.primary,
                            borderWidth: isRequested ? 1 : 0,
                            borderColor: Colors.border,
                            justifyContent: "center",
                            alignItems: "center",
                            minWidth: 90,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: "Outfit-Bold",
                                color: isRequested ? Colors.textTertiary : Colors.white,
                            }}
                        >
                            {isRequested ? "Requested" : "Connect"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
