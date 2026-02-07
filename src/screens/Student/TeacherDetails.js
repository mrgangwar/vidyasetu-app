import React from 'react';
import { 
    View, Text, StyleSheet, Image, TouchableOpacity, 
    Linking, ScrollView, Dimensions 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TeacherDetails = ({ route }) => {
    const { teacher } = route.params;

    // 📞 Function to handle Phone Call
    // 📞 Function to handle Phone Call
const makeCall = (number) => {
    if (number) {
        // Sirf numbers rakho (clean)
        const cleanNumber = number.replace(/\D/g, '');
        Linking.openURL(`tel:${cleanNumber}`);
    }
};

// 💬 Function to handle WhatsApp (Fixed double +91 issue)
const openWhatsApp = (number) => {
    if (number) {
        // 1. Saare non-numeric characters hatao (+, spaces, etc.)
        let cleanNumber = number.replace(/\D/g, '');

        // 2. Agar number 10 digit se zyada hai (jaise 9198XXX), 
        // toh sirf aakhri ke 10 digits lo
        if (cleanNumber.length > 10) {
            cleanNumber = cleanNumber.slice(-10);
        }

        // 3. Ab fresh 91 add karo (WhatsApp standard format)
        Linking.openURL(`whatsapp://send?phone=91${cleanNumber}`);
    } else {
        alert("WhatsApp number not available");
    }
};

    return (
        <ScrollView style={styles.container}>
            {/* Header / Profile Image */}
            <View style={styles.header}>
                <Image 
                    source={teacher.profilePhoto ? { uri: teacher.profilePhoto } : require('../../assets/default-avatar.png')} 
                    style={styles.profileImg} 
                />
                <Text style={styles.name}>{teacher.name}</Text>
                <Text style={styles.subject}>{teacher.subject || 'Faculty Member'}</Text>
            </View>

            {/* Info Cards */}
            <View style={styles.infoSection}>
                <View style={styles.card}>
                    <Ionicons name="school-outline" size={24} color="#6366F1" />
                    <View style={styles.cardTextContent}>
                        <Text style={styles.label}>Qualification</Text>
                        <Text style={styles.value}>{teacher.qualifications || 'N/A'}</Text>
                    </View>
                </View>

                {/* Contact Options */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#EEF2FF' }]} 
                        onPress={() => makeCall(teacher.contactNumber)}
                    >
                        <Ionicons name="call" size={22} color="#4F46E5" />
                        <Text style={[styles.actionText, { color: '#4F46E5' }]}>Call Teacher</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]} 
                        onPress={() => openWhatsApp(teacher.whatsappNumber || teacher.contactNumber)}
                    >
                        <FontAwesome name="whatsapp" size={24} color="#16A34A" />
                        <Text style={[styles.actionText, { color: '#16A34A' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
    profileImg: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: '#EEF2FF' },
    name: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 15 },
    subject: { fontSize: 16, color: '#6366F1', fontWeight: '600', letterSpacing: 1 },
    infoSection: { padding: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 1 },
    cardTextContent: { marginLeft: 15 },
    label: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' },
    value: { fontSize: 16, color: '#334155', fontWeight: '600' },
    actionContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15 },
    actionText: { marginLeft: 10, fontWeight: '700', fontSize: 14 }
});

export default TeacherDetails;