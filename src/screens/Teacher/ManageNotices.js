import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    FlatList, Alert, ActivityIndicator, Keyboard, RefreshControl, SafeAreaView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const ManageNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState({ title: '', description: '' });

    useEffect(() => { 
        fetchNotices(); 
    }, []);

    const fetchNotices = async () => {
        try {
            setRefreshing(true);
            const res = await apiClient.get('/teacher/my-notices'); 
            if (res.data.success) {
                setNotices(res.data.notices);
            }
        } catch (err) { 
            console.log("Fetch Error:", err.response?.data || err.message);
            Alert.alert("Sync Error", "Unable to retrieve notice history. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    const handlePost = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            return Alert.alert("Required Fields", "Please provide both a title and description for the notice.");
        }
        
        setLoading(true);
        try {
            const res = await apiClient.post('/teacher/create-notice', form);
            
            if (res.data.success) {
                setForm({ title: '', description: '' });
                Keyboard.dismiss();
                Alert.alert("Notice Published", "The announcement has been posted and students have been notified.");
                fetchNotices();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Internal server error occurred.";
            Alert.alert("Publication Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        Alert.alert(
            "Delete Announcement", 
            "This action is permanent. Are you sure you want to remove this notice?", 
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Confirm Delete", style: 'destructive', onPress: () => deleteNotice(id) }
            ]
        );
    };

    const deleteNotice = async (id) => {
        try {
            const res = await apiClient.delete(`/teacher/notice/${id}`);
            if (res.data.success) {
                setNotices(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) { 
            console.log("Delete Error:", err);
            Alert.alert("Action Failed", "Could not remove the selected notice.");
        }
    };

    const renderNoticeItem = ({ item }) => (
        <View style={styles.noticeItem}>
            <View style={styles.noticeIndicator} />
            <View style={styles.noticeBody}>
                <View style={styles.noticeHeader}>
                    <Text style={styles.noticeTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.noticeDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short'
                        })}
                    </Text>
                </View>
                <Text style={styles.noticeDesc}>{item.description}</Text>
            </View>
            <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => confirmDelete(item._id)} 
                style={styles.delBtn}
            >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.screenHeader}>
                    <Text style={styles.headerSubtitle}>Communication</Text>
                    <Text style={styles.headerTitle}>Bulletin Board</Text>
                </View>

                <View style={styles.inputCard}>
                    <Text style={styles.cardLabel}>Create Announcement</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Subject Title" 
                        placeholderTextColor="#94A3B8"
                        value={form.title}
                        onChangeText={t => setForm({...form, title: t})}
                    />
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        placeholder="Compose your message here..." 
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={t => setForm({...form, description: t})}
                    />
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={[styles.postBtn, loading && styles.btnDisabled]} 
                        onPress={handlePost} 
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={16} color="#fff" style={{marginRight: 8}} />
                                <Text style={styles.postBtnText}>Publish Notice</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>Sent Records</Text>
                    <TouchableOpacity onPress={fetchNotices} style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={14} color="#6366F1" />
                        <Text style={styles.refreshText}>Sync</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notices}
                    keyExtractor={item => item._id}
                    renderItem={renderNoticeItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchNotices} tintColor="#6366F1" />
                    }
                    ListEmptyComponent={
                        !refreshing && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="mail-open-outline" size={48} color="#E2E8F0" />
                                <Text style={styles.emptyText}>No active announcements found.</Text>
                            </View>
                        )
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },
    screenHeader: { marginTop: 15, marginBottom: 20 },
    headerSubtitle: { fontSize: 12, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
    inputCard: { 
        backgroundColor: '#FFFFFF', 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 25, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 10,
        elevation: 4 
    },
    cardLabel: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { 
        backgroundColor: '#F8FAFC', 
        borderRadius: 14, 
        padding: 14, 
        marginBottom: 12, 
        fontSize: 15, 
        color: '#1E293B',
        fontWeight: '500',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    postBtn: { 
        backgroundColor: '#6366F1', 
        padding: 16, 
        borderRadius: 16, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    btnDisabled: { opacity: 0.7 },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    refreshText: { color: '#6366F1', fontSize: 12, fontWeight: '700', marginLeft: 4 },
    noticeItem: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        marginBottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden'
    },
    noticeIndicator: { width: 5, height: '100%', backgroundColor: '#6366F1' },
    noticeBody: { flex: 1, padding: 16 },
    noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    noticeTitle: { fontWeight: '800', fontSize: 16, color: '#1E293B', flex: 1, marginRight: 10 },
    noticeDate: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
    noticeDesc: { fontSize: 14, color: '#64748B', lineHeight: 20, fontWeight: '500' },
    delBtn: { padding: 12, backgroundColor: '#FFF1F2', borderRadius: 12, marginRight: 12 },
    listContent: { paddingBottom: 30 },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 12, fontWeight: '600' }
});

export default ManageNotices;