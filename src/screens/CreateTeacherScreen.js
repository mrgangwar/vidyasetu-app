import React, { useState, useRef } from 'react';
import { 
    View, TextInput, TouchableOpacity, Image, Text, StyleSheet, 
    ScrollView, Modal, ActivityIndicator, Platform, Linking, 
    StatusBar, SafeAreaView, Vibration, Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo environment
import apiClient from '../api/client';

export default function CreateTeacherScreen({ navigation }) {
    const initialState = {
        name: '', email: '', password: '', coachingName: '', 
        address: '', qualifications: '', subject: '', contactNumber: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState('');

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], 
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Vibration.vibrate(50);
            return alert("Essential Fields Required", "Please provide a Name, Email, and Password.");
        }

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    let value = formData[key];
                    if (key === 'contactNumber' && value.length === 10) value = `91${value}`;
                    data.append(key, value);
                }
            });

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename || 'photo.jpg',
                    type: type === 'image/jpg' ? 'image/jpeg' : type,
                });
            }

            const response = await apiClient.post('/admin/create-teacher', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setWhatsappLink(response.data.whatsappLink);
                setModalVisible(true); // Open Premium Success Modal
                Vibration.vibrate(100);
            }
        } catch (error) {
            alert('Registration Failed', error.response?.data?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const FormInput = ({ label, placeholder, value, onChangeText, field, ...props }) => (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TextInput 
                style={[styles.input, isFocused === field && styles.inputFocused]}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(field)}
                onBlur={() => setIsFocused(null)}
                {...props}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            {/* SUCCESS MODAL */}
            <Modal transparent visible={modalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={styles.successIconBg}>
                            <Text style={{fontSize: 40}}>✨</Text>
                        </View>
                        <Text style={styles.modalTitle}>Teacher Onboarded</Text>
                        <Text style={styles.modalMessage}>The teacher account has been successfully created. Would you like to share the credentials now?</Text>
                        
                        <TouchableOpacity 
                            style={styles.whatsappBtn} 
                            onPress={() => {
                                if (whatsappLink) Linking.openURL(whatsappLink);
                                setModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => {setModalVisible(false); navigation.goBack();}}>
                            <Text style={styles.closeBtnText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Register Teacher</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                {/* PHOTO PICKER */}
                <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                    <View style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.img} />
                        ) : (
                            <Ionicons name="camera-outline" size={32} color="#64748B" />
                        )}
                    </View>
                    <View style={styles.addBadge}>
                        <Text style={{color: '#FFF', fontWeight: 'bold'}}>+</Text>
                    </View>
                </TouchableOpacity>

                {/* FORM FIELDS */}
                <View style={styles.formCard}>
                    <FormInput label="Full Name *" placeholder="Enter teacher's name" value={formData.name} onChangeText={(txt) => setFormData({...formData, name: txt})} field="name" />
                    <FormInput label="Email Address *" placeholder="name@institution.com" value={formData.email} onChangeText={(txt) => setFormData({...formData, email: txt})} field="email" keyboardType="email-address" autoCapitalize="none" />
                    <FormInput label="Temporary Password *" placeholder="Create a secure password" value={formData.password} onChangeText={(txt) => setFormData({...formData, password: txt})} field="pass" secureTextEntry />
                    <FormInput label="Coaching Name" placeholder="e.g. Vidya Academy" value={formData.coachingName} onChangeText={(txt) => setFormData({...formData, coachingName: txt})} field="coaching" />
                    <FormInput label="Subject Expertise" placeholder="e.g. Mathematics" value={formData.subject} onChangeText={(txt) => setFormData({...formData, subject: txt})} field="subject" />
                    <FormInput label="Qualifications" placeholder="e.g. M.Sc, B.Ed" value={formData.qualifications} onChangeText={(txt) => setFormData({...formData, qualifications: txt})} field="qual" />
                    <FormInput label="Contact Number" placeholder="91XXXXXXXXXX" value={formData.contactNumber} onChangeText={(txt) => setFormData({...formData, contactNumber: txt})} field="phone" keyboardType="numeric" />
                    <FormInput label="Address" placeholder="Enter physical address" value={formData.address} onChangeText={(txt) => setFormData({...formData, address: txt})} field="address" multiline />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Complete Registration</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    backBtnText: { fontSize: 24, color: '#0F172A' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    container: { padding: 20, paddingTop: 10 },
    imagePickerContainer: { alignSelf: 'center', marginBottom: 30, marginTop: 10 },
    imagePicker: { height: 110, width: 110, backgroundColor: '#F1F5F9', borderRadius: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', overflow: 'hidden' },
    img: { height: '100%', width: '100%' },
    addBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#4F46E5', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
    formCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0F172A', borderWidth: 1.5, borderColor: '#F1F5F9' },
    inputFocused: { borderColor: '#4F46E5', backgroundColor: '#FFF' },
    submitBtn: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' },
    successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
    modalMessage: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    whatsappBtn: { backgroundColor: '#25D366', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
    whatsappBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    closeBtn: { paddingVertical: 10 },
    closeBtnText: { color: '#94A3B8', fontWeight: '700' }
});