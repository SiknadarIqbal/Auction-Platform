import api from './api';

export const userService = {
    // Get notifications
    getNotifications: async () => {
        const response = await api.get('/users/notifications');
        return response.data;
    },

    // Mark notification as read
    markNotificationRead: async (id) => {
        const response = await api.put(`/users/notifications/${id}/read`);
        return response.data;
    },

    // Get user profile
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (formData) => {
        const response = await api.put('/users/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Change password
    changePassword: async (passwordData) => {
        const response = await api.put('/users/change-password', passwordData);
        return response.data;
    },

    // Delete account
    deleteAccount: async () => {
        const response = await api.delete('/users');
        return response.data;
    }
};
