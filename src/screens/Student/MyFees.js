import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, 
    ActivityIndicator, RefreshControl, Dimensions, SafeAreaView, StatusBar, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MyFees = () => {
    const [feesData, setFeesData] = useState({ history: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFeeRecords = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setFeesData({
                    history: res.data.data.feeHistory || [],
                    stats: res.data.data.stats || {}
                });
            }
        } catch (err) {
            console.log("Fee Screen Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFeeRecords();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchFeeRecords();
    };

    // Calculation for visual progress indicator
    const total = (feesData.stats.totalPaid || 0) + (feesData.stats.totalDue || 0);
    const progress = total > 0 ? (feesData.stats.totalPaid / total) : 0;

    const renderFeeItem = ({ item }) => (
        <View style={styles.feeCard}>
            <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="checkmark-shield" size={20} color="#10B981" />
                </View>
                <View>
                    <Text style={styles.payMethod}>{item.paymentMethod || 'Tuition Fee'}</Text>
                    <Text style={styles.payDate}>
                        {new Date(item.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
            </View>
            <View style={styles.cardRight}>
                <Text style={styles.amountText}>₹{item.amountPaid.toLocaleString('en-IN')}</Text>
                <View style={styles.receiptBadge}>
                    <Text style={styles.receiptNo}>REF: {item.receiptNumber || 'N/A'}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loaderText}>Syncing Ledger Records...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            {/* 💳 PREMIUM FINANCIAL DASHBOARD */}
            <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardTitle}>Fee Statement</Text>
                        <Text style={styles.cardSub}>Academic Session 2025-26</Text>
                    </View>
                    <View style={styles.headerIconBg}>
                        <Ionicons name="wallet" size={22} color="#fff" />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Paid</Text>
                        <Text style={styles.statValue}>₹{(feesData.stats.totalPaid || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Balance Due</Text>
                        <Text style={[styles.statValue, { color: '#FDA4AF' }]}>₹{(feesData.stats.totalDue || 0).toLocaleString('en-IN')}</Text>
                    </View>
                </View>

                {/* 📊 PROGRESS ANALYTICS */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>Settlement Progress</Text>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>
            </View>

            <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <TouchableOpacity activeOpacity={0.7}>
                    <Ionicons name="filter-outline" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={feesData.history}
                keyExtractor={(item) => item._id}
                renderItem={renderFeeItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>No Records Found</Text>
                        <Text style={styles.emptyText}>Your verified payment receipts will appear here automatically.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loaderText: { marginTop: 14, color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    
    // 💳 Premium Main Card
    mainCard: { 
        backgroundColor: '#4338CA', 
        margin: 20, 
        borderRadius: 32, 
        padding: 24, 
        elevation: 12,
        shadowColor: '#4338CA',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    cardSub: { color: '#C7D2FE', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    headerIconBg: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 14 },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { flex: 1 },
    statLabel: { color: '#C7D2FE', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 6 },
    statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 15 },

    progressContainer: { marginTop: 28 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', opacity: 0.85 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 10 },

    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 18, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    feeCard: { 
        backgroundColor: '#FFFFFF', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 18, 
        borderRadius: 24, 
        marginBottom: 14, 
        alignItems: 'center', 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    payMethod: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    payDate: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
    
    cardRight: { alignItems: 'flex-end' },
    amountText: { fontSize: 17, fontWeight: '900', color: '#10B981' },
    receiptBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#F1F5F9' },
    receiptNo: { fontSize: 9, color: '#64748B', fontWeight: '800', letterSpacing: 0.5 },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 50 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '500' }
});

export default MyFees;