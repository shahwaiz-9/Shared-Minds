import { getUserDocument } from "@/firebase/collection/user_collection";
import { Subject } from "@/interface/subject";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../utlis/color";

type NotesCardProps = {
    subject: Subject;
    onPress?: () => void;
};

export default function NotesCard({ subject, onPress }: NotesCardProps) {
    const [ownerName, setOwnerName] = useState<string>("Loading...");

    useEffect(() => {
        const fetchOwnerName = async () => {
            try {
                const user = await getUserDocument(subject.ownerid);
                setOwnerName(user?.displayName || "Unknown");
            } catch (err) {
                console.error("Error fetching owner name:", err);
                setOwnerName("Unknown");
            }
        };
        fetchOwnerName();
    }, [subject.ownerid]);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: Colors.white,
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 4,
                marginBottom: 16,
            }}
        >
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* Left Side: Icon + Title */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                        marginRight: 12,
                    }}
                >
                    {/* Circle Container for Book Icon */}
                    <View
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: "#EEF2FF", // Match the badge tone, or use a light tint of your primary color
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                        }}
                    >
                        <Feather
                            name="book-open" // alternative: "book"
                            size={18}
                            color={Colors.primary}
                        />
                    </View>

                    <Text
                        numberOfLines={1}
                        style={{
                            flex: 1,
                            fontSize: 18, // Slightly reduced from 20 to balance the icon's visual weight
                            fontFamily: "Outfit-Bold",
                            color: Colors.primary,
                        }}
                    >
                        {subject.subjectname}
                    </Text>
                </View>

                {/* Visibility Badge */}
                <View
                    style={{
                        backgroundColor: "#EEF2FF",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                    }}
                >
                    <Text
                        style={{
                            color: Colors.primary,
                            fontSize: 12,
                            fontFamily: "Outfit-Medium",
                        }}
                    >
                        {subject.visibility === "public" ? "Public" : "Private"}
                    </Text>
                </View>
            </View>

            {/* Divider Line After Heading Row */}
            <View
                style={{
                    height: 1,
                    backgroundColor: "#F1F5F9",
                    marginVertical: 14,
                }}
            />

            {/* Description */}
            <Text
                numberOfLines={3}
                style={{
                    fontSize: 14,
                    lineHeight: 22,
                    color: "#64748B",
                }}
            >
                {subject.subjectdescription}
            </Text>

            <View
                style={{
                    height: 1,
                    backgroundColor: "#F1F5F9",
                    marginVertical: 14,
                }}
            />

            {/* Meta Data */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                }}
            >
                <Feather
                    name="user"
                    size={14}
                    color={Colors.primary}
                />
                <Text
                    style={{
                        marginLeft: 8,
                        color: "#475569",
                        fontSize: 13,
                        flex: 1,
                    }}
                >
                    Owner: {ownerName}
                </Text>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                }}
            >
                <Feather
                    name="calendar"
                    size={14}
                    color={Colors.primary}
                />
                <Text
                    style={{
                        marginLeft: 8,
                        color: "#475569",
                        fontSize: 13,
                        flex: 1,
                    }}
                >
                    {subject.createdAt.toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );
}