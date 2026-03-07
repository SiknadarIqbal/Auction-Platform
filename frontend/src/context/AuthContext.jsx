import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await authService.login(email, password);

            if (response.success) {
                setUser(response.data.user);
                return response;
            } else {
                // If backend returns success: false, throw error
                const error = new Error(response.message || 'Login failed');
                error.response = { data: response };
                throw error;
            }
        } catch (error) {
            // Re-throw error to be caught by Login component
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            const response = await authService.register(userData);
            return response;
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
