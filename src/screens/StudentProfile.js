import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    ScrollView, Image, Alert, ActivityIndicator, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client'; 

const StudentProfile = ({ route, navigation }) => {
    const { studentId } = route.params; 
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        fatherName: '',
        mobileNumber: '',
        monthlyFees: '',
        address: '',
        batchTime: '',
        collegeName: '',
        session: '',
        parentMobile: '',
        profilePhoto: null
    });

    useEffect(() => {
        fetchStudentDetails();
    }, []);

    const fetchStudentDetails = async () => {
        try {
            const res = await apiClient.get(`/teacher/student/${studentId}`);
            if (res.data.success) {
                const s = res.data.student;
                setForm({
                    name: s.name || '',
                    fatherName: s.fatherName || '',
                    mobileNumber: s.mobileNumber || '',
                    monthlyFees: s.monthlyFees?.toString() || '',
                    address: s.address || '',
                    batchTime: s.batchTime || '',
                    collegeName: s.collegeName || '',
                    session: s.session || '',
                    parentMobile: s.parentMobile || '',
                    profilePhoto: s.profilePhoto
                });
            }
        } catch (err) {
            console.error("Fetch Error:", err.message);
            Alert.alert("Error", "Could not fetch student details");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3, // 🚨 Quality kam rakhi hai taaki upload fast ho
        });

        if (!result.canceled) {
            setForm({ ...form, profilePhoto: result.assets[0].uri });
        }
    };

    const handleUpdate = async () => {
    if (!form.name || !form.monthlyFees) {
        return Alert.alert("Error", "Name and Monthly Fees are required!");
    }

    setUpdating(true);
    try {
        const formData = new FormData();
        
        // Text fields
        formData.append('name', form.name);
        formData.append('fatherName', form.fatherName);
        formData.append('mobileNumber', form.mobileNumber);
        formData.append('monthlyFees', form.monthlyFees);
        formData.append('address', form.address);
        formData.append('batchTime', form.batchTime);
        formData.append('collegeName', form.collegeName);
        formData.append('session', form.session);
        formData.append('parentMobile', form.parentMobile);

        // Photo Handling
        if (form.profilePhoto && (form.profilePhoto.startsWith('file://') || form.profilePhoto.startsWith('content://'))) {
            const uri = form.profilePhoto;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            
            formData.append('profilePhoto', {
                uri: uri,
                name: filename || 'photo.jpg',
                type: type
            });
            console.log("📸 New Photo Added to FormData");
        }

        console.log("🚀 Attempting Update for ID:", studentId);

        // ✅ URL mein BACKTICKS use karein
        const res = await apiClient.put(`/teacher/update-student/${studentId}`, formData);
        
        if (res.data.success) {
            Alert.alert("Success ✅", "Student profile updated!");
            navigation.goBack();
        }
    } catch (err) {
        // Detailed Error Logging
        console.log("❌ Full Error Object:", err);
        const errorMsg = err.response?.data?.message || err.message;
        Alert.alert("Update Failed", errorMsg);
    } finally {
        setUpdating(false);
    }
};

    const handleDelete = async () => {
        Alert.alert("Wait!", "Delete this student permanently?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                    const res = await apiClient.delete(`/teacher/delete-student/${studentId}`);
                    if (res.data.success) {
                        Alert.alert("Deleted", "Student removed");
                        navigation.goBack();
                    }
                } catch (err) { Alert.alert("Error", "Could not delete student"); }
            }}
        ]);
    };

    if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#6366F1" />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                    <Image 
                        source={{ uri: form.profilePhoto || 'https://via.placeholder.com/150' }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.editBadge}><Text>📸</Text></View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{form.name}</Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={t => setForm({...form, name: t})} />

                <Text style={styles.label}>Father's Name</Text>
                <TextInput style={styles.input} value={form.fatherName} onChangeText={t => setForm({...form, fatherName: t})} />

                <View style={styles.row}>
                    <View style={{width: '48%'}}>
                        <Text style={styles.label}>Mobile</Text>
                        <TextInput style={styles.input} keyboardType="phone-pad" value={form.mobileNumber} onChangeText={t => setForm({...form, mobileNumber: t})} />
                    </View>
                    <View style={{width: '48%'}}>
                        <Text style={styles.label}>Monthly Fees</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={form.monthlyFees} onChangeText={t => setForm({...form, monthlyFees: t})} />
                    </View>
                </View>

                <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={updating}>
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={styles.deleteText}>Delete Student 🗑️</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { backgroundColor: '#6366F1', paddingVertical: 40, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
    editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', padding: 6, borderRadius: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 15 },
    formCard: { backgroundColor: '#fff', marginTop: -30, marginHorizontal: 20, padding: 20, borderRadius: 25, elevation: 10, marginBottom: 40 },
    label: { fontSize: 13, color: '#64748B', marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    updateBtn: { backgroundColor: '#6366F1', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
    deleteBtn: { marginTop: 25, alignItems: 'center' },
    deleteText: { color: '#EF4444', fontWeight: '700' }
});

export default StudentProfile;