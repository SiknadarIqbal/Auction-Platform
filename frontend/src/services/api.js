import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
                    { refreshToken }
                );

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Clear tokens but don't redirect - let the component handle it
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const categoryAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`)
};

export default api;
