import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaHandshake, FaUserCheck, FaArrowRight, FaGlobe } from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

const Agreement = ({ onAccept }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [agreed, setAgreed] = useState(false);
    const { changeLanguage, isRTL } = useLanguage();
    const isRtl = isRTL;

    const handleAgree = () => {
        localStorage.setItem("hasAgreed", "true");
        if (onAccept) onAccept();
        const nextPath = location.state?.from?.pathname || "/login";
        navigate(nextPath, { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fadeIn">
                {/* Left Side - Visual */}
                <div className="md:w-1/3 bg-blue-600 p-12 md:p-8 text-white flex flex-col justify-center items-center text-center relative overflow-visible min-h-[200px] md:min-h-0">
                    {/* Language Toggle - Premium Switch */}
                    <div className="absolute top-5 right-5 z-[100]">
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-full p-1 flex items-center shadow-2xl scale-90 md:scale-100 transition-transform">
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 uppercase ${!isRtl
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => changeLanguage('ar')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 uppercase ${isRtl
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                AR
                            </button>
                        </div>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-black mb-4 tracking-tight leading-tight">{t('agreement.title')}</h2>
                    <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-[240px]">
                        {t('agreement.subtitle')}
                    </p>
                </div>

                {/* Right Side - Terms */}
                <div className="md:w-2/3 p-6 md:p-12 flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar mb-8 pr-2">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <FaHandshake className="text-blue-600 shrink-0" />
                                <span className="leading-tight">{t('agreement.articles.intro.title')}</span>
                            </h1>

                            <p className="text-gray-700 font-medium leading-relaxed mb-6 border-b pb-4">
                                {t('agreement.articles.intro.content')}
                            </p>

                            <div className="space-y-4">
                                {Object.entries(t('agreement.articles', { returnObjects: true })).map(([key, article], index) => {
                                    if (key === 'intro') return null;
                                    return (
                                        <div key={key} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                                                <span className="shrink-0 min-w-[32px] h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                    {index}
                                                </span>
                                                <span className="leading-tight">{article.title}</span>
                                            </h3>
                                            {article.content && (
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {article.content}
                                                </p>
                                            )}
                                            {article.items && (
                                                <ul className="space-y-2">
                                                    {article.items.map((item, idx) => (
                                                        <li key={idx} className="text-gray-600 text-sm flex gap-2">
                                                            <span className="text-blue-400 mt-1 shrink-0">•</span>
                                                            <span className="leading-relaxed">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 p-3 md:p-4 mb-4 border-2 border-transparent hover:border-blue-100 rounded-2xl cursor-pointer transition-all duration-200 group bg-gray-50 md:bg-transparent">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition duration-200 shrink-0"
                            />
                            <span className="text-sm md:text-base text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                                {t('agreement.iAgree')}
                            </span>
                        </label>

                        <button
                            onClick={handleAgree}
                            disabled={!agreed}
                            className={`w-full py-3.5 md:py-4 px-4 rounded-2xl font-bold text-base md:text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${agreed
                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/25 transform hover:-translate-y-1"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <FaUserCheck className="shrink-0" />
                            <span className="truncate">{t('agreement.proceed')}</span>
                            {!isRtl && <FaArrowRight className="text-sm mt-0.5 shrink-0" />}
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}} />
        </div>
    );
};

export default Agreement;
