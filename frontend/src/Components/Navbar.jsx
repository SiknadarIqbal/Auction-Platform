import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUniversity, FaSearch, FaBell, FaChartPie, FaBars, FaTimes, FaLock, FaUserPlus, FaUser, FaSignOutAlt, FaGlobe, FaCog } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import { userService } from "../services/userService";

const Navbar = () => {
    const { user, logout } = useAuth();
    const { showSuccess } = useNotification();
    const { t } = useTranslation();
    const { currentLanguage, changeLanguage, isRTL } = useLanguage();
    const isRtl = isRTL;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Search bar removed from navbar; keep state out to avoid unused warnings
    const location = useLocation();
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setNotificationCount(0);
            return;
        }
        userService.getNotifications()
            .then((data) => setNotificationCount(data.unreadCount ?? 0))
            .catch(() => setNotificationCount(0));
    }, [user]);

    // Handle logout with notification
    const handleLogout = async () => {
        await logout();
        showSuccess(t('navbar.logoutSuccess'));
    };

    return (
        <nav className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-lg border-b border-slate-700">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 group"
                    >
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-all duration-300 group-hover:scale-110 shadow-lg">
                            <FaUniversity className="text-xl lg:text-2xl" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl lg:text-2xl font-bold text-white">
                                {t('navbar.title')}
                            </h1>
                            <p className="text-xs text-slate-400 -mt-1">{t('navbar.subtitle')}</p>
                        </div>
                    </Link>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 lg:gap-4">
                        {/* Search Bar removed from navbar */}

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                className="flex w-10 h-10 bg-slate-700/80 rounded-lg items-center justify-center hover:bg-slate-600 transition-all duration-300 hover:scale-110 shadow-md border border-slate-600/50"
                                title={t('navbar.changeLanguage')}
                            >
                                <FaGlobe className="text-lg text-blue-400" />
                            </button>

                            {/* Language Dropdown */}
                            {isLanguageOpen && (
                                <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-4 w-40 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn z-[60]`}>
                                    <button
                                        onClick={() => {
                                            changeLanguage('en');
                                            setIsLanguageOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${currentLanguage === 'en' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                                            }`}
                                    >
                                        <span className="text-xl">🇬🇧</span> {t('common.english')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            changeLanguage('ar');
                                            setIsLanguageOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100 flex items-center gap-3 ${currentLanguage === 'ar' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                                            }`}
                                    >
                                        <span className="text-xl">🇸🇦</span> {t('common.arabic')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Notifications - badge with count, click goes to dashboard notifications */}
                        <Link
                            to="/dashboard?tab=notification"
                            className="hidden md:flex relative w-10 h-10 bg-slate-700 rounded-lg items-center justify-center hover:bg-slate-600 transition-all duration-300 hover:scale-110 shadow-md"
                            title={t('navbar.notifications')}
                        >
                            <FaBell className="text-lg" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
                        </Link>

                        {/* Dashboard Button */}
                        <Link
                            to="/dashboard"
                            className="hidden md:flex w-10 h-10 bg-slate-700 rounded-lg items-center justify-center hover:bg-slate-600 transition-all duration-300 hover:scale-110 shadow-md"
                            title={t('navbar.dashboard')}
                        >
                            <FaChartPie className="text-lg" />
                        </Link>

                        {/* User Menu - Desktop */}
                        <div className="hidden lg:flex items-center gap-3">
                            {user ? (
                                <>
                                    <Link to="/dashboard?tab=settings" className="flex items-center gap-3 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-600 group-hover:border-blue-400 transition-all duration-200">
                                                {user.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
                                            </div>
                                            <span className="text-white font-medium hidden xl:block group-hover:text-blue-300 transition-colors duration-200">
                                                {user.name}
                                            </span>
                                        </div>
                                    </Link>

                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-5 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-all duration-300"
                                    >
                                        {t('navbar.login')}
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        {t('navbar.signup')}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-all duration-300"
                        >
                            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-slate-700 animate-slideDown">
                        {/* Mobile Auth Buttons */}
                        <div className="space-y-2 mb-4">
                            <Link
                                to="/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-all duration-300"
                            >
                                <FaChartPie />
                                {t('navbar.dashboard')}
                            </Link>

                            {user ? (
                                <div className="space-y-2">
                                    <Link to="/dashboard?tab=settings" className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-700/50 rounded-lg backdrop-blur-sm border border-slate-600 hover:bg-slate-700 transition-all duration-200" onClick={() => setIsMenuOpen(false)}>
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {user.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
                                        </div>
                                        <span className="font-semibold text-white">{user.name}</span>
                                        <FaCog className="text-slate-400 ml-auto" />
                                    </Link>

                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-all duration-300"
                                    >
                                        <FaLock />
                                        {t('navbar.login')}
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg"
                                    >
                                        <FaUserPlus />
                                        {t('navbar.signup')}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Notifications */}
                        <div className="pt-4 border-t border-slate-700 space-y-2">
                            <button
                                onClick={() => {
                                    changeLanguage(isRtl ? 'en' : 'ar');
                                    setIsMenuOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30"
                            >
                                <div className="flex items-center gap-3">
                                    <FaGlobe className={`${isRtl ? 'rotate-180' : ''} transition-transform duration-500`} />
                                    <span className="font-bold uppercase tracking-wider text-xs">
                                        {isRtl ? t('common.switchToEnglish') : t('common.switchToArabic')}
                                    </span>
                                </div>
                                <span className="text-xl">{isRtl ? '🇬🇧' : '🇸🇦'}</span>
                            </button>

                            <Link
                                to="/dashboard?tab=notification"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-slate-700 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3">
                                    <FaBell className="text-xl text-slate-400" />
                                    <span className="font-medium">{t('navbar.notifications')}</span>
                                </div>
                                {notificationCount > 0 ? (
                                    <span className="min-w-[1.5rem] h-6 px-1.5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                                        {notificationCount > 99 ? '99+' : notificationCount}
                                    </span>
                                ) : null}
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Add custom animations */}
            {/* Add custom animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}} />
        </nav>
    );
};

export default Navbar;
