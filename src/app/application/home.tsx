import { extractTextViaHuggingFace, listHFModels } from '@/ai/loaders/utils';
import { logout } from '@/firebase/auth/auth';
import { useAuthStore } from '@/store';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import NotesCard from '../../components/notes_card';
import { Colors } from '../../utlis/color';
export default function HomeScreen() {
    const router = useRouter();
    const { user, subjects, loading, fetchSubjects } = useAuthStore();
    const [hfTestResult, setHfTestResult] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function runHfTest() {
            try {
                console.log('[HF Test] Listing models...');
                await listHFModels();

                console.log('[HF Test] Sending test message via HF extraction');
                const response = await extractTextViaHuggingFace('', 'image/png', 'How are you ?');
                console.log('[HF Test] Response:', response);
                if (mounted) setHfTestResult(response || 'No response');
            } catch (e: any) {
                console.error('[HF Test] Error:', e);
                if (mounted) setHfTestResult(`Error: ${e.message || e}`);
            }
        }

        runHfTest();
        return () => { mounted = false; };
    }, []);

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
                {hfTestResult ? (
                    <View style={{ padding: 12, backgroundColor: '#f3f3f3', borderRadius: 8, marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: Colors.textSecondary }}>HF Test:</Text>
                        <Text style={{ marginTop: 6, fontFamily: 'Outfit-Medium', color: Colors.primary }}>{hfTestResult}</Text>
                    </View>
                ) : null}
                {subjects.length > 0 ? (
                    subjects.map((subject) => (
                        <NotesCard
                            key={subject.subjectid}
                            subject={subject}
                            onPress={() => router.push(`/subject-details?subjectid=${subject.subjectid}`)}
                        />
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
