import api from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });

        if (response.data.success && response.data.data) {
            const { accessToken, refreshToken, user } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        }

        return response.data;
    },

    async register(userData) {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    async forgotPassword(email) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(token, newPassword) {
        const response = await api.post('/auth/reset-password', { token, newPassword });
        return response.data;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};
