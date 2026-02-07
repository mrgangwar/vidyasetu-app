import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    StatusBar, SafeAreaView, Dimensions, Animated, Vibration
} from 'react-native';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isFocused, setIsFocused] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'error' });

    // Entrance Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, [step]);

    const triggerAlert = (title, message, type = 'error') => {
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    const handleSendOTP = async () => {
        if (!email) {
            Vibration.vibrate(50);
            return triggerAlert("Input Required", "Please enter your registered email address.");
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/send-otp', { email });
            setStep(2);
            triggerAlert("Code Sent", "A secure verification code has been dispatched to your email.", "success");
        } catch (err) {
            Vibration.vibrate(100);
            triggerAlert("Request Failed", err.response?.data?.message || "We could not send the verification code at this time.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!otp || !newPassword) {
            Vibration.vibrate(50);
            return triggerAlert("Incomplete Form", "Please provide both the verification code and your new password.");
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/reset-password', { email, otp, newPassword });
            Vibration.vibrate(100);
            triggerAlert("Success", "Your password has been securely updated. You may now log in.", "success");
            setTimeout(() => {
                setModalVisible(false);
                navigation.navigate('Login');
            }, 2000);
        } catch (err) {
            Vibration.vibrate(100);
            triggerAlert("Verification Error", "The code provided is invalid or has expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            {/* Custom Premium Modal */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalBar, { backgroundColor: modalConfig.type === 'error' ? '#EF4444' : '#10B981' }]} />
                        <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                        <Text style={styles.modalMessage}>{modalConfig.message}</Text>
                        <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalBtnText}>Acknowledge</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Back Navigation */}
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>

                    {/* Branding/Header */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {step === 1 ? "Restore Access" : "Secure Verification"}
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 1 
                                    ? "Provide your professional email to receive a secure authentication code." 
                                    : `We have dispatched a security code to your inbox at ${email}`}
                            </Text>
                        </View>

                        {/* Progress Indicator */}
                        <View style={styles.stepIndicatorContainer}>
                            <View style={[styles.stepLine, styles.stepLineActive]} />
                            <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            {step === 1 ? (
                                <>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput 
                                        style={[styles.input, isFocused === 'email' && styles.inputFocused]} 
                                        placeholder="e.g. user@institution.com" 
                                        placeholderTextColor="#94A3B8"
                                        value={email} 
                                        onChangeText={setEmail}
                                        onFocus={() => setIsFocused('email')}
                                        onBlur={() => setIsFocused(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOTP} disabled={loading}>
                                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Initialize Recovery</Text>}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>Security Code</Text>
                                    <TextInput 
                                        style={[styles.input, isFocused === 'otp' && styles.inputFocused]} 
                                        placeholder="Enter 6-digit OTP" 
                                        placeholderTextColor="#94A3B8"
                                        value={otp} 
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        onFocus={() => setIsFocused('otp')}
                                        onBlur={() => setIsFocused(null)}
                                    />

                                    <Text style={styles.label}>New Password</Text>
                                    <TextInput 
                                        style={[styles.input, isFocused === 'pass' && styles.inputFocused]} 
                                        placeholder="Min. 8 characters" 
                                        placeholderTextColor="#94A3B8"
                                        secureTextEntry 
                                        value={newPassword} 
                                        onChangeText={setNewPassword}
                                        onFocus={() => setIsFocused('pass')}
                                        onBlur={() => setIsFocused(null)}
                                    />

                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
                                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Update Credentials</Text>}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleSendOTP}>
                                        <Text style={styles.secondaryBtnText}>Request New Code</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    container: { flex: 1 },
    scrollContent: { padding: 28, flexGrow: 1 },
    backButton: {
        width: 50, height: 50, borderRadius: 16,
        backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
        marginBottom: 35, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    backButtonText: { fontSize: 26, color: '#0F172A', fontWeight: '400' },
    header: { marginBottom: 35 },
    title: { fontSize: 32, fontWeight: '800', color: '#0F172A', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#64748B', lineHeight: 24, marginTop: 10 },
    stepIndicatorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    stepLine: { height: 6, width: '48%', borderRadius: 10 },
    stepLineActive: { backgroundColor: '#4F46E5' },
    stepLineInactive: { backgroundColor: '#E2E8F0' },
    formCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05, shadowRadius: 20, elevation: 4,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    label: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    input: { 
        backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 18, 
        borderRadius: 18, marginBottom: 22, borderWidth: 1.5, borderColor: '#F1F5F9',
        fontSize: 16, color: '#0F172A' 
    },
    inputFocused: { borderColor: '#4F46E5', backgroundColor: '#FFFFFF' },
    primaryBtn: { 
        backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 20, 
        alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    secondaryBtn: { marginTop: 25, alignItems: 'center' },
    secondaryBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 15 },
    
    // Premium Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalBar: { width: 45, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
    modalMessage: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalBtn: { backgroundColor: '#0F172A', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default ForgotPasswordScreen;