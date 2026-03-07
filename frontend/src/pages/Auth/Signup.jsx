import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUniversity, FaBullseye, FaBell, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheck, FaShoppingBag, FaStore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState("buyer");
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: "", color: "" };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const levels = [
            { strength: 1, label: t('auth.signup.strength.weak'), color: "bg-red-500" },
            { strength: 2, label: t('auth.signup.strength.fair'), color: "bg-orange-500" },
            { strength: 3, label: t('auth.signup.strength.good'), color: "bg-yellow-500" },
            { strength: 4, label: t('auth.signup.strength.strong'), color: "bg-green-500" },
        ];

        return levels.find(l => l.strength === strength) || levels[0];
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        if (!acceptTerms) {
            alert("Please accept the terms and conditions");
            return;
        }

        try {
            const userData = {
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: role
            };

            const response = await register(userData);

            if (response.success) {
                setRegistrationSuccess(true);
                // Clear form
                setFormData({
                    fullName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
                setAcceptTerms(false);
            } else {
                alert(response.message || "Registration failed");
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert(error.message || "An unexpected error occurred during registration");
        }
    };

    const benefits = [
        { icon: <FaBullseye />, title: t('auth.signup.benefitsList.dashboard'), desc: t('auth.signup.benefitsList.dashboardDesc') },
        { icon: <FaBell />, title: t('auth.signup.benefitsList.notifications'), desc: t('auth.signup.benefitsList.notificationsDesc') },
    ];

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Benefits */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    {/* Logo/Brand */}
                    <div className="mb-16">
                        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                            <FaUniversity className="text-5xl" />
                            {t('auth.signup.joinCommunity') || 'Join Our Community'}
                        </h1>
                        <p className="text-purple-100 text-lg">
                            {t('auth.signup.journeyStart') || 'Start your journey to discover rare treasures'}
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-6">{t('auth.signup.benefits') || 'Member Benefits'}</h2>
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:translate-x-2"
                            >
                                <div className="text-4xl">{benefit.icon}</div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                                    <p className="text-purple-100 text-sm">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonial */}
                <div className="relative z-10 bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl text-white">
                            <FaUser />
                        </div>
                        <div>
                            <p className="font-semibold">Auction Platform</p>
                            <p className="text-purple-200 text-sm">Collector since 2025</p>
                        </div>
                    </div>
                    <p className="text-purple-100 italic">
                        "Best auction platform I've used. Won amazing collectibles at great prices!"
                    </p>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <FaUniversity className="text-4xl text-indigo-600" />
                            {t('navbar.title')}
                        </h1>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.signup.title')}</h2>
                        </div>

                        {/* Success Message */}
                        {registrationSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r">
                                <div className="flex items-start">
                                    <div className="flex-1">
                                        <h3 className="text-green-800 font-semibold mb-2">
                                            ✅ {t('auth.signup.successTitle') || 'Registration Successful!'}
                                        </h3>
                                        <p className="text-sm text-green-700 mb-2">
                                            {t('auth.signup.successMessage') || 'Please check your email inbox for a verification link. You must verify your email before you can log in.'}
                                        </p>
                                        <Link
                                            to="/login"
                                            className="text-sm text-green-700 underline hover:text-green-900 font-semibold"
                                        >
                                            {t('auth.signup.goToLogin') || 'Go to Login'} →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Signup Form */}
                        <form onSubmit={handleSignup} className="space-y-4">
                            {/* Full Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.signup.name')}
                                </label>

                                <div className="relative">
                                    <FaUser className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.signup.email')}
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.signup.password')}
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
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
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.signup.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter your password"
                                        required
                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{t('auth.signup.passwordMismatch') || 'Passwords do not match'}</p>
                                )}
                            </div>

                            {/* Role Selection */}
                            {/* Role Selection */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Buyer Checkbox */}
                                <div
                                    className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${role === 'buyer' ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]' : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setRole('buyer')}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${role === 'buyer' ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                                        {role === 'buyer' && <FaCheck className="text-white text-[10px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className="text-sm font-bold text-gray-800 cursor-pointer block truncate">{t('auth.signup.buyer') || 'Buyer'}</label>
                                        <p className="text-[10px] text-gray-500 truncate">Purchase items</p>
                                    </div>
                                    <div className="text-2xl text-indigo-600 shrink-0"><FaShoppingBag /></div>
                                </div>

                                {/* Seller Checkbox */}
                                <div
                                    className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${role === 'seller' ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]' : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setRole('seller')}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${role === 'seller' ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                                        {role === 'seller' && <FaCheck className="text-white text-[10px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className="text-sm font-bold text-gray-800 cursor-pointer block truncate">{t('auth.signup.seller') || 'Seller'}</label>
                                        <p className="text-[10px] text-gray-500 truncate">List auctions</p>
                                    </div>
                                    <div className="text-2xl text-indigo-600 shrink-0"><FaStore /></div>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                                    I agree to the <Link to="/agreement" className="text-blue-600 hover:underline">Terms of Service</Link> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                                </label>
                            </div>                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? t('common.loading') : t('auth.signup.signupButton')}
                            </button>
                        </form>

                        {/* Login Link */}
                        <p className="text-center mt-6 text-gray-600">
                            {t('auth.signup.haveAccount')}{" "}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                                {t('auth.signup.loginLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Signup;
