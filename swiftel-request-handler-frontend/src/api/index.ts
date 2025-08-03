import axios from 'axios';
import { Notification } from '../types'; // Assuming Notification type is in ../types

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Notification API Calls ---

export const getNotifications = async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    return data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
    const { data } = await api.put(`/notifications/${notificationId}/read`);
    return data;
};


export default api;