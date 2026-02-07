import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Alert, Image, SafeAreaView, ActivityIndicator, 
    KeyboardAvoidingView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const EditTeacherScreen = ({ route, navigation }) => {
    const { teacher } = route.params;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: teacher.name,
        coachingName: teacher.coachingId?.coachingName || '',
        subject: teacher.subject || '',
        contactNumber: teacher.contactNumber || '',
        address: teacher.address || '',
    });
    const [image, setImage] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('coachingName', formData.coachingName);
            data.append('subject', formData.subject);
            data.append('contactNumber', formData.contactNumber);
            data.append('address', formData.address);

            if (image) {
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
                    name: filename || 'profile.jpg',
                    type: type,
                });
            }

            const res = await apiClient.put(`/admin/teacher/update/${teacher._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                Alert.alert("Success 🎉", "Profile updated successfully");
                navigation.navigate('TeacherList'); 
            }
        } catch (err) {
            Alert.alert("Update Failed", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Faculty</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Photo Editor */}
                    <View style={styles.photoSection}>
                        <View style={styles.imageContainer}>
                            <Image 
                                source={image ? { uri: image.uri } : { uri: `http://10.54.31.32:5000/${teacher.profilePhoto}` }} 
                                style={styles.img} 
                            />
                            <TouchableOpacity onPress={pickImage} style={styles.cameraBtn}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.photoHint}>Tap camera to update photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <InputField label="Teacher Full Name" icon="person-outline" value={formData.name} onChange={(val) => setFormData({...formData, name: val})} />
                        <InputField label="Coaching Name" icon="business-outline" value={formData.coachingName} onChange={(val) => setFormData({...formData, coachingName: val})} />
                        <InputField label="Primary Subject" icon="book-outline" value={formData.subject} onChange={(val) => setFormData({...formData, subject: val})} />
                        <InputField label="Contact Number" icon="call-outline" value={formData.contactNumber} onChange={(val) => setFormData({...formData, contactNumber: val})} keyboardType="numeric" />
                        <InputField label="Full Address" icon="location-outline" value={formData.address} onChange={(val) => setFormData({...formData, address: val})} multiline />
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Synchronize Changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const InputField = ({ label, icon, value, onChange, ...props }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={20} color="#94A3B8" style={{ marginRight: 12 }} />
            <TextInput 
                style={styles.input} 
                value={value} 
                onChangeText={onChange}
                placeholderTextColor="#CBD5E1"
                {...props} 
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    scrollContent: { padding: 20, paddingBottom: 50 },
    photoSection: { alignItems: 'center', marginBottom: 30 },
    imageContainer: { position: 'relative' },
    img: { width: 110, height: 110, borderRadius: 35, backgroundColor: '#F1F5F9' },
    cameraBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4F46E5', width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
    photoHint: { marginTop: 12, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    form: { marginBottom: 30 },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1E293B', fontWeight: '600' },
    saveBtn: { backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 18, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

export default EditTeacherScreen;