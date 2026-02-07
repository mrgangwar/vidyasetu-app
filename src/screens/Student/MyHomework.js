import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Alert, RefreshControl, SafeAreaView 
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function MyHomework() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(null);

    // 📡 Server URL (Make sure this matches your local IP/Production URL)
    const SERVER_URL = 'http://10.54.31.32:5000'; 

    const fetchHomework = async () => {
        try {
            const res = await apiClient.get('/student/my-homework');
            if (res.data.success) {
                setHomeworks(res.data.homeworks);
            }
        } catch (e) {
            console.log("Homework Error:", e);
            Alert.alert("Error", "Homework records load nahi ho paaye.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHomework();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchHomework();
    };

    const downloadAndOpen = async (fileUrl, fileName) => {
        setDownloading(fileName);
        
        const safeFileName = fileName.replace(/\s/g, '_');
        const fileUri = FileSystem.cacheDirectory + safeFileName; 

        try {
            const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
            const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            const fullDownloadUrl = `${baseUrl}${cleanFileUrl}`;

            const info = await FileSystem.getInfoAsync(fileUri);
            
            if (info.exists) {
                await Sharing.shareAsync(fileUri);
            } else {
                const downloadRes = await FileSystem.downloadAsync(fullDownloadUrl, fileUri);
                if (downloadRes.status !== 200) throw new Error(`Status: ${downloadRes.status}`);
                await Sharing.shareAsync(downloadRes.uri);
            }
        } catch (error) {
            Alert.alert("Download Failed", "File open nahi ho saki. Please check internet connection.");
        } finally {
            setDownloading(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Subject Badge & Date */}
            <View style={styles.topRow}>
                <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{item.subject || 'General'}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            
            <View style={styles.instructionBox}>
                <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
                <Text style={styles.desc} numberOfLines={3}>
                    {item.description || "Teacher ne koi extra instructions nahi diye hain."}
                </Text>
            </View>
            
            {item.attachments && item.attachments.map((file, index) => {
                const extension = file.fileType === 'pdf' ? 'pdf' : 'jpg';
                const displayFileName = `HW_${item._id.slice(-4)}_${index}.${extension}`;
                const isPdf = file.fileType === 'pdf';

                return (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.downloadBtn, { backgroundColor: isPdf ? '#EEF2FF' : '#F0FDF4' }]} 
                        onPress={() => downloadAndOpen(file.fileUrl, displayFileName)}
                        disabled={downloading !== null}
                    >
                        {downloading === displayFileName ? (
                            <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                            <View style={styles.btnContent}>
                                <View style={[styles.iconCircle, { backgroundColor: isPdf ? '#4F46E5' : '#10B981' }]}>
                                    <Ionicons name={isPdf ? "document-text" : "image"} size={16} color="#fff" />
                                </View>
                                <Text style={[styles.btnText, { color: isPdf ? '#4F46E5' : '#10B981' }]}>
                                    View {isPdf ? 'Assignment PDF' : 'Attached Image'}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={isPdf ? '#4F46E5' : '#10B981'} style={{marginLeft: 'auto'}} />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerArea}>
                <Text style={styles.mainHeading}>My Assignments</Text>
                <Text style={styles.subHeading}>Daily homework and study material</Text>
            </View>

            {loading ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loaderText}>Getting your homework...</Text>
                </View>
            ) : (
                <FlatList 
                    data={homeworks} 
                    renderItem={renderItem} 
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="happy-outline" size={80} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>All Caught Up!</Text>
                            <Text style={styles.emptyDesc}>Koi bhi pending homework nahi mila. Mauj karo! 🎉</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerArea: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    mainHeading: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    subHeading: { fontSize: 13, color: '#64748B', marginTop: 2 },
    
    listPadding: { padding: 18, paddingBottom: 40 },
    card: { 
        backgroundColor: '#fff', 
        padding: 18, 
        borderRadius: 24, 
        marginBottom: 18, 
        elevation: 4, 
        shadowColor: '#6366F1', 
        shadowOpacity: 0.08, 
        shadowRadius: 10 
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    subjectBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    subjectText: { fontSize: 11, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '600' },
    
    title: { fontSize: 19, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    instructionBox: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 15 },
    desc: { fontSize: 13, color: '#475569', marginLeft: 8, lineHeight: 18, flex: 1 },
    
    downloadBtn: { padding: 12, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    btnText: { fontWeight: '700', fontSize: 14 },
    
    centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 10, color: '#64748B', fontWeight: '500' },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#475569', marginTop: 15 },
    emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});