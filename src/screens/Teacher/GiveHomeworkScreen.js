import React, { useState, useContext } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, 
    StyleSheet, Alert, ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

export default function GiveHomeworkScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]); 
    const [form, setForm] = useState({
        title: '',
        description: '',
        batchTime: '', 
    });

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                multiple: true,
            });

            if (!result.canceled) {
                setFiles([...files, ...result.assets]);
            }
        } catch (err) {
            Alert.alert("System Error", "Unable to access document storage.");
        }
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleUpload = async () => {
        if (!form.title || !form.batchTime) {
            return Alert.alert("Required Fields", "Please provide a title and batch time.");
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('batchTime', form.batchTime);

        files.forEach((file) => {
            formData.append('files', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType,
            });
        });

        try {
            const res = await apiClient.post('/teacher/create-homework', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                Alert.alert("Assignment Created", "Homework has been successfully assigned and notifications sent.");
                navigation.navigate('HomeworkHistory');
            }
        } catch (error) {
            Alert.alert("Upload Failed", error.response?.data?.message || "An unexpected error occurred during upload.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Navigation */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerLabel}>Curriculum</Text>
                        <Text style={styles.mainTitle}>New Homework</Text>
                    </View>
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        style={styles.historyBtn} 
                        onPress={() => navigation.navigate('HomeworkHistory')}
                    >
                        <Ionicons name="receipt-outline" size={18} color="#4F46E5" />
                        <Text style={styles.historyBtnText}>History</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Section */}
                <View style={styles.formCard}>
                    <Text style={styles.label}>Assignment Title</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Calculus Practice Set" 
                        placeholderTextColor="#94A3B8"
                        value={form.title} 
                        onChangeText={t => setForm({...form, title: t})} 
                    />

                    <Text style={styles.label}>Batch Schedule</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. 10:00 AM - 12:00 PM" 
                        placeholderTextColor="#94A3B8"
                        value={form.batchTime} 
                        onChangeText={t => setForm({...form, batchTime: t})} 
                    />

                    <Text style={styles.label}>Instructions</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        multiline 
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholder="Enter detailed task instructions here..." 
                        placeholderTextColor="#94A3B8"
                        value={form.description} 
                        onChangeText={t => setForm({...form, description: t})} 
                    />
                </View>

                {/* Attachment Section */}
                <Text style={styles.sectionTitle}>Support Material</Text>
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    style={styles.attachBtn} 
                    onPress={pickDocument}
                >
                    <View style={styles.attachIconContainer}>
                        <Ionicons name="document-attach-outline" size={24} color="#4F46E5" />
                    </View>
                    <View>
                        <Text style={styles.attachText}>Add Documents</Text>
                        <Text style={styles.attachSubtext}>Images or PDF files supported</Text>
                    </View>
                </TouchableOpacity>

                {/* File Previews */}
                <View style={styles.fileList}>
                    {files.map((f, i) => (
                        <View key={i} style={styles.fileCard}>
                            <Ionicons 
                                name={f.mimeType === 'application/pdf' ? 'document-text' : 'image'} 
                                size={22} 
                                color="#64748B" 
                            />
                            <Text numberOfLines={1} style={styles.fileName}>{f.name}</Text>
                            <TouchableOpacity onPress={() => removeFile(i)} style={styles.removeFileBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                    onPress={handleUpload} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.btnInner}>
                            <Text style={styles.submitText}>Publish Assignment</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 24, paddingBottom: 50 },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: 32 
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4
    },
    mainTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    historyBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 14, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    historyBtnText: { color: '#4F46E5', fontWeight: '800', marginLeft: 6, fontSize: 14 },
    formCard: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#475569', marginLeft: 4 },
    input: { 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 18, 
        paddingVertical: 16, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        borderColor: '#F1F5F9', 
        marginBottom: 20, 
        fontSize: 16, 
        color: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2
    },
    textArea: { height: 120, paddingTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 16, marginLeft: 4 },
    attachBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF',
        padding: 20, 
        borderRadius: 20, 
        borderStyle: 'dashed', 
        borderWidth: 2, 
        borderColor: '#C7D2FE', 
        marginBottom: 20 
    },
    attachIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    attachText: { color: '#4F46E5', fontWeight: '800', fontSize: 16 },
    attachSubtext: { color: '#94A3B8', fontSize: 12, fontWeight: '500', marginTop: 2 },
    fileList: { marginBottom: 10 },
    fileCard: { 
        flexDirection: 'row', 
        backgroundColor: '#FFFFFF', 
        padding: 14, 
        borderRadius: 14, 
        marginBottom: 12, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    fileName: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '600', marginLeft: 12 },
    removeFileBtn: { padding: 4 },
    submitBtn: { 
        backgroundColor: '#4F46E5', 
        padding: 20, 
        borderRadius: 20, 
        alignItems: 'center', 
        marginTop: 20,
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15
    },
    submitBtnDisabled: { opacity: 0.6 },
    btnInner: { flexDirection: 'row', alignItems: 'center' },
    submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginRight: 10 },
});