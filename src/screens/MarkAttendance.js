import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, Alert, SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MarkAttendance = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const studentRes = await apiClient.get('/teacher/my-students');
            const studentList = studentRes.data.students || [];
            setStudents(studentList);

            try {
                const attendanceRes = await apiClient.get('/teacher/today-attendance');
                const markedData = attendanceRes.data.attendance || [];
                
                let finalStatus = {};
                studentList.forEach(std => { finalStatus[std._id] = 'Present'; });
                
                markedData.forEach(record => { 
                    const sId = record.studentId._id || record.studentId;
                    finalStatus[sId] = record.status; 
                });
                setAttendance(finalStatus);
            } catch (attendanceErr) {
                let defaultStatus = {};
                studentList.forEach(std => { defaultStatus[std._id] = 'Present'; });
                setAttendance(defaultStatus);
            }
        } catch (err) {
            Alert.alert("System Error", "Failed to load student registry. Please verify connection.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (id, status) => {
        setAttendance(prev => ({ ...prev, [id]: status }));
    };

    const submitAttendance = async () => {
        setSubmitting(true);
        try {
            const attendanceData = Object.keys(attendance).map(id => ({
                studentId: id,
                status: attendance[id]
            }));

            const res = await apiClient.post('/teacher/mark-attendance', { attendanceData });
            
            if(res.data.success) {
                Alert.alert(
                    "Success", 
                    "Attendance records have been synchronized and parents notified."
                );
            }
        } catch (err) {
            Alert.alert("Sync Error", err.response?.data?.message || "Internal Server Error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loaderText}>Accessing Student Registry</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Premium Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>Class Management</Text>
                    <Text style={styles.title}>Mark Attendance</Text>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#6366F1" />
                        <Text style={styles.dateText}>
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
                <View style={styles.statsBadge}>
                    <Text style={styles.statsText}>{students.length} Students</Text>
                </View>
            </View>

            {/* Student Registry */}
            <FlatList
                data={students}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.studentCard}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                        </View>
                        
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.studentId}>{item.studentLoginId} • {item.batchTime || 'General'}</Text>
                        </View>
                        
                        <View style={styles.controlRow}>
                            <TouchableOpacity 
                                activeOpacity={0.7}
                                onPress={() => toggleStatus(item._id, 'Present')}
                                style={[styles.statusToggle, attendance[item._id] === 'Present' ? styles.pActive : styles.inactiveBtn]}
                            >
                                <Text style={[styles.statusLabel, attendance[item._id] === 'Present' && styles.labelActive]}>P</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                activeOpacity={0.7}
                                onPress={() => toggleStatus(item._id, 'Absent')}
                                style={[styles.statusToggle, attendance[item._id] === 'Absent' ? styles.aActive : styles.inactiveBtn]}
                            >
                                <Text style={[styles.statusLabel, attendance[item._id] === 'Absent' && styles.labelActive]}>A</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Floating Action Footer */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.primaryBtn, submitting && styles.btnDisabled]} 
                    onPress={submitAttendance} 
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.btnContent}>
                            <Ionicons name="cloud-done-outline" size={22} color="#FFFFFF" style={styles.btnIcon} />
                            <Text style={styles.primaryBtnText}>Confirm and Sync</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC' 
    },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
    loaderText: { 
        marginTop: 15, 
        color: '#64748B', 
        fontWeight: '600',
        letterSpacing: 0.5
    },
    header: { 
        paddingHorizontal: 25,
        paddingTop: 20,
        paddingBottom: 25,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 4
    },
    title: { 
        fontSize: 26, 
        fontWeight: '900', 
        color: '#1E293B' 
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6
    },
    dateText: { 
        color: '#64748B', 
        fontSize: 14, 
        fontWeight: '600',
        marginLeft: 5 
    },
    statsBadge: { 
        backgroundColor: '#EEF2FF', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 14 
    },
    statsText: { 
        color: '#4F46E5', 
        fontWeight: '800', 
        fontSize: 12 
    },
    listContainer: { 
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 130 
    },
    studentCard: { 
        backgroundColor: '#FFFFFF', 
        padding: 16, 
        borderRadius: 24, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 3
    },
    avatarContainer: { 
        width: 52, 
        height: 52, 
        borderRadius: 18, 
        backgroundColor: '#F1F5F9', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15 
    },
    avatarText: { 
        fontSize: 20, 
        fontWeight: '900', 
        color: '#4F46E5' 
    },
    studentInfo: { 
        flex: 1 
    },
    studentName: { 
        fontSize: 17, 
        fontWeight: '800', 
        color: '#334155',
        letterSpacing: -0.5 
    },
    studentId: { 
        fontSize: 13, 
        color: '#94A3B8', 
        marginTop: 3,
        fontWeight: '500'
    },
    controlRow: { 
        flexDirection: 'row' 
    },
    statusToggle: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginLeft: 10 
    },
    pActive: { 
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    aActive: { 
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    inactiveBtn: { 
        backgroundColor: '#F8FAFC', 
        borderWidth: 1.5, 
        borderColor: '#E2E8F0' 
    },
    statusLabel: { 
        color: '#94A3B8', 
        fontWeight: '900', 
        fontSize: 16 
    },
    labelActive: { 
        color: '#FFFFFF' 
    },
    footer: { 
        position: 'absolute', 
        bottom: 0, 
        width: width,
        padding: 25, 
        backgroundColor: 'transparent'
    },
    primaryBtn: { 
        backgroundColor: '#4F46E5', 
        paddingVertical: 18, 
        borderRadius: 24, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10
    },
    btnDisabled: { 
        opacity: 0.7 
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    btnIcon: {
        marginRight: 12
    },
    primaryBtnText: { 
        color: '#FFFFFF', 
        fontWeight: '800', 
        fontSize: 17,
        letterSpacing: 0.5
    }
});

export default MarkAttendance;