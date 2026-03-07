import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState(t('auth.verifyEmail.verifying'));

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage(t('auth.verifyEmail.invalidLink'));
                return;
            }

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-email`,
                    { token }
                );

                if (response.data.success) {
                    setStatus('success');
                    setMessage(t('auth.verifyEmail.success'));
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(response.data.message || t('auth.verifyEmail.failed'));
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || t('auth.verifyEmail.expired'));
            }
        };

        verifyEmail();
    }, [searchParams, navigate, t]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <FaSpinner className="text-6xl text-indigo-600 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.verifyEmail.title')}</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.verifyEmail.verifiedTitle')}</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.verifyEmail.failed')}</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-semibold transition-all"
                        >
                            {t('auth.verifyEmail.backToLogin')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
