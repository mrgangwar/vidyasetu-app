import React, { useState, useCallback, useContext } from 'react';
import { 
    View, Text, StyleSheet, Image, ScrollView, 
    TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

const StudentSelfProfile = () => {
    const { logout } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Fetches the latest student profile data from the dashboard endpoint.
     */
    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setProfile(res.data.data.profile);
            }
        } catch (err) {
            console.log("Profile Fetch Error:", err);
            Alert.alert("System Error", "Failed to retrieve profile data. Please try again later.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleLogout = () => {
        Alert.alert(
            "Confirm Logout", 
            "Are you sure you want to sign out of your account?", 
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    onPress: async () => await logout(), 
                    style: "destructive" 
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.syncText}>Synchronizing Profile Data</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* PROFILE HEADER SECTION */}
            <View style={styles.headerCard}>
                <View style={styles.avatarContainer}>
                    <Image 
                        key={profile?.profilePhoto} 
                        source={profile?.profilePhoto ? { uri: profile.profilePhoto } : require('../../assets/default-avatar.png')} 
                        style={styles.avatar} 
                    />
                </View>
                <Text style={styles.userName}>{profile?.name}</Text>
                <Text style={styles.userLoginId}>ID: {profile?.studentLoginId}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>STUDENT ACCOUNT</Text>
                </View>
            </View>

            {/* ACADEMIC DETAILS */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Academic Information</Text>
                <InfoRow icon="school-outline" label="Institution" value={profile?.collegeName} />
                <InfoRow icon="time-outline" label="Batch Timing" value={profile?.batchTime} />
                <InfoRow icon="calendar-clear-outline" label="Academic Session" value={profile?.session} />
                <InfoRow icon="wallet-outline" label="Monthly Fees" value={`INR ${profile?.monthlyFees}`} color="#10B981" />
            </View>

            {/* FAMILY DETAILS */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Family Information</Text>
                <InfoRow icon="person-outline" label="Guardian Name" value={profile?.fatherName} />
                <InfoRow icon="call-outline" label="Emergency Contact" value={profile?.parentMobile} />
            </View>

            {/* CONTACT DETAILS */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Contact & Residence</Text>
                <InfoRow icon="mail-outline" label="Email Address" value={profile?.email} />
                <InfoRow icon="logo-whatsapp" label="WhatsApp" value={profile?.whatsappNumber || profile?.mobileNumber} />
                <InfoRow icon="location-outline" label="Residential Address" value={profile?.address} />
            </View>

            {/* ACTION SECTION */}
            <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout Session</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Version 1.0.2 • Verified for {profile?.coachingName || 'Vidya Setu'}</Text>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, color = "#6366F1" }) => (
    <View style={styles.infoRow}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.textDetails}>
            <Text style={styles.labelTitle}>{label}</Text>
            <Text style={styles.valueTitle}>{value || 'Not Disclosed'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    syncText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    
    headerCard: { 
        backgroundColor: '#fff', 
        alignItems: 'center', 
        paddingTop: 50,
        paddingBottom: 40, 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40, 
        elevation: 10,
        shadowColor: '#6366F1',
        shadowOpacity: 0.1,
        shadowRadius: 15
    },
    avatarContainer: {
        padding: 5,
        backgroundColor: '#EEF2FF',
        borderRadius: 65,
        marginBottom: 15
    },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    userName: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    userLoginId: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 4 },
    statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
    statusText: { color: '#16A34A', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    
    infoSection: { 
        backgroundColor: '#fff', 
        marginHorizontal: 20, 
        marginTop: 20, 
        borderRadius: 28, 
        padding: 24, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.02
    },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#6366F1', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    textDetails: { marginLeft: 16, flex: 1 },
    labelTitle: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    valueTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 2 },
    
    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginHorizontal: 20, 
        marginTop: 32, 
        paddingVertical: 18, 
        borderRadius: 22, 
        backgroundColor: '#EF4444',
        elevation: 8,
        shadowColor: '#EF4444',
        shadowOpacity: 0.4,
        shadowRadius: 12
    },
    logoutText: { marginLeft: 12, color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    versionText: { textAlign: 'center', marginTop: 30, color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 }
});

export default StudentSelfProfile;