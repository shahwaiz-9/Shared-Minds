import NotesCard from "@/components/notes_card";
import { getSubjectsForUser } from "@/firebase/collection/subject_collection";
import { getUserDocument } from "@/firebase/collection/user_collection";
import { Subject } from "@/interface/subject";
import { User } from "@/interface/user";
import { useAuthStore } from "@/store";
import { Colors } from "@/utlis/color";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Fallback images for visual hierarchy
const DEFAULT_COVER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";

export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user: currentUser, subjects: currentSubjects, fetchSubjects } = useAuthStore();

    // Determine if we are viewing the currently logged-in user or a scouted user
    const targetUid = params.uid as string | undefined;
    const isCurrentUser = !targetUid || targetUid === currentUser?.uid;

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [profileSubjects, setProfileSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadProfileData() {
            setLoading(true);
            try {
                if (isCurrentUser) {
                    if (currentUser) {
                        setProfileUser(currentUser);
                        // Fetch current user subjects
                        await fetchSubjects();
                        // Get subjects from the store snapshot directly, not as a dependency
                        const storeSubjects = useAuthStore.getState().subjects;
                        if (isMounted) {
                            setProfileSubjects(storeSubjects);
                        }
                    }
                } else if (targetUid) {
                    // Fetch scouted user's document
                    const scoutedUser = await getUserDocument(targetUid);
                    if (isMounted && scoutedUser) {
                        setProfileUser(scoutedUser);
                        // Fetch public subjects for the scouted user
                        const allSubjects = await getSubjectsForUser(targetUid);
                        // Scouted profiles only show public subjects
                        const publicSubjects = allSubjects.filter(sub => sub.visibility === "public");
                        setProfileSubjects(publicSubjects);
                    }
                }
            } catch (err) {
                console.error("Error loading profile data:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadProfileData();

        return () => {
            isMounted = false;
        };
    }, [targetUid, isCurrentUser, currentUser]);


    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!profileUser) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: Colors.background }}>
                <Text style={{ fontSize: 16, fontFamily: "Outfit-Medium", color: Colors.error, marginBottom: 16 }}>User profile not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary }}>
                    <Text style={{ color: Colors.white, fontFamily: "Outfit-Bold" }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculating Stats
    const totalFriends = 0; // In a real app, fetch from friends collections
    const publicSubjectsCount = profileSubjects.filter(sub => sub.visibility === "public").length;
    const privateSubjectsCount = profileSubjects.filter(sub => sub.visibility === "private").length;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Dynamic Header Component */}
            {isCurrentUser ? (
                <View style={{ marginTop: 50, height: 60, justifyContent: "center", paddingHorizontal: 24, borderBottomWidth: 1, borderColor: "#F1F5F9" }}>
                    <Text style={{ fontSize: 32, fontFamily: "Outfit-Bold", color: Colors.primary }}>Your Profile</Text>
                </View>
            ) : (
                <View style={{ marginTop: 50, height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#F1F5F9" }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.primary, textAlign: "center", flex: 1 }} numberOfLines={1}>
                        {profileUser.displayName || "Profile"}
                    </Text>
                    <View style={{ width: 24 }} /> {/* Balancing placeholder */}
                </View>
            )}

            {/* Main Scrollable Container to prevent nested scrolls */}
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Cover & Profile Photo Section */}
                <View style={{ width: "100%", height: 220, position: "relative", marginBottom: 50 }}>
                    <Image
                        source={{ uri: profileUser.coverPhotoURL || DEFAULT_COVER }}
                        style={{ width: "100%", height: 180 }}
                        resizeMode="cover"
                    />
                    <View style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        marginLeft: -80, // Half of avatar width (160/2)
                        width: 160,
                        height: 160,
                        borderRadius: 80,
                        borderWidth: 4,
                        borderColor: Colors.white,
                        backgroundColor: Colors.white,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}>
                        <Image
                            source={{ uri: profileUser.photoURL || DEFAULT_AVATAR }}
                            style={{ width: "100%", height: "100%", borderRadius: 76 }}
                        />
                    </View>
                </View>


                {/* Identity & Bio Blocks */}
                <View style={{ alignItems: "center", paddingHorizontal: 24, marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontFamily: "Outfit-Bold", color: Colors.primary, textAlign: "center", marginBottom: 8 }}>{profileUser.displayName || "Anonymous"}</Text>
                    <Text style={{ fontSize: 15, fontFamily: "Outfit-Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 22 }}>
                        {profileUser.bio || "No bio available yet. Share something about yourself!"}
                    </Text>
                </View>

                {/* General Stats Grid */}
                <View style={{ flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", paddingHorizontal: 16, marginBottom: 24 }}>
                    <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>{totalFriends}</Text>
                        <Text style={{ fontSize: 13, fontFamily: "Outfit-Medium", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Friends</Text>
                    </View>
                    <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>{publicSubjectsCount}</Text>
                        <Text style={{ fontSize: 13, fontFamily: "Outfit-Medium", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Public</Text>
                    </View>
                    {isCurrentUser && (
                        <View style={{ alignItems: "center", flex: 1 }}>
                            <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.primary, marginBottom: 4 }}>{privateSubjectsCount}</Text>
                            <Text style={{ fontSize: 13, fontFamily: "Outfit-Medium", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Private</Text>
                        </View>
                    )}
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: "#E2E8F0", marginHorizontal: 24, marginBottom: 24 }} />

                {/* Subjects List Title */}
                <Text style={{ fontSize: 20, fontFamily: "Outfit-Bold", color: Colors.primary, paddingHorizontal: 24, marginBottom: 16 }}>
                    {isCurrentUser ? "Your Subjects" : "Public Subjects"}
                </Text>

                {/* Subjects Cards List */}
                <View style={{ paddingHorizontal: 24 }}>
                    {profileSubjects.length > 0 ? (
                        profileSubjects.map((subject) => (
                            <NotesCard
                                key={subject.subjectid}
                                subject={subject}
                                onPress={() => router.push(`/subject-details?subjectid=${subject.subjectid}`)}
                            />
                        ))
                    ) : (
                        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                            <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
                            <Text style={{ marginTop: 12, fontSize: 14, fontFamily: "Outfit-Regular", color: Colors.textTertiary }}>No subjects available.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

