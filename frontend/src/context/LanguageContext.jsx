import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();

    useEffect(() => {
        // Set document direction based on language
        const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    const value = {
        currentLanguage: i18n.language,
        changeLanguage,
        isRTL: i18n.language === 'ar'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
