import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar,
    Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const BroadcastScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [notices, setNotices] = useState([]);
    const [form, setForm] = useState({
        type: 'NOTICE', 
        target: 'ALL',
        title: '',
        description: '',
        version: '',
        downloadLink: ''
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await apiClient.get('/admin/notices'); 
            if (res.data.success) {
                setNotices(res.data.notices);
            }
        } catch (err) {
            console.log("Fetch Error:", err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!form.title || !form.description) {
            Vibration.vibrate(50);
            return Alert.alert("Required Fields", "Please provide at least a Title and Description.");
        }
        
        if (form.type === 'UPDATE' && (!form.version || !form.downloadLink)) {
            return Alert.alert("Update Details Missing", "Version and Download Link are mandatory for App Updates.");
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/admin/broadcast', form);
            if (res.data.success) {
                Alert.alert("Broadcast Sent 🚀", "Message has been pushed to the selected users.");
                setForm({ type: 'NOTICE', target: 'ALL', title: '', description: '', version: '', downloadLink: '' });
                fetchHistory(); 
            }
        } catch (err) {
            Alert.alert("Operation Failed", "Could not transmit broadcast.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Remove Broadcast", 
            "This will remove the notice from the user's history. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await apiClient.delete(`/admin/broadcast/${id}`);
                            if (res.data.success) {
                                fetchHistory();
                            }
                        } catch (err) {
                            Alert.alert("Error", "Could not delete broadcast.");
                        }
                    } 
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Communications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Create New Broadcast</Text>

                    {/* TYPE SELECTION */}
                    <Text style={styles.miniLabel}>BROADCAST TYPE</Text>
                    <View style={styles.tabRow}>
                        {['NOTICE', 'UPDATE'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.tab, form.type === t && styles.activeTab]} 
                                onPress={() => setForm({...form, type: t})}
                            >
                                <Text style={[styles.tabText, form.type === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* TARGET SELECTION */}
                    <Text style={styles.miniLabel}>RECIPIENT GROUP</Text>
                    <View style={styles.tabRow}>
                        {['ALL', 'TEACHER', 'STUDENT'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.tab, form.target === t && styles.activeTab]} 
                                onPress={() => setForm({...form, target: t})}
                            >
                                <Text style={[styles.tabText, form.target === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Notice Title" 
                        placeholderTextColor="#94A3B8"
                        value={form.title} 
                        onChangeText={(v) => setForm({...form, title: v})} 
                    />
                    <TextInput 
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                        placeholder="Type your message here..." 
                        placeholderTextColor="#94A3B8"
                        multiline 
                        value={form.description} 
                        onChangeText={(v) => setForm({...form, description: v})} 
                    />

                    {form.type === 'UPDATE' && (
                        <View style={styles.updateContainer}>
                            <View style={styles.updateHeader}>
                                <Ionicons name="rocket" size={18} color="#4F46E5" />
                                <Text style={styles.updateLabel}>Software Patch Details</Text>
                            </View>
                            <TextInput 
                                style={styles.updateInput} 
                                placeholder="Version (e.g. 1.2.0)" 
                                value={form.version} 
                                onChangeText={(v) => setForm({...form, version: v})} 
                            />
                            <TextInput 
                                style={styles.updateInput} 
                                placeholder="Direct Download Link" 
                                value={form.downloadLink} 
                                onChangeText={(v) => setForm({...form, downloadLink: v})} 
                            />
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.mainSendBtn, loading && { opacity: 0.7 }]} 
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="send" size={18} color="#FFF" style={{marginRight: 10}} />
                                <Text style={styles.sendText}>Push Broadcast</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* HISTORY SECTION */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeaderRow}>
                        <Text style={styles.sectionTitle}>Broadcast History</Text>
                        <TouchableOpacity onPress={fetchHistory}>
                             <Ionicons name="refresh" size={20} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                    
                    {historyLoading ? (
                        <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
                    ) : (
                        notices.map((item) => (
                            <View key={item._id} style={styles.historyCard}>
                                <View style={styles.historyContent}>
                                    <View style={styles.badgeRow}>
                                        <View style={[styles.typeBadge, item.type === 'UPDATE' ? styles.updateBadge : styles.noticeBadge]}>
                                            <Text style={styles.badgeText}>{item.type}</Text>
                                        </View>
                                        <Text style={styles.targetLabel}>Sent to: {item.target}</Text>
                                    </View>
                                    <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.historyDesc} numberOfLines={2}>{item.description}</Text>
                                </View>
                                
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                                    <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    
                    {notices.length === 0 && !historyLoading && (
                        <View style={styles.emptyBox}>
                            <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No prior broadcasts found.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    container: { flex: 1, padding: 20 },
    formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#64748B', shadowOpacity: 0.1, shadowRadius: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    miniLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
    tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    tabText: { color: '#94A3B8', fontWeight: '700', fontSize: 12 },
    activeTabText: { color: '#4F46E5' },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 15, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
    updateContainer: { backgroundColor: '#EEF2FF', padding: 15, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' },
    updateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    updateLabel: { fontSize: 14, fontWeight: '800', color: '#4F46E5', marginLeft: 8 },
    updateInput: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10, color: '#1E293B' },
    mainSendBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
    sendText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    historySection: { marginTop: 35 },
    historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    historyCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03 },
    historyContent: { flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
    noticeBadge: { backgroundColor: '#4F46E5' },
    updateBadge: { backgroundColor: '#F59E0B' },
    targetLabel: { fontSize: 11, color: '#94A3B8', marginLeft: 10, fontWeight: '600' },
    historyTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    historyDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
    deleteBtn: { padding: 10, marginLeft: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
    emptyBox: { alignItems: 'center', marginTop: 30 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});

export default BroadcastScreen;