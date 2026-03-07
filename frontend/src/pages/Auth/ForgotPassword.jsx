import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUniversity, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { authService } from "../../services/authService";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await authService.forgotPassword(email);
            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || t('auth.forgotPassword.error'));
            }
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
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
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.forgotPassword.title')}</h2>
                    <p className="text-gray-600">
                        {t('auth.forgotPassword.instructions')}
                    </p>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="text-center">
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <p className="font-semibold">{t('auth.forgotPassword.successTitle')}</p>
                            <p className="text-sm mt-1">
                                {t('auth.forgotPassword.successMessage')}
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                        >
                            <FaArrowLeft /> {t('auth.forgotPassword.backToLogin')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('auth.forgotPassword.email')}
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.forgotPassword.placeholder')}
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
                            {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.resetButton')}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                <FaArrowLeft /> {t('auth.forgotPassword.backToLogin')}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
