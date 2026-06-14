import { logout } from '@/firebase/auth/auth';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View, ScrollView } from "react-native";
import NotesCard from '../../components/notes_card';
import { Colors } from '../../utlis/color';
import { useAuthStore } from '@/store';
export default function HomeScreen() {
    const router = useRouter();
    const { user, subjects, loading, fetchSubjects } = useAuthStore();

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 16, color: Colors.textSecondary, fontFamily: 'Outfit-Regular' }}>
                    Loading your notes...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, margin: 10 }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={{
                marginTop: 50,
                marginLeft: 20,
                marginRight: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", fontFamily: "Outfit-Bold", color: Colors.primary }}>Your Notes</Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                    <TouchableOpacity onPress={fetchSubjects}>
                        <Feather name="refresh-cw" size={28} color={Colors.primary} />
                    </TouchableOpacity>
                    <Feather name="search" size={28} color={Colors.primary} />
                </View>
            </View>

            <ScrollView style={{ marginTop: 20, paddingHorizontal: 10 }}>
                {subjects.length > 0 ? (
                    subjects.map((subject) => (
                        <NotesCard key={subject.subjectid} subject={subject} />
                    ))
                ) : (
                    <View style={{
                        alignItems: 'center',
                        marginTop: 80,
                    }}>
                        <Feather name="inbox" size={64} color={Colors.textSecondary} />
                        <Text style={{
                            marginTop: 24,
                            fontSize: 18,
                            color: Colors.textSecondary,
                            fontFamily: 'Outfit-Regular',
                            textAlign: 'center',
                        }}>
                            No subjects yet!
                        </Text>
                        <Text style={{
                            marginTop: 8,
                            fontSize: 14,
                            color: Colors.textSecondary,
                            fontFamily: 'Outfit-Regular',
                            textAlign: 'center',
                        }}>
                            Create your first subject to get started
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View style={{
                marginBottom: 30,
                marginHorizontal: 30,
            }}>
                <TouchableOpacity
                    onPress={() => logout().then(() => router.replace("/auth/login"))}
                    style={{}}
                >
                    <Text style={{ color: Colors.primary, marginTop: 20, fontFamily: 'Outfit-Medium' }}>Logout</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}
