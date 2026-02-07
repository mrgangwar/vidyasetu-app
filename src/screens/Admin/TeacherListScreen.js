import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, 
    Image, ActivityIndicator, RefreshControl, SafeAreaView, 
    StatusBar, Animated, Vibration, Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const TeacherListScreen = ({ navigation }) => {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Animation for list entrance
    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchTeachers = async (query = '') => {
        if (!query && !refreshing) setLoading(true);
        try {
            const res = await apiClient.get(`/admin/teachers?search=${query}`);
            setTeachers(res.data.teachers || []);
        } catch (err) {
            console.error("Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Debounce Search Logic: Prevents excessive API calls
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search) fetchTeachers(search);
            else fetchTeachers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setSearch('');
        fetchTeachers();
    }, []);

    const renderTeacherItem = ({ item, index }) => {
        // Animation for each item
        const inputRange = [-1, 0, 100 * index, 100 * (index + 2)];
        const scale = scrollY.interpolate({
            inputRange,
            outputRange: [1, 1, 1, 0.9],
        });

        return (
            <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('TeacherDetails', { teacherId: item._id })}
                    activeOpacity={0.9}
                >
                    <View style={styles.imageContainer}>
                        <Image 
                            source={item.profilePhoto 
                                ? { uri: `http://10.54.31.32:5000/${item.profilePhoto}` } 
                                : { uri: 'https://ui-avatars.com/api/?name=' + item.name + '&background=6366F1&color=fff' }
                            } 
                            style={styles.avatar} 
                        />
                        {item.isActive && <View style={styles.activeDot} />}
                    </View>

                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.subjectBadge}>
                                <Text style={styles.subjectText}>{item.subject || 'General'}</Text>
                            </View>
                            <Text style={styles.coachingText}>• {item.coachingName || 'VidyaSetu Partner'}</Text>
                        </View>
                        <Text style={styles.emailText}>{item.email}</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => {
                            Vibration.vibrate(20);
                            Linking.openURL(`whatsapp://send?phone=${item.contactNumber}`);
                        }}
                    >
                        <Ionicons name="logo-whatsapp" size={22} color="#22C55E" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* STICKY HEADER AREA */}
            <View style={styles.headerArea}>
                <View style={styles.titleRow}>
                    <Text style={styles.mainTitle}>Faculty Directory</Text>
                    <View style={styles.countChip}>
                        <Text style={styles.countText}>{teachers.length} Total</Text>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#94A3B8" style={{ marginLeft: 12 }} />
                    <TextInput 
                        style={styles.searchBar}
                        placeholder="Search by name or institution..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#CBD5E1" style={{ marginRight: 12 }} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Synchronizing Data...</Text>
                </View>
            ) : (
                <Animated.FlatList 
                    data={teachers}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    renderItem={renderTeacherItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={80} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No registered teachers found</Text>
                            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                                <Text style={styles.refreshBtnText}>Refresh Directory</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerArea: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    mainTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    countChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    countText: { color: '#4F46E5', fontWeight: '800', fontSize: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, height: 50 },
    searchBar: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: '#0F172A', fontWeight: '600' },
    listContent: { padding: 18, paddingBottom: 100 },
    cardWrapper: { marginBottom: 12 },
    card: { 
        flexDirection: 'row', padding: 16, backgroundColor: '#FFF', 
        borderRadius: 24, alignItems: 'center', shadowColor: '#64748B', 
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
    },
    imageContainer: { position: 'relative' },
    avatar: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#F1F5F9' },
    activeDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    info: { flex: 1, marginLeft: 15 },
    name: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subjectBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    subjectText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    coachingText: { fontSize: 12, color: '#94A3B8', marginLeft: 6, fontWeight: '600' },
    emailText: { fontSize: 12, color: '#CBD5E1', marginTop: 4 },
    actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#94A3B8', fontWeight: '700' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '700', marginTop: 15 },
    refreshBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 12 },
    refreshBtnText: { color: '#FFF', fontWeight: '800' }
});

export default TeacherListScreen;