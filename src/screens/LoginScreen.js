import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, 
    Dimensions, StatusBar, Animated, Image, Vibration, Modal 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const navigation = useNavigation();
    const [emailOrId, setEmailOrId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(null); 
    
    // Premium Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'error' });

    const { setUser } = useContext(AuthContext);

    // Animation Refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
        ]).start();
    }, []);

    const triggerModal = (title, message, type = 'error') => {
        setModalContent({ title, message, type });
        setModalVisible(true);
    };

    const handleLogin = async () => {
        if (!emailOrId || !password) {
            Vibration.vibrate(40);
            return triggerModal("Required Fields", "Please enter your credentials to access your account.");
        }
        setLoading(true); 
        try {
            const res = await apiClient.post('/auth/login', { emailOrId, password });
            if (res.data.token) {
                await AsyncStorage.setItem('token', res.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
                setUser(res.data.user); 
            }
        } catch (error) {
            Vibration.vibrate(100);
            triggerModal("Access Denied", error.response?.data?.message || "Verification failed. Please check your credentials.");
        } finally {
            setLoading(false); 
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.mainContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />

            {/* --- PREMIUM CUSTOM MODAL --- */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalContent.type === 'error' ? '#EF4444' : '#10B981' }]} />
                        <Text style={styles.modalTitleText}>{modalContent.title}</Text>
                        <Text style={styles.modalSubText}>{modalContent.message}</Text>
                        <TouchableOpacity 
                            style={styles.modalCloseBtn} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View style={[
                    styles.headerSection, 
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
                ]}>
                    <View style={styles.logoBadge}>
                        <Image 
                            source={require('../../assets/logo.png')} 
                            style={styles.actualLogo} 
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.logoText}>VidyaSetu</Text>
                    <Text style={styles.subtitle}>The bridge to your academic excellence</Text>
                </Animated.View>

                {/* Form Card */}
                <Animated.View style={[
                    styles.formCard,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Text style={styles.label}>Identifier</Text>
                    <TextInput
                        style={[styles.input, isFocused === 'email' && styles.inputFocused]}
                        placeholder="Email or Student ID"
                        placeholderTextColor="#94A3B8"
                        value={emailOrId}
                        onChangeText={setEmailOrId}
                        autoCapitalize="none"
                        onFocus={() => setIsFocused('email')}
                        onBlur={() => setIsFocused(null)}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, isFocused === 'password' && styles.inputFocused]}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setIsFocused('password')}
                        onBlur={() => setIsFocused(null)}
                    />

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ForgotPassword')} 
                        style={styles.forgotContainer}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer Attribution */}
                <View style={styles.footer}>
                    <Text style={styles.madeWithText}>Powered by </Text>
                    <Text style={styles.devName}>Nirankar Gangwar</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
    scrollContainer: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        paddingHorizontal: 28, 
        paddingBottom: 40,
        paddingTop: Platform.OS === 'ios' ? 0 : 20 
    },
    headerSection: { alignItems: 'center', marginBottom: 50 },
    logoBadge: {
        width: 100, height: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
    },
    actualLogo: { width: 75, height: 75 },
    logoText: { fontSize: 34, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#64748B', marginTop: 10, textAlign: 'center', lineHeight: 22 },
    formCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, 
        width: '100%', borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 
    },
    label: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 18, borderRadius: 18, marginBottom: 22, borderWidth: 1.5, borderColor: '#F1F5F9', fontSize: 16, color: '#0F172A' },
    inputFocused: { borderColor: '#4F46E5', backgroundColor: '#FFFFFF' },
    forgotContainer: { alignSelf: 'flex-end', marginBottom: 35 },
    forgotText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
    button: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    buttonDisabled: { backgroundColor: '#94A3B8' },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 50, alignItems: 'center' },
    madeWithText: { color: '#94A3B8', fontSize: 14 },
    devName: { color: '#1E293B', fontWeight: '800', fontSize: 14 },

    // Modal Engineering
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 50, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitleText: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
    modalSubText: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalCloseBtn: { backgroundColor: '#0F172A', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalCloseText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default LoginScreen;