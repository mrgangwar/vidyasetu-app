// MyTeachers.js (Student folder ke andar)
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import apiClient from '../../api/client'; // Path check kar lena

const MyTeachers = ({ navigation }) => {
    const [teachers, setTeachers] = useState([]);

    const fetchTeachers = async () => {
        try {
            const res = await apiClient.get('/student/my-teachers');
            if (res.data.success) setTeachers(res.data.teachers);
        } catch (err) { console.log(err); }
    };

    useEffect(() => { fetchTeachers(); }, []);

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <FlatList
                data={teachers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={{ padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                        // 🟢 YAHAN SE TeacherDetails FILE ACCESS HOTI HAI
                        onPress={() => navigation.navigate('TeacherDetails', { teacher: item })}
                    >
                        <Image source={{ uri: item.profilePhoto }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                            <Text>{item.subject}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default MyTeachers;