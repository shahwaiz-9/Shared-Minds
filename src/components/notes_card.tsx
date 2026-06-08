import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../utlis/color";

type NotesCardProps = {
    noteTitle: string;
    description: string;
    owner: string;
    contributors: string[];
    createdAt: Date;
};

export default function NotesCard({
    noteTitle,
    description,
    owner,
    contributors,
    createdAt,
}: NotesCardProps) {
    return (
        <TouchableOpacity style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{noteTitle}</Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {contributors.length + 1} Members
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text
                numberOfLines={3}
                style={styles.description}
            >
                {description}
            </Text>

            <View style={styles.separator} />

            {/* Meta Data */}
            <View style={styles.metaRow}>
                <Feather
                    name="user"
                    size={14}
                    color={Colors.primary}
                />
                <Text style={styles.metaText}>
                    Owner: {owner}
                </Text>
            </View>

            <View style={styles.metaRow}>
                <Feather
                    name="users"
                    size={14}
                    color={Colors.primary}
                />
                <Text
                    style={styles.metaText}
                    numberOfLines={1}
                >
                    Contributors: {contributors.join(", ")}
                </Text>
            </View>

            <View style={styles.metaRow}>
                <Feather
                    name="calendar"
                    size={14}
                    color={Colors.primary}
                />
                <Text style={styles.metaText}>
                    {createdAt.toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
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
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    title: {
        flex: 1,
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        color: Colors.primary,
    },

    badge: {
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },

    badgeText: {
        color: Colors.primary,
        fontSize: 12,
        fontFamily: "Outfit-Medium",
    },

    description: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: "#64748B",
    },

    separator: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },

    metaText: {
        marginLeft: 8,
        color: "#475569",
        fontSize: 13,
        flex: 1,
    },
});