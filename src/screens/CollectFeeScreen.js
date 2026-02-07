import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, TextInput, FlatList, TouchableOpacity, 
    StyleSheet, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, 
    RefreshControl, SafeAreaView, Linking, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client'; 

export default function CollectFeeScreen() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Payment Modal States
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    
    // Custom Success Popup States
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    const fetchStudents = async () => {
        try {
            const res = await apiClient.get('/teacher/my-students');
            if (res.data.success) {
                setStudents(res.data.students || []);
                setFilteredStudents(res.data.students || []);
            }
        } catch (error) {
            Alert.alert("System Error", "Failed to retrieve student records.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStudents();
    }, []);

    const handleSearch = (text) => {
        setSearch(text);
        const filtered = students.filter(s => 
            s.name.toLowerCase().includes(text.toLowerCase()) || 
            s.studentLoginId.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const openPaymentModal = (student) => {
        setSelectedStudent(student);
        setAmount(''); 
        setModalVisible(true);
    };

    const processPayment = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return Alert.alert("Invalid Input", "Please enter a positive numeric value.");
        }

        setIsProcessing(true);
        try {
            const res = await apiClient.post('/teacher/collect-fee', {
                studentId: selectedStudent._id,
                amountPaid: Number(amount)
            });

            if (res.data.success) {
                setPaymentData({
                    amount: amount,
                    studentName: selectedStudent.name,
                    receiptNo: res.data.record.receiptNo,
                    waLink: res.data.whatsappLink
                });
                setModalVisible(false);
                setSuccessModalVisible(true);
                fetchStudents();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Transaction failed.";
            Alert.alert("Payment Error", errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStudent = ({ item }) => (
        <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.card} 
            onPress={() => openPaymentModal(item)}
        >
            <View style={styles.studentLeft}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.subText}>ID: {item.studentLoginId}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.subText}>{item.batchTime}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.feeInfo}>
                <Text style={styles.feeLabel}>MONTHLY</Text>
                <Text style={styles.feeValue}>₹{item.monthlyFees}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerSubtitle}>Finance Manager</Text>
                    <Text style={styles.header}>Collect Fees</Text>
                    <Text style={styles.subHeader}>Select a student to record their payment</Text>
                </View>
                
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color="#94A3B8" />
                    <TextInput 
                        placeholder="Search student by name or ID..." 
                        style={styles.searchBar}
                        value={search}
                        onChangeText={handleSearch}
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Fetching Student Directory</Text>
                    </View>
                ) : (
                    <FlatList 
                        data={filteredStudents}
                        keyExtractor={item => item._id}
                        renderItem={renderStudent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search" size={50} color="#E2E8F0" />
                                <Text style={styles.emptyText}>No matching students found</Text>
                            </View>
                        }
                    />
                )}

                {/* MODAL 1: Amount Collection (Premium Bottom Sheet) */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>PAYMENT ENTRY</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color="#CBD5E1" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.targetStudent}>{selectedStudent?.name}</Text>
                            <Text style={styles.targetId}>Reg ID: {selectedStudent?.studentLoginId}</Text>
                            
                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput 
                                        placeholder="0" 
                                        keyboardType="numeric" 
                                        style={styles.amountInput}
                                        value={amount} 
                                        onChangeText={setAmount} 
                                        autoFocus
                                        placeholderTextColor="#E2E8F0"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                activeOpacity={0.9}
                                style={[styles.payBtn, isProcessing && styles.btnDisabled]} 
                                onPress={processPayment} 
                                disabled={isProcessing}
                            >
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Confirm and Log Payment</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* MODAL 2: Premium Success Popup */}
                <Modal visible={successModalVisible} transparent animationType="fade">
                    <View style={styles.successOverlay}>
                        <View style={styles.successCard}>
                            <View style={styles.successIconWrapper}>
                                <Ionicons name="checkmark-done" size={50} color="#10B981" />
                            </View>
                            
                            <Text style={styles.successTitle}>Transaction Success</Text>
                            <Text style={styles.successDesc}>
                                Logged <Text style={styles.boldText}>₹{paymentData?.amount}</Text> for{"\n"}
                                <Text style={styles.studentHighlight}>{paymentData?.studentName}</Text>
                            </Text>

                            <View style={styles.receiptContainer}>
                                <Text style={styles.receiptLabel}>TRANS. ID</Text>
                                <Text style={styles.receiptText}>{paymentData?.receiptNo}</Text>
                            </View>
                            
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                style={styles.waPremiumBtn} 
                                onPress={() => {
                                    setSuccessModalVisible(false);
                                    if (paymentData?.waLink) Linking.openURL(paymentData.waLink);
                                }}
                            >
                                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                                <Text style={styles.waPremiumBtnText}>Send Digital Receipt</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.doneBtn} 
                                onPress={() => setSuccessModalVisible(false)}
                            >
                                <Text style={styles.doneBtnText}>Close Window</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },
    headerSection: { marginTop: 10, marginBottom: 20 },
    headerSubtitle: { fontSize: 12, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    header: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    subHeader: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },
    searchWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        borderRadius: 18, 
        borderWidth: 1.5, 
        borderColor: '#F1F5F9', 
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2
    },
    searchBar: { flex: 1, paddingVertical: 14, marginLeft: 10, color: '#1E293B', fontSize: 15, fontWeight: '600' },
    listContent: { paddingBottom: 100 },
    card: { 
        backgroundColor: '#fff', 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12
    },
    studentLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#6366F1', fontWeight: '900', fontSize: 22 },
    name: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    subText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
    feeInfo: { alignItems: 'flex-end', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 12 },
    feeLabel: { fontSize: 9, color: '#10B981', fontWeight: '900', letterSpacing: 0.5 },
    feeValue: { fontSize: 18, fontWeight: '900', color: '#059669' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' },

    // Modal Style
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
    modalHandle: { width: 50, height: 6, backgroundColor: '#F1F5F9', borderRadius: 10, marginBottom: 25 },
    modalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 12, fontWeight: '900', color: '#6366F1', letterSpacing: 1.5 },
    targetStudent: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
    targetId: { fontSize: 15, color: '#94A3B8', fontWeight: '600', marginBottom: 30 },
    inputContainer: { width: '100%', alignItems: 'center', marginBottom: 40 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 3, borderColor: '#6366F1', width: '70%', justifyContent: 'center', paddingBottom: 10 },
    currencySymbol: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginRight: 5 },
    amountInput: { fontSize: 48, fontWeight: '900', color: '#1E293B', textAlign: 'center', minWidth: 100 },
    payBtn: { 
        backgroundColor: '#6366F1', 
        width: '100%', 
        padding: 22, 
        borderRadius: 24, 
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8
    },
    btnDisabled: { opacity: 0.6 },
    payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

    // Success Popup
    successOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center' },
    successCard: { width: '88%', backgroundColor: '#fff', borderRadius: 40, padding: 35, alignItems: 'center', shadowOpacity: 0.3 },
    successIconWrapper: { width: 90, height: 90, borderRadius: 30, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
    successDesc: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
    boldText: { fontWeight: '900', color: '#1E293B' },
    studentHighlight: { color: '#6366F1', fontWeight: '800' },
    receiptContainer: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginBottom: 30, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    receiptLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 4, letterSpacing: 1 },
    receiptText: { fontSize: 14, color: '#475569', fontWeight: '700', letterSpacing: 1 },
    waPremiumBtn: { 
        flexDirection: 'row',
        backgroundColor: '#128C7E', 
        width: '100%', 
        padding: 18, 
        borderRadius: 22, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    waPremiumBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 10 },
    doneBtn: { marginTop: 25 },
    doneBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }
});