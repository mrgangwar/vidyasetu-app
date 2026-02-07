import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Image, Dimensions, ActivityIndicator, RefreshControl, Alert, Animated, Linking, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const StudentDashboard = ({ navigation }) => {
    const { logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Animation states for system alerts
    const [updateNotice, setUpdateNotice] = useState(null);
    const blinkAnim = useRef(new Animated.Value(1)).current;

    const fetchDashboard = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setData(res.data.data);
                const notices = res.data.data.notices || [];
                const update = notices.find(n => n.type === 'UPDATE');
                setUpdateNotice(update);
            }
        } catch (err) {
            console.log("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [])
    );

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const confirmLogout = () => {
        Alert.alert(
            "Terminate Session", 
            "Are you sure you want to log out of VidyaSetu?", 
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: () => logout(), style: "destructive" }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loaderText}>Establishing Secure Connection</Text>
            </View>
        );
    }

    const feeChartData = [
        { name: 'Cleared', amount: data?.stats?.totalPaid || 0, color: '#6366F1', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Pending', amount: data?.stats?.totalDue || 0, color: '#F1F5F9', legendFontColor: '#64748B', legendFontSize: 12 }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
                showsVerticalScrollIndicator={false}
            >
                {/* BRAND HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>System Access: {data?.profile?.name?.split(' ')[0] || 'Student'}</Text>
                        <Text style={styles.coachingName}>{data?.coachingName || 'VIDYA SETU'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={confirmLogout} style={styles.actionIcon}>
                            <Ionicons name="power-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('MyProfile')}
                            activeOpacity={0.8}
                        >
                            <Image 
                                key={data?.profile?.profilePhoto}
                                source={data?.profile?.profilePhoto ? { uri: data.profile.profilePhoto } : require('../assets/default-avatar.png')} 
                                style={styles.profileImg} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CRITICAL SYSTEM UPDATE */}
                {updateNotice && (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => updateNotice.downloadLink && Linking.openURL(updateNotice.downloadLink)}
                        style={styles.updateContainer}
                    >
                        <Animated.View style={[styles.updateBanner, { opacity: blinkAnim }]}>
                            <View style={styles.updateIconContainer}>
                                <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.updateTextContent}>
                                <Text style={styles.updateTag}>Maintenance Required</Text>
                                <Text style={styles.updateTitleText} numberOfLines={1}>{updateNotice.title}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#6366F1" />
                        </Animated.View>
                    </TouchableOpacity>
                )}

                {/* ANALYTICS SECTION */}
                <View style={styles.analyticsCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Financial Status</Text>
                        <View style={styles.attendanceChip}>
                            <Ionicons name="stats-chart" size={12} color="#10B981" />
                            <Text style={styles.attendanceValue}>{data?.stats?.attendancePercentage}% Attendance</Text>
                        </View>
                    </View>

                    <View style={styles.chartWrapper}>
                        <PieChart
                            data={feeChartData}
                            width={width - 80}
                            height={160}
                            chartConfig={{ color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})` }}
                            accessor={"amount"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[5, 0]}
                            absolute
                        />
                    </View>

                    <View style={styles.financialSummary}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>Total Settled</Text>
                            <Text style={styles.summaryValuePaid}>₹{data?.stats?.totalPaid}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>Outstanding</Text>
                            <Text style={styles.summaryValueDue}>₹{data?.stats?.totalDue}</Text>
                        </View>
                    </View>
                </View>

                {/* NOTIFICATION HUB */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.primaryTitle}>Notice Board</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AllNotices')}>
                        <Text style={styles.linkText}>View Archive</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.horizontalScroll}
                >
                    {data?.notices?.filter(n => n.type !== 'UPDATE').length > 0 ? (
                        data.notices.filter(n => n.type !== 'UPDATE').map((notice, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.horizontalCard, 
                                    { borderLeftColor: !notice.coachingId ? '#E11D48' : '#6366F1' } 
                                ]}
                            >
                                <View style={styles.noticeMeta}>
                                    <Text style={styles.noticeTimestamp}>
                                        {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </Text>
                                    <View style={[styles.originBadge, { backgroundColor: !notice.coachingId ? '#FFF1F2' : '#EEF2FF' }]}>
                                        <Text style={[styles.originText, { color: !notice.coachingId ? '#E11D48' : '#4F46E5' }]}>
                                            {!notice.coachingId ? 'SYSTEM' : 'FACULTY'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.itemHeading} numberOfLines={1}>{notice.title}</Text>
                                <Text style={styles.itemContent} numberOfLines={2}>{notice.description || notice.message}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="file-tray-outline" size={32} color="#CBD5E1" />
                            <Text style={styles.placeholderText}>No Active Announcements</Text>
                        </View>
                    )}
                </ScrollView>

                {/* NAVIGATION GRID */}
                <View style={styles.navigationGrid}>
                    <GridItem title="Attendance" icon="calendar-outline" color="#6366F1" onPress={() => navigation.navigate('MyAttendance')} />
                    <GridItem title="Curriculum" icon="document-text-outline" color="#EC4899" onPress={() => navigation.navigate('MyHomework')} />
                    <GridItem title="Mentors" icon="school-outline" color="#F59E0B" onPress={() => navigation.navigate('MyTeachers')} />
                    <GridItem title="Ledger" icon="wallet-outline" color="#10B981" onPress={() => navigation.navigate('MyFees')} />
                    <GridItem title="Identity" icon="person-circle-outline" color="#6366F1" onPress={() => navigation.navigate('MyProfile')} />
                    <GridItem title="Broadcasts" icon="notifications-outline" color="#8B5CF6" onPress={() => navigation.navigate('AllNotices')} />
                </View>
                
                <View style={{height: 40}} />
            </ScrollView>
        </SafeAreaView>
    );
};

const GridItem = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.gridElement} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.gridIconBackground, { backgroundColor: color + '12' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.gridLabel}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    loaderText: { marginTop: 15, color: '#64748B', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
    
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 24, 
        backgroundColor: '#FFFFFF' 
    },
    welcomeText: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
    coachingName: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    actionIcon: { marginRight: 16, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9' },
    profileImg: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#FFFFFF' },
    
    updateContainer: { paddingHorizontal: 24, marginBottom: 28 },
    updateBanner: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        padding: 14, 
        borderRadius: 22, 
        borderWidth: 1.5, 
        borderColor: '#EEF2FF',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 6
    },
    updateIconContainer: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    updateTextContent: { flex: 1, marginLeft: 14 },
    updateTag: { fontSize: 9, fontWeight: '900', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 },
    updateTitleText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 1 },

    analyticsCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 24, 
        borderRadius: 32, 
        padding: 24, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 4
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    attendanceChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    attendanceValue: { color: '#16A34A', fontSize: 10, fontWeight: '800', marginLeft: 4 },
    chartWrapper: { alignItems: 'center', marginVertical: 10 },
    financialSummary: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 10, 
        paddingTop: 20, 
        borderTopWidth: 1, 
        borderTopColor: '#F8FAFC' 
    },
    summaryBox: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    summaryValuePaid: { fontSize: 22, fontWeight: '900', color: '#6366F1' },
    summaryValueDue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    verticalDivider: { width: 1, backgroundColor: '#F1F5F9' },

    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, marginTop: 36 },
    primaryTitle: { fontSize: 19, fontWeight: '900', color: '#0F172A' },
    linkText: { color: '#6366F1', fontSize: 12, fontWeight: '800' },
    
    horizontalScroll: { paddingLeft: 24, paddingRight: 10, paddingVertical: 16 },
    horizontalCard: { 
        backgroundColor: '#FFFFFF', 
        width: 270, 
        padding: 20, 
        borderRadius: 26, 
        marginRight: 16, 
        borderLeftWidth: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3
    },
    noticeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    noticeTimestamp: { fontSize: 11, color: '#94A3B8', fontWeight: '800' },
    originBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    originText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    itemHeading: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    itemContent: { fontSize: 13, color: '#64748B', lineHeight: 19, fontWeight: '500' },
    
    placeholderContainer: { 
        width: width - 48, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 50, 
        backgroundColor: '#F8FAFC', 
        borderRadius: 28, 
        borderWidth: 1.5, 
        borderColor: '#F1F5F9',
        borderStyle: 'dashed' 
    },
    placeholderText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '700' },

    navigationGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginTop: 12 },
    gridElement: { 
        width: '30%', 
        backgroundColor: '#FFFFFF', 
        aspectRatio: 1,
        borderRadius: 26, 
        marginVertical: 8, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2
    },
    gridIconBackground: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridLabel: { fontSize: 10, fontWeight: '800', color: '#475569', textAlign: 'center' }
});

export default StudentDashboard;