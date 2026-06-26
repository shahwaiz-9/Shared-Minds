import NotesCard from "@/components/notes_card";
import { getPublicSubjects } from "@/firebase/collection/subject_collection";
import { Subject } from "@/interface/subject";
import { Colors } from "@/utlis/color";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    View,
} from "react-native";

export default function DiscoverScreen() {
    const router = useRouter();
    const [publicSubjects, setPublicSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchSubjects() {
            try {
                const data = await getPublicSubjects();
                if (isMounted) {
                    setPublicSubjects(data);
                }
            } catch (err) {
                console.error("Error loading public subjects in Discover:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        fetchSubjects();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Standard Header Layout */}
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
                    Discover
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textSecondary }}>
                        Loading public subjects...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={publicSubjects}
                    keyExtractor={(item) => item.subjectid}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    // ListHeaderComponent={
                    //     <View style={{ marginBottom: 16 }}>
                    //         <Text style={{ fontSize: 16, fontFamily: "Outfit-Regular", color: Colors.textSecondary, lineHeight: 22 }}>
                    //             Explore community subjects and study materials created by other users to learn how structured study sets work on Shared Minds.
                    //         </Text>
                    //     </View>
                    // }
                    renderItem={({ item }) => (
                        <NotesCard
                            subject={item}
                            onPress={() => router.push(`/subject-details?subjectid=${item.subjectid}`)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
                            <Text style={{ fontSize: 15, fontFamily: "Outfit-Medium", color: Colors.textTertiary }}>
                                No public subjects available.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
