import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-white border-t border-gray-200 pt-12 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 inline-block">
                            {t('navbar.title')}
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                            {t('auth.login.tagline')}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><FaFacebook size={18} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><FaTwitter size={18} /></a>
                            <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><FaInstagram size={18} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors"><FaLinkedin size={18} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">{t('footer.about')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('footer.about')}</Link></li>
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('footer.help')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">{t('footer.terms')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('footer.terms')}</Link></li>
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('footer.privacy')}</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">{t('footer.categories')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('frontpage.categories.watches')}</Link></li>
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('frontpage.categories.art')}</Link></li>
                            <li><Link to="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{t('frontpage.categories.antiques')}</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm">
                        {t('footer.copyright')}
                    </p>
                    <div className="flex gap-6">
                        <Link to="#" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">{t('footer.privacy')}</Link>
                        <Link to="#" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
