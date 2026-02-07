import React, { useState, useContext } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Image, Alert, ScrollView, ActivityIndicator, Platform,
    SafeAreaView, StatusBar, KeyboardAvoidingView
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';

const AdminProfileScreen = ({ navigation }) => {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    
    // Initializing state with existing user data
    const [name, setName] = useState(user?.name || '');
    const [whatsapp, setWhatsapp] = useState(user?.whatsappNumber || '');
    const [contact, setContact] = useState(user?.contactNumber || '');
    const [image, setImage] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleSave = async () => {
        if (!name || !contact) {
            return Alert.alert("Required", "Name and Contact Number are essential.");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('whatsappNumber', whatsapp);
            formData.append('contactNumber', contact);

            if (image) {
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
                    name: filename || 'admin_pfp.jpg',
                    type: type,
                });
            }

            const res = await apiClient.put('/admin/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                // Updating Global Auth Context to reflect changes everywhere
                setUser(res.data.user); 
                Alert.alert("Success 🎉", "Your profile has been synchronized.");
                navigation.goBack();
            }
        } catch (err) {
            Alert.alert("Update Error", err.response?.data?.message || "Failed to connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {/* Header Navigation */}
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                        <Ionicons name="chevron-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    
                    {/* Profile Picture Section */}
                    <View style={styles.imageSection}>
                        <View style={styles.imageWrapper}>
                            <Image 
                                source={image ? { uri: image.uri } : { uri: `http://10.54.31.32:5000/${user?.profilePhoto}` }} 
                                style={styles.profileImg} 
                            />
                            <TouchableOpacity onPress={pickImage} style={styles.cameraBadge}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.adminEmail}>{user?.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>SUPER ADMIN</Text>
                        </View>
                    </View>

                    {/* Information Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.cardHeader}>Identity & Contact</Text>
                        
                        <CustomInput label="Full Name" icon="person-outline" value={name} onChange={setName} />
                        <CustomInput label="WhatsApp Number" icon="logo-whatsapp" value={whatsapp} onChange={setWhatsapp} keyboardType="phone-pad" />
                        <CustomInput label="Direct Contact" icon="call-outline" value={contact} onChange={setContact} keyboardType="phone-pad" />

                        <TouchableOpacity 
                            style={[styles.saveBtn, loading && { opacity: 0.8 }]} 
                            onPress={handleSave} 
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Preferences</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Internal Component for Reusable Inputs
const CustomInput = ({ label, icon, value, onChange, ...props }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapperInner}>
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
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    container: { padding: 20 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    imageWrapper: { position: 'relative' },
    profileImg: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#E2E8F0', borderWidth: 4, borderColor: '#FFF' },
    cameraBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4F46E5', width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F8FAFC' },
    adminEmail: { marginTop: 15, fontSize: 16, color: '#64748B', fontWeight: '600' },
    roleBadge: { marginTop: 8, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    roleText: { color: '#4F46E5', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    formCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, shadowColor: '#64748B', shadowOpacity: 0.08, shadowRadius: 15, elevation: 4 },
    cardHeader: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
    inputWrapperInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B', fontWeight: '600' },
    saveBtn: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

export default AdminProfileScreen;