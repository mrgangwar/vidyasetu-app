import React, { useState, useContext, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Image, Alert, ScrollView, ActivityIndicator, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const TeacherProfileScreen = () => {
    const { user, setUser } = useContext(AuthContext);
    
    // States initialized with current user context
    const [name, setName] = useState(user?.name || '');
    const [coachingName, setCoachingName] = useState(user?.coachingName || '');
    const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
    const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [qualifications, setQualifications] = useState(user?.qualifications || '');
    const [image, setImage] = useState(null); // Local URI for new picks
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !contactNumber) {
            return Alert.alert("Error", "Name and Contact Number are required");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('coachingName', coachingName);
            formData.append('contactNumber', contactNumber);
            formData.append('whatsappNumber', whatsappNumber);
            formData.append('address', address);
            formData.append('qualifications', qualifications);

            // 📸 Only append image if a NEW one was picked
            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename,
                    type: type,
                });
            }

            const res = await apiClient.put(`/teacher/update-profile/${user?._id || user?.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setUser(res.data.user); // Sync with AuthContext
                setImage(null); // Reset local picker state
                Alert.alert("Success 🎉", "Your profile has been updated and synchronized.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to update profile.";
            Alert.alert("Update Failed ❌", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView 
            contentContainerStyle={styles.container} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Header Profile UI */}
            <View style={styles.header}>
                <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                    {image || user?.profilePhoto ? (
                        <Image 
                            source={{ uri: image || `http://10.54.31.32:5000/${user?.profilePhoto}` }} 
                            style={styles.profileImg} 
                        />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="person" size={50} color="#94A3B8" />
                        </View>
                    )}
                    <View style={styles.cameraIcon}>
                        <Ionicons name="camera" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.emailText}>{user?.email}</Text>
                <View style={styles.roleBadgeContainer}>
                    <Text style={styles.roleBadge}>{user?.role || 'TEACHER'}</Text>
                </View>
            </View>

            <View style={styles.form}>
                <InputField label="Full Name" value={name} onChange={setName} icon="person-outline" />
                <InputField label="Coaching Name" value={coachingName} onChange={setCoachingName} icon="business-outline" />
                <InputField label="Qualifications" value={qualifications} onChange={setQualifications} icon="school-outline" />
                <InputField label="Contact Number" value={contactNumber} onChange={setContactNumber} keyboard="phone-pad" icon="call-outline" />
                <InputField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} keyboard="phone-pad" icon="logo-whatsapp" />
                <InputField label="Office Address" value={address} onChange={setAddress} multiline icon="location-outline" />

                <TouchableOpacity 
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleSave} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const InputField = ({ label, value, onChange, keyboard = 'default', multiline = false, icon }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            <Ionicons name={icon} size={20} color="#4F46E5" style={styles.icon} />
            <TextInput 
                style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]} 
                value={value} 
                onChangeText={onChange} 
                keyboardType={keyboard}
                multiline={multiline}
                placeholderTextColor="#CBD5E1"
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { paddingBottom: 40, backgroundColor: '#F8FAFC' },
    header: { 
        alignItems: 'center', 
        paddingVertical: 30, 
        backgroundColor: '#fff', 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40, 
        elevation: 4, 
        shadowColor: '#64748B', 
        shadowOpacity: 0.1 
    },
    imageWrapper: { marginBottom: 15, position: 'relative' },
    profileImg: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: '#EEF2FF' },
    placeholder: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#4F46E5', padding: 10, borderRadius: 25, borderWidth: 3, borderColor: '#fff' },
    emailText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
    roleBadgeContainer: { marginTop: 10, backgroundColor: '#EEF2FF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12 },
    roleBadge: { color: '#4F46E5', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    form: { paddingHorizontal: 25, marginTop: 25 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, color: '#475569', marginBottom: 8, fontWeight: '700', marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15 },
    icon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B', fontWeight: '500' },
    saveBtn: { backgroundColor: '#4F46E5', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 15, elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3 },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});

export default TeacherProfileScreen;