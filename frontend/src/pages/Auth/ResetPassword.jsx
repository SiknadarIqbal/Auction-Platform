import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaUniversity, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { authService } from "../../services/authService";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
    const { t } = useTranslation();
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError(t('auth.signup.passwordMismatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('auth.signup.passwordShortError'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authService.resetPassword(token, password);
            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.message || t('auth.resetPassword.error'));
            }
        } catch (err) {
            setError(err.response?.data?.message || t('auth.resetPassword.invalidToken'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <FaUniversity className="text-3xl text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.resetPassword.title')}</h2>
                    <p className="text-gray-600">
                        {t('auth.resetPassword.subtitle')}
                    </p>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="text-center">
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <h3 className="text-lg font-bold mb-2">{t('auth.resetPassword.successTitle')}</h3>
                            <p>{t('auth.resetPassword.successMessage')}</p>
                            <p className="text-sm mt-2">{t('auth.resetPassword.redirecting')}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('auth.resetPassword.newPassword')}
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.resetPassword.placeholder')}
                                    required
                                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('auth.resetPassword.confirmPassword')}
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('auth.resetPassword.confirmPlaceholder')}
                                    required
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.resetButton')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
