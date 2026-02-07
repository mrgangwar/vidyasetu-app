import React, { useState, useContext, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, 
    StyleSheet, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/client'; 
import { AuthContext } from '../context/AuthContext'; 
import { Ionicons } from '@expo/vector-icons';

export default function AddStudentScreen({ navigation }) {
    const { user } = useContext(AuthContext); 
    const [image, setImage] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '', 
        fatherName: '', 
        collegeName: '', 
        address: '',
        mobileNumber: '', 
        email: '', 
        studentLoginId: '', 
        password: '', 
        batchTime: '', 
        session: new Date().getFullYear().toString(), 
        parentMobile: '', 
        monthlyFees: '', 
        joiningDate: new Date()
    });

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const handleSave = async () => {
        // Strict Validation based on your project logic
        if (!formData.name || !formData.studentLoginId || !formData.monthlyFees || !formData.password || !formData.mobileNumber) {
            return Alert.alert("Required Fields", "Please fill Name, Mobile, ID, Password, and Fees.");
        }

        setLoading(true);
        try {
            const data = new FormData();
            
            // Append text fields
            Object.keys(formData).forEach(key => {
                if (key === 'joiningDate') {
                    data.append(key, formData[key].toISOString());
                } else {
                    data.append(key, formData[key]);
                }
            });

            // Automatically link to Teacher's Coaching
            if (user?.coachingId) {
                data.append('coachingId', user.coachingId);
            }

            // Profile Photo Logic
            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename,
                    type: type,
                });
            }

            const res = await apiClient.post('/teacher/create-student', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                Alert.alert("Success ✅", `${formData.name} has been registered successfully.`, [
                    { text: "View Student List", onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.log("Registration Error:", error.response?.data);
            Alert.alert("Registration Failed", error.response?.data?.message || "Check your network connection.");
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>New Student</Text>
                    <Text style={styles.headerSub}>Fill in the details to create a student account</Text>
                </View>
                
                <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.img} />
                    ) : (
                        <View style={styles.cameraPlaceholder}>
                            <Ionicons name="camera" size={35} color="#4F46E5" />
                            <Text style={styles.photoLabel}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.form}>
                    <SectionLabel title="Essential Details" />
                    <InputField label="Student Full Name *" value={formData.name} onChange={t => setFormData({...formData, name: t})} icon="person-outline" />
                    <InputField label="Student ID / Username *" value={formData.studentLoginId} onChange={t => setFormData({...formData, studentLoginId: t})} icon="finger-print-outline" />
                    <InputField label="Login Password *" value={formData.password} onChange={t => setFormData({...formData, password: t})} icon="lock-closed-outline" secure />
                    
                    <SectionLabel title="Contact & Academic" />
                    <InputField label="Mobile Number *" value={formData.mobileNumber} onChange={t => setFormData({...formData, mobileNumber: t})} icon="call-outline" keyboard="phone-pad" />
                    <InputField label="Email Address" value={formData.email} onChange={t => setFormData({...formData, email: t})} icon="mail-outline" keyboard="email-address" />
                    <InputField label="Batch Time (e.g. 10:00 AM)" value={formData.batchTime} onChange={t => setFormData({...formData, batchTime: t})} icon="time-outline" />
                    <InputField label="Monthly Fees (INR) *" value={formData.monthlyFees} onChange={t => setFormData({...formData, monthlyFees: t})} icon="cash-outline" keyboard="numeric" />

                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                        <View style={styles.dateLeft}>
                            <Ionicons name="calendar-sharp" size={20} color="#4F46E5" />
                            <Text style={styles.dateText}> Joining Date</Text>
                        </View>
                        <Text style={styles.dateValue}>{formData.joiningDate.toDateString()}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker 
                            value={formData.joiningDate} 
                            mode="date" 
                            display="default"
                            onChange={(e, d) => { setShowDatePicker(false); if(d) setFormData({...formData, joiningDate: d}); }} 
                        />
                    )}

                    <TouchableOpacity 
                        style={[styles.btn, loading && { opacity: 0.7 }]} 
                        onPress={handleSave} 
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Student</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const SectionLabel = ({ title }) => (
    <Text style={styles.sectionLabel}>{title}</Text>
);

const InputField = ({ label, value, onChange, icon, keyboard = 'default', secure = false }) => (
    <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color="#94A3B8" style={{ marginRight: 12 }} />
        <TextInput 
            placeholder={label} 
            placeholderTextColor="#94A3B8"
            style={styles.textInput} 
            value={value} 
            onChangeText={onChange} 
            keyboardType={keyboard} 
            secureTextEntry={secure} 
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerContainer: { padding: 25, alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
    headerSub: { fontSize: 14, color: '#64748B', marginTop: 5 },
    imageBox: { 
        width: 110, height: 110, borderRadius: 35, backgroundColor: '#fff', 
        alignSelf: 'center', justifyContent: 'center', alignItems: 'center', 
        marginBottom: 30, elevation: 5, shadowColor: '#4F46E5', 
        shadowOpacity: 0.1, borderWidth: 2, borderColor: '#EEF2FF' 
    },
    img: { width: '100%', height: '100%', borderRadius: 33 },
    cameraPlaceholder: { alignItems: 'center' },
    photoLabel: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5', marginTop: 5 },
    form: { paddingHorizontal: 20 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
    inputWrapper: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
        paddingHorizontal: 16, borderRadius: 16, marginBottom: 16, 
        borderWidth: 1, borderColor: '#F1F5F9', elevation: 1
    },
    textInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B', fontWeight: '500' },
    datePickerBtn: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        padding: 16, backgroundColor: '#fff', borderRadius: 16, 
        marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' 
    },
    dateLeft: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginLeft: 10 },
    dateValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    btn: { 
        backgroundColor: '#4F46E5', padding: 20, borderRadius: 20, 
        alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5', 
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 
    },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});