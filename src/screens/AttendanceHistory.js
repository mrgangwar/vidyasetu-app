import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, Alert, SafeAreaView, Dimensions, Platform
} from 'react-native';
import apiClient from '../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const AttendanceHistory = () => {
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [records, setRecords] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Fetch History logic using the 'attendance' key from controller
    const fetchHistory = async (selectedDate) => {
        setLoading(true);
        try {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            const res = await apiClient.get(`/teacher/attendance-history?date=${formattedDate}`);
            
            if (res.data.success) {
                // Logic preserved: using 'attendance' key as per backend controller
                setRecords(res.data.attendance || []);
            }
        } catch (err) {
            // Simplified English-only professional alert
            Alert.alert("System Error", "Failed to retrieve attendance records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(date);
    }, []);

    const onDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            fetchHistory(selectedDate);
        }
    };

    // UI helper for status styling
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Present': return { bg: styles.presentBg, text: '#16A34A' };
            case 'Absent': return { bg: styles.absentBg, text: '#DC2626' };
            case 'Late': return { bg: styles.lateBg, text: '#D97706' };
            case 'Holiday': return { bg: styles.holidayBg, text: '#2563EB' };
            default: return { bg: styles.defaultBg, text: '#475569' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>Attendance History</Text>
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        style={styles.dateSelector} 
                        onPress={() => setShowPicker(true)}
                    >
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Selected View</Text>
                            <Text style={styles.dateValue}>
                                {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.calendarIconPlaceholder} />
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker 
                        value={date} 
                        mode="date" 
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={onDateChange} 
                    />
                )}

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : (
                    <FlatList
                        data={records}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No records found for this date.</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const statusStyle = getStatusStyle(item.status);
                            return (
                                <View style={styles.card}>
                                    <View style={styles.studentDetails}>
                                        <Text style={styles.studentName} numberOfLines={1}>
                                            {item.studentId?.name || 'User Record'}
                                        </Text>
                                        <Text style={styles.metaData}>
                                            ID: {item.studentId?.studentLoginId || 'N/A'} • {item.studentId?.batchTime || 'General'}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, statusStyle.bg]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFFFFF' 
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: { 
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    title: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: '#1E293B', 
        marginBottom: 20,
        letterSpacing: -0.5
    },
    dateSelector: { 
        backgroundColor: '#4F46E5', 
        padding: 18, 
        borderRadius: 20, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5
    },
    dateInfo: {
        flex: 1
    },
    dateLabel: { 
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: 12, 
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    dateValue: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#FFFFFF',
        marginTop: 2
    },
    calendarIconPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12
    },
    listContainer: { 
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40 
    },
    card: { 
        backgroundColor: '#FFFFFF', 
        padding: 18, 
        borderRadius: 22, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2
    },
    studentDetails: {
        flex: 1,
        marginRight: 12
    },
    studentName: { 
        fontSize: 17, 
        fontWeight: '700', 
        color: '#334155',
        letterSpacing: -0.3
    },
    metaData: { 
        fontSize: 13, 
        color: '#94A3B8', 
        marginTop: 4,
        fontWeight: '500'
    },
    statusBadge: { 
        paddingHorizontal: 14, 
        paddingVertical: 8, 
        borderRadius: 12,
        minWidth: 85,
        alignItems: 'center'
    },
    statusText: { 
        fontWeight: '800', 
        fontSize: 11, 
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    presentBg: { backgroundColor: '#F0FDF4' },
    absentBg: { backgroundColor: '#FEF2F2' },
    lateBg: { backgroundColor: '#FFFBEB' },
    holidayBg: { backgroundColor: '#EFF6FF' },
    defaultBg: { backgroundColor: '#F8FAFC' },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: width * 0.3
    },
    emptyText: { 
        textAlign: 'center', 
        color: '#94A3B8', 
        fontSize: 16,
        fontWeight: '500'
    }
});

export default AttendanceHistory;