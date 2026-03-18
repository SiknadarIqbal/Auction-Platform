import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUniversity, FaGavel, FaTrophy, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const [loginError, setLoginError] = useState(null);
    const [resendingEmail, setResendingEmail] = useState(false);
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setVerificationError(null);
        setLoginError(null);

        try {
            const response = await login(email, password);
            if (response.success) {
                navigate('/');
            }
        } catch (error) {
            const errorData = error.response?.data;

            if (errorData?.requiresVerification) {
                setVerificationError({
                    message: errorData.message,
                    email: errorData.email
                });
            } else {
                setLoginError(errorData?.message || t('messages.loginError'));
            }
        }
    };

    const handleResendVerification = async () => {
        setResendingEmail(true);
        setLoginError(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`,
                { email: verificationError.email }
            );

            if (response.data.success) {
                setLoginError(null);
                setVerificationError({
                    ...verificationError,
                    message: t('auth.login.verificationEmailSent')
                });
            }
        } catch (error) {
            setLoginError(error.response?.data?.message || t('auth.login.resendFailed'));
        } finally {
            setResendingEmail(false);
        }
    };

    const features = [
        { icon: <FaGavel />, title: t('auth.login.features.liveBidding'), desc: t('auth.login.features.liveBiddingDesc') },
        { icon: <FaTrophy />, title: t('auth.login.features.rareItems'), desc: t('auth.login.features.rareItemsDesc') },
        { icon: <FaLock />, title: t('auth.login.features.securePayments'), desc: t('auth.login.features.securePaymentsDesc') },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    {/* Logo/Brand */}
                    <div className="mb-16">
                        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                            <FaUniversity className="text-5xl" />
                            {t('navbar.title')}
                        </h1>
                        <p className="text-blue-100 text-lg">
                            {t('auth.login.tagline')}
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-6">{t('auth.login.whyChoose')}</h2>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:translate-x-2"
                            >
                                <div className="text-4xl">{feature.icon}</div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                                    <p className="text-blue-100 text-sm">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                    <div>
                        <p className="text-3xl font-bold">12K+</p>
                        <p className="text-blue-200 text-sm">{t('auth.login.stats.activeUsers')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">8.5K</p>
                        <p className="text-blue-200 text-sm">{t('auth.login.stats.itemsSold')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">99%</p>
                        <p className="text-blue-200 text-sm">{t('auth.login.stats.satisfaction')}</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <FaUniversity className="text-4xl text-blue-600" />
                            {t('navbar.title')}
                        </h1>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.login.title')}</h2>
                            <p className="text-gray-600">{t('auth.login.subtitle')}</p>
                        </div>

                        {/* Login Error Alert */}
                        {loginError && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
                                <div className="flex items-start">
                                    <div className="flex-1">
                                        <p className="text-sm text-red-800 font-medium">
                                            ❌ {loginError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Error Alert */}
                        {verificationError && (
                            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                <div className="flex items-start">
                                    <div className="flex-1">
                                        <p className="text-sm text-yellow-800 font-medium mb-2">
                                            {verificationError.message}
                                        </p>
                                        <button
                                            onClick={handleResendVerification}
                                            disabled={resendingEmail}
                                            className="text-sm text-yellow-700 underline hover:text-yellow-900 font-semibold disabled:opacity-50"
                                        >
                                            {resendingEmail ? t('auth.login.resending') : t('auth.login.resendVerification')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.login.email')}
                                </label>

                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('auth.login.emailPlaceholder')}
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.login.password')}
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('auth.login.passwordPlaceholder')}
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

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">{t('auth.login.rememberMe')}</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    {t('auth.login.forgotPassword')}
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? t('common.loading') : t('auth.login.loginButton')}
                            </button>
                        </form>

                        {/* Sign Up Link */}
                        <p className="text-center mt-6 text-gray-600">
                            {t('auth.login.noAccount')}{" "}
                            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                                {t('auth.login.signupLink')}
                            </Link>
                        </p>
                    </div>

                    {/* Terms */}
                    {/* <p className="text-center text-xs text-gray-500 mt-6">
                        By signing in, you agree to our{" "}
                        <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                        {" "}and{" "}
                        <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </p> */}
                </div>
            </div>

        </div>
    );
};

export default Login;
