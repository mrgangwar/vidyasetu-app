import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
    Alert, ActivityIndicator, SafeAreaView, StatusBar, Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const TeacherDetailsScreen = ({ route, navigation }) => {
    const { teacherId } = route.params;
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            const res = await apiClient.get(`/admin/teacher/${teacherId}`);
            setTeacher(res.data.teacher);
        } catch (err) {
            Alert.alert("Access Error", "Could not retrieve teacher profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetails(); }, []);

    const handleDelete = () => {
        Vibration.vibrate(100);
        Alert.alert(
            "Permanent Deletion",
            "This action cannot be undone. All associated coaching records for this teacher will be removed.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Teacher", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/teacher/delete/${teacherId}`);
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert("Error", "Deletion failed. Please try again.");
                        }
                    } 
                }
            ]
        );
    };

    if (loading) return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4F46E5" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Custom Header Navigation */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Teacher Profile</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('EditTeacher', { teacher })}
                    style={styles.iconBtn}
                >
                    <Ionicons name="create-outline" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Hero Section */}
                <View style={styles.hero}>
                    <View style={styles.imageWrapper}>
                        <Image 
                            source={teacher?.profilePhoto 
                                ? { uri: `http://10.54.31.32:5000/${teacher.profilePhoto}` } 
                                : { uri: 'https://ui-avatars.com/api/?name=' + teacher?.name + '&size=250&background=6366F1&color=fff' }} 
                            style={styles.profileImg} 
                        />
                        <View style={styles.statusBadge} />
                    </View>
                    <Text style={styles.name}>{teacher?.name}</Text>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{teacher?.subject || 'Lead Educator'}</Text>
                    </View>
                </View>

                {/* Information Grid */}
                <View style={styles.content}>
                    <Text style={styles.sectionLabel}>Professional Details</Text>
                    
                    <View style={styles.card}>
                        <InfoRow icon="business" label="Institution" value={teacher?.coachingId?.coachingName || 'Independent'} />
                        <InfoRow icon="school" label="Qualifications" value={teacher?.qualifications} />
                        <InfoRow icon="mail" label="Official Email" value={teacher?.email} />
                        <InfoRow icon="call" label="Contact" value={teacher?.contactNumber} />
                        <InfoRow icon="location" label="Address" value={teacher?.address} last />
                    </View>

                    <Text style={styles.sectionLabel}>Account Management</Text>
                    <TouchableOpacity style={styles.dangerCard} onPress={handleDelete}>
                        <View style={styles.dangerIconBox}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </View>
                        <View>
                            <Text style={styles.dangerTitle}>Deactivate Account</Text>
                            <Text style={styles.dangerSub}>Remove access for this teacher</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ icon, label, value, last }) => (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
        <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color="#6366F1" />
        </View>
        <View style={styles.infoTexts}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
    navTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    hero: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    imageWrapper: { position: 'relative', marginBottom: 15 },
    profileImg: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#E2E8F0' },
    statusBadge: { position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#FFF' },
    name: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    tagText: { color: '#4F46E5', fontWeight: '800', fontSize: 13 },
    content: { padding: 25 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoTexts: { flex: 1 },
    infoLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    infoValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 2 },
    dangerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#FEE2E2' },
    dangerIconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    dangerTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B' },
    dangerSub: { fontSize: 13, color: '#EF4444', fontWeight: '600' }
});

export default TeacherDetailsScreen;