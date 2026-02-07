import React, { useState, useEffect } from 'react';
import { 
    View, Text, FlatList, TextInput, Image, 
    StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

export default function MyStudentsScreen({ navigation }) {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Refresh data whenever the teacher returns to this screen
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStudents();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/teacher/my-students');
            
            if (res.data.success) {
                setStudents(res.data.students);
                setFilteredStudents(res.data.students);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            Alert.alert("Connection Error", "Unable to retrieve student data. Please check your network or server configuration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearch(text);
        if (text.trim()) {
            const newData = students.filter(item => {
                const itemData = item.name ? item.name.toUpperCase() : '';
                const textData = text.toUpperCase();
                return itemData.includes(textData);
            });
            setFilteredStudents(newData);
        } else {
            setFilteredStudents(students);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.card}
            onPress={() => navigation.navigate('TeacherStudentProfile', { studentId: item._id })}
        >
            <View style={styles.avatarContainer}>
                <Image 
                    source={item.profilePhoto ? { uri: item.profilePhoto } : { uri: 'https://via.placeholder.com/150' }} 
                    style={styles.avatar} 
                />
                <View style={styles.activeIndicator} />
            </View>

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                    <Ionicons name="finger-print-outline" size={12} color="#94A3B8" />
                    <Text style={styles.subText}>{item.studentLoginId}</Text>
                    <View style={styles.dotSeparator} />
                    <Ionicons name="time-outline" size={12} color="#94A3B8" />
                    <Text style={styles.subText}>{item.batchTime}</Text>
                </View>
                <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={12} color="#6366F1" />
                    <Text style={styles.phoneText}>{item.mobileNumber}</Text>
                </View>
            </View>

            <View style={styles.actionColumn}>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerLabel}>Directory</Text>
                        <Text style={styles.title}>My Students</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{filteredStudents.length} Active</Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchBar}
                        placeholder="Search student by name..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loaderText}>Syncing records...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={60} color="#E2E8F0" />
                                <Text style={styles.empty}>No student records found.</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginTop: 20, 
        marginBottom: 25 
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 4
    },
    title: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
    countBadge: { 
        backgroundColor: '#EEF2FF', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E7FF'
    },
    countText: { fontSize: 13, color: '#6366F1', fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2
    },
    searchIcon: { marginRight: 10 },
    searchBar: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B', fontWeight: '500' },
    listContent: { paddingBottom: 30 },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3 
    },
    avatarContainer: { position: 'relative' },
    avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#F1F5F9' },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    info: { flex: 1, marginLeft: 16 },
    name: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    subText: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '600' },
    dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    phoneText: { fontSize: 13, color: '#6366F1', marginLeft: 6, fontWeight: '700' },
    actionColumn: { paddingLeft: 10 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    empty: { textAlign: 'center', marginTop: 15, color: '#94A3B8', fontSize: 16, fontWeight: '600' }
});