import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
    
    baseURL: process.env.EXPO_PUBLIC_API_URL, 
    timeout: 15000, 
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ✅ EXTREME FIX: Force multipart if data is FormData
        // React Native mein Axios kabhi-kabhi auto-detect fail kar deta hai
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error("🌐 NETWORK ERROR: Check if Server IP matches your Laptop IP!");
        }
        return Promise.reject(error);
    }
);

export default apiClient;