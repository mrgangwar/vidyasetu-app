import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    StatusBar, ActivityIndicator, Animated, Image, Dimensions, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client'; 
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import { Ionicons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

const TeacherDashboard = ({ navigation }) => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const [stats, setStats] = useState({ totalStudents: 0, totalCollected: 0 });
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState(null); 

    const blinkAnim = useRef(new Animated.Value(0.4)).current;

    const fetchDashboardData = async () => {
        try {
            const [studentsRes, feeStatsRes, noticeRes] = await Promise.allSettled([
                apiClient.get('/teacher/my-students'),
                apiClient.get('/teacher/fee-stats'),
                apiClient.get('/teacher/broadcasts')
            ]);

            let totalStudentsCount = 0;
            let totalCollectedAmount = 0;

            if (studentsRes.status === 'fulfilled') {
                totalStudentsCount = studentsRes.value.data.students?.length || 0;
            }

            if (feeStatsRes.status === 'fulfilled' && feeStatsRes.value.data.success) {
                totalCollectedAmount = feeStatsRes.value.data.stats?.totalCollected || 0;
            }

            setStats({ 
                totalStudents: totalStudentsCount, 
                totalCollected: totalCollectedAmount 
            });

            if (noticeRes.status === 'fulfilled' && noticeRes.value.data.success) {
                const allNotices = noticeRes.value.data.notices;
                setNotice(allNotices && allNotices.length > 0 ? allNotices[0] : null);
            }
        } catch (err) {
            console.log("🔥 Dashboard Sync Error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchLatestProfile = async () => {
        try {
            const res = await apiClient.get('/teacher/profile'); 
            if (res.data.success) {
                updateUser(res.data.user); 
            }
        } catch (err) {
            console.log("🔥 Profile Sync Error:", err.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
            fetchLatestProfile(); 
        }, [])
    );

    useEffect(() => {
        const setupPush = async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await apiClient.post('/auth/update-push-token', { pushToken: token });
                }
            } catch (pushErr) {
                console.log("⚠️ Push registration bypassed");
            }
        };
        setupPush();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            
            <View style={styles.topHeader}>
                <View style={styles.brandSection}>
                    <TouchableOpacity 
                        style={styles.logoWrapper} 
                        onPress={() => navigation.navigate('TeacherProfile')}
                    >
                        {user?.profilePhoto ? (
                            <Image 
                                key={user.profilePhoto} // Instant refresh logic
                                source={{ uri: `http://10.54.31.32:5000/${user.profilePhoto}` }} 
                                style={styles.profileImage} 
                            />
                        ) : (
                            <View style={styles.initialCircle}>
                                <Text style={styles.logoText}>{user?.name?.charAt(0) || 'T'}</Text>
                            </View>
                        )}
                        <View style={styles.onlineBadge} />
                    </TouchableOpacity>
                    
                    <View style={styles.titleContainer}>
                        <Text style={styles.coachingTitle} numberOfLines={1}>
                            {user?.coachingName || 'VidyaSetu Academy'}
                        </Text>
                        <Text style={styles.teacherSub}>Hi, {user?.name || 'Teacher'} 👋</Text>
                    </View>
                </View>
                
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.mainContainer} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ADMIN NOTICE / UPDATE BANNER */}
                {notice && (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => {
                            if(notice.type === 'UPDATE' && notice.downloadLink) {
                                Linking.openURL(notice.downloadLink);
                            } else {
                                navigation.navigate('TeacherBroadcast'); 
                            }
                        }}
                    >
                        <Animated.View style={[
                            styles.noticeCard, 
                            notice.type === 'UPDATE' 
                                ? [styles.updateBanner, { opacity: blinkAnim }] 
                                : styles.adminNoticeBanner
                        ]}>
                            <View style={styles.noticeRow}>
                                <View style={[styles.iconBox, notice.type === 'UPDATE' ? {backgroundColor: '#FFFBEB'} : {backgroundColor: '#EEF2FF'}]}>
                                    <Text style={{fontSize: 22}}>
                                        {notice.type === 'UPDATE' ? '🚀' : '📢'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={styles.badgeRow}>
                                        <Text style={[styles.adminBadge, notice.type === 'UPDATE' ? styles.updateBadge : styles.noticeBadge]}>
                                            {notice.type === 'UPDATE' ? 'SYSTEM UPDATE' : 'ADMIN NOTICE'}
                                        </Text>
                                    </View>
                                    <Text style={styles.noticeHeading}>{notice.title}</Text>
                                    <Text style={styles.noticeSubText} numberOfLines={2}>{notice.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                            </View>
                        </Animated.View>
                    </TouchableOpacity>
                )}

                <View style={styles.summaryContainer}>
                    <SummaryCard 
                        icon="people" 
                        value={stats.totalStudents} 
                        label="Students" 
                        bg="#F0F9FF" 
                        color="#0369A1" 
                    />
                    <SummaryCard 
                        icon="wallet" 
                        value={`₹${stats.totalCollected}`} 
                        label="Revenue" 
                        bg="#F0FDF4" 
                        color="#166534" 
                    />
                </View>

                <Text style={styles.sectionHeader}>Management Hub</Text>

                <View style={styles.menuGrid}>
                    <MenuIconButton title="Add Student" icon="person-add" bg="#E0F2FE" color="#0369A1" onPress={() => navigation.navigate('AddStudent')} />
                    <MenuIconButton title="Mark Attnd." icon="checkmark-done-circle" bg="#FEF3C7" color="#92400E" onPress={() => navigation.navigate('MarkAttendance')} />
                    <MenuIconButton title="History" icon="calendar" bg="#E0E7FF" color="#4338CA" onPress={() => navigation.navigate('AttendanceHistory')} />
                    <MenuIconButton title="Homework" icon="book" bg="#FDF2F8" color="#9D174D" onPress={() => navigation.navigate('GiveHomework')} />
                    <MenuIconButton title="My Students" icon="list" bg="#F3E8FF" color="#7E22CE" onPress={() => navigation.navigate('MyStudents')} />
                    <MenuIconButton title="Collect Fees" icon="card" bg="#DCFCE7" color="#15803D" onPress={() => navigation.navigate('CollectFee')} />
                    <MenuIconButton title="Analytics" icon="bar-chart" bg="#E0F2FE" color="#0369A1" onPress={() => navigation.navigate('FeesDashboard')} />
                    <MenuIconButton title="Notices" icon="notifications" bg="#FEF2F2" color="#991B1B" onPress={() => navigation.navigate('ManageNotices')} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const SummaryCard = ({ icon, value, label, bg, color }) => (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.summaryValue, { color: '#1E293B' }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
    </View>
);

const MenuIconButton = ({ title, icon, bg, color, onPress }) => (
    <TouchableOpacity style={[styles.gridItem, { backgroundColor: bg }]} onPress={onPress}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.gridLabel, { color: color }]}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#4F46E5' },
    topHeader: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 
    },
    brandSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoWrapper: { position: 'relative' },
    profileImage: { width: 55, height: 55, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    initialCircle: { 
        width: 55, height: 55, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', 
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' 
    },
    logoText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    onlineBadge: { 
        position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, 
        borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#4F46E5' 
    },
    titleContainer: { marginLeft: 15, flex: 1 },
    coachingTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
    teacherSub: { fontSize: 13, color: '#C7D2FE', marginTop: 2 },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 12 },
    mainContainer: { 
        flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 35, 
        borderTopRightRadius: 35, padding: 20, marginTop: -15 
    },
    noticeCard: { 
        padding: 16, borderRadius: 24, marginBottom: 20, 
        elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, shadowRadius: 10,
    },
    updateBanner: { backgroundColor: '#FFF7ED', borderColor: '#F59E0B', borderWidth: 1.5, borderLeftWidth: 10 },
    adminNoticeBanner: { backgroundColor: '#F0F7FF', borderColor: '#3B82F6', borderWidth: 1.5, borderLeftWidth: 10 },
    noticeRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    badgeRow: { flexDirection: 'row', marginBottom: 4 },
    adminBadge: { fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', color: '#fff' },
    updateBadge: { backgroundColor: '#F59E0B' },
    noticeBadge: { backgroundColor: '#3B82F6' },
    noticeHeading: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    noticeSubText: { fontSize: 13, color: '#64748B', marginTop: 2, lineHeight: 18 },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    summaryCard: { width: '48%', padding: 18, borderRadius: 24, alignItems: 'center' },
    summaryValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
    summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '48%', paddingVertical: 22, borderRadius: 28, marginBottom: 15, alignItems: 'center' },
    gridLabel: { fontWeight: 'bold', fontSize: 13, marginTop: 10 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
});

export default TeacherDashboard;