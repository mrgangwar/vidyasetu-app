import React, { useEffect, useState } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    Linking, ActivityIndicator, RefreshControl, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import apiClient from '../../api/client';

const TeacherBroadcastScreen = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBroadcasts = async () => {
        try {
            const response = await apiClient.get('/teacher/broadcasts');
            if (response.data.success) {
                setNotices(response.data.notices);
            }
        } catch (error) {
            console.error("Broadcast Fetch Error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBroadcasts();
    };

    const handleDownload = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => alert("Unable to open the requested link."));
        }
    };

    const renderItem = ({ item }) => {
        const isUpdate = item.type === 'UPDATE';

        return (
            <View style={[styles.card, isUpdate ? styles.updateCard : styles.noticeCard]}>
                <View style={styles.headerRow}>
                    <View style={styles.badgeContainer}>
                        <Ionicons 
                            name={isUpdate ? "rocket-sharp" : "megaphone-sharp"} 
                            size={12} 
                            color={isUpdate ? "#059669" : "#6366F1"} 
                        />
                        <Text style={[styles.badge, { color: isUpdate ? "#059669" : "#6366F1" }]}>
                            {item.type}
                        </Text>
                    </View>
                    {item.version && (
                        <View style={styles.versionBadge}>
                            <Text style={styles.versionText}>Build {item.version}</Text>
                        </View>
                    )}
                </View>
                
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                
                {isUpdate && item.downloadLink && (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        style={styles.downloadBtn} 
                        onPress={() => handleDownload(item.downloadLink)}
                    >
                        <Ionicons name="download-outline" size={18} color="#fff" />
                        <Text style={styles.downloadText}>Install Update</Text>
                    </TouchableOpacity>
                )}
                
                <View style={styles.footer}>
                    <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                    <Text style={styles.date}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Syncing with administration...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            <View style={styles.headerSection}>
                <View>
                    <Text style={styles.headerLabel}>Official</Text>
                    <Text style={styles.screenTitle}>Broadcasts</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.syncBtn}>
                    <Ionicons name="refresh" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notices}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#6366F1"
                        colors={["#6366F1"]} 
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up</Text>
                        <Text style={styles.emptySub}>New announcements from the administrator will appear here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC' 
    },
    loadingCenter: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    loadingText: { 
        marginTop: 12, 
        color: '#64748B',
        fontWeight: '600',
        letterSpacing: 0.3
    },
    headerSection: { 
        paddingHorizontal: 24, 
        paddingTop: 15,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 2
    },
    screenTitle: { 
        fontSize: 32, 
        fontWeight: '900', 
        color: '#1E293B',
        letterSpacing: -0.5
    },
    syncBtn: {
        backgroundColor: '#EEF2FF',
        padding: 10,
        borderRadius: 12,
        marginBottom: 5
    },
    listContainer: { 
        paddingHorizontal: 20, 
        paddingBottom: 40 
    },
    card: { 
        padding: 20, 
        borderRadius: 24, 
        backgroundColor: '#FFFFFF', 
        marginBottom: 16, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A', 
        shadowOpacity: 0.06, 
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3
    },
    updateCard: { 
        borderLeftWidth: 6, 
        borderLeftColor: '#10B981' 
    },
    noticeCard: { 
        borderLeftWidth: 6, 
        borderLeftColor: '#6366F1' 
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 14 
    },
    badgeContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    badge: { 
        fontSize: 10, 
        fontWeight: '800', 
        marginLeft: 6, 
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    versionBadge: { 
        backgroundColor: '#ECFDF5', 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    versionText: { 
        fontSize: 11, 
        color: '#059669', 
        fontWeight: '800' 
    },
    title: { 
        fontSize: 19, 
        fontWeight: '800', 
        color: '#1E293B',
        lineHeight: 24
    },
    description: { 
        fontSize: 14, 
        color: '#64748B', 
        marginTop: 8, 
        lineHeight: 22,
        fontWeight: '500'
    },
    downloadBtn: { 
        flexDirection: 'row',
        backgroundColor: '#1E293B', 
        paddingVertical: 14, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: '#1E293B',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    downloadText: { 
        color: '#FFFFFF', 
        fontWeight: '700', 
        marginLeft: 10,
        fontSize: 15
    },
    footer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        marginTop: 18, 
        borderTopWidth: 1, 
        borderTopColor: '#F1F5F9', 
        paddingTop: 12 
    },
    date: { 
        fontSize: 12, 
        color: '#94A3B8', 
        marginLeft: 6,
        fontWeight: '600'
    },
    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 100,
        paddingHorizontal: 40
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8
    },
    emptySub: { 
        textAlign: 'center', 
        color: '#94A3B8', 
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500'
    }
});

export default TeacherBroadcastScreen;