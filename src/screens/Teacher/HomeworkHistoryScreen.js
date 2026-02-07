import React, { useState, useEffect } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    Alert, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

export default function HomeworkHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get('/teacher/my-homeworks'); 
            if (res.data.success) {
                setHistory(res.data.history);
            }
        } catch (error) {
            Alert.alert("Connection Error", "Unable to load assignment history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { 
        fetchHistory(); 
    }, []);

    const confirmDelete = (id) => {
        Alert.alert(
            "Remove Assignment",
            "This action will permanently delete the homework for all students.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: 'destructive', 
                    onPress: () => handleDelete(id) 
                }
            ]
        );
    };

    const handleDelete = async (id) => {
        try {
            const res = await apiClient.delete(`/teacher/delete-homework/${id}`);
            if (res.data.success) {
                setHistory(history.filter(item => item._id !== id));
                Alert.alert("Deleted", "Assignment successfully removed.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete the assignment.");
        }
    };

    if (loading) return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loaderText}>Retrieving Records</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>History</Text>
                    <Text style={styles.headerTitle}>Past Assignments</Text>
                </View>

                <FlatList 
                    data={history}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={() => { setRefreshing(true); fetchHistory(); }} 
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                                        <Text style={styles.metaText}>
                                            {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color="#64748B" />
                                        <Text style={styles.metaText}>{item.batchTime}</Text>
                                    </View>
                                </View>

                                <View style={styles.attachmentBadge}>
                                    <Ionicons name="attach" size={14} color="#4F46E5" />
                                    <Text style={styles.attachmentText}>
                                        {item.attachments?.length || 0} Material Attached
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                activeOpacity={0.7}
                                onPress={() => confirmDelete(item._id)} 
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No assignments found</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#FFFFFF' 
    },
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC' 
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    loaderText: {
        marginTop: 12,
        color: '#64748B',
        fontWeight: '600'
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 25,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 4
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1E293B'
    },
    listPadding: {
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 40
    },
    card: { 
        backgroundColor: '#FFFFFF', 
        padding: 18, 
        borderRadius: 24, 
        marginBottom: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2 
    },
    cardInfo: { 
        flex: 1 
    },
    title: { 
        fontSize: 18, 
        fontWeight: '800', 
        color: '#1E293B', 
        marginBottom: 8 
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15
    },
    metaText: { 
        fontSize: 13, 
        color: '#64748B', 
        marginLeft: 4,
        fontWeight: '500' 
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    attachmentText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '700',
        marginLeft: 4
    },
    deleteBtn: { 
        width: 48,
        height: 48,
        backgroundColor: '#FFF1F2', 
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15
    },
    emptyState: { 
        alignItems: 'center', 
        marginTop: 80 
    },
    emptyText: { 
        marginTop: 15, 
        color: '#94A3B8', 
        fontSize: 16,
        fontWeight: '600' 
    }
});