import { logout } from '@/firebase/auth';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from "react-native";
import NotesCard from '../../components/notes_card';
import { Colors } from '../../utlis/color';
export default function HomeScreen() {
    const router = useRouter();

    return (
        <View style={{
            margin: 10

        }}>

            <View style={{
                marginTop: 50,
                marginLeft: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", fontFamily: "Outfit-Bold", color: Colors.primary }}>Your Notes</Text>
                <View style={{ marginRight: 20 }}>
                    <Feather name="search" size={28} color={Colors.primary} />
                </View>
            </View>

            <View style={{
                marginTop: 20,
            }}>
                <NotesCard
                    noteTitle="Deep Learning Basics"
                    description="This notes covers the fundamentals of deep learning, including neural networks, backpropagation, and common architectures like CNNs and RNNs."
                    owner="Shahwaiz Ali"
                    contributors={["Jane Smith", "Bob Johnson"]}
                    createdAt={new Date()}
                />
            </View>


            <TouchableOpacity
                onPress={() => logout().then(() => router.replace("/auth/login"))}
                style={{}}
            >

                <Text style={{ color: Colors.primary, marginTop: 20 }}>Logout</Text>

            </TouchableOpacity>



        </View>
    );
}

