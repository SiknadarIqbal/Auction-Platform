import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/currencyUtils";

const ProductCard = ({ product }) => {
    const { t } = useTranslation();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState("");
    const [isEnded, setIsEnded] = useState(false);

    const isHotAuction = product.bids > 30;

    // Live Countdown Logic
    React.useEffect(() => {
        if (!product || product.status !== 'active') {
            if (product.status !== 'active') setTimeLeft(t(`dashboard.status.${product.status}`).toUpperCase());
            return;
        }

        const calculateTimeLeft = () => {
            const diff = new Date(product.auctionEndTime) - new Date();
            if (diff <= 0) {
                setTimeLeft(t('product.ended'));
                setIsEnded(true);
                return false;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeLeft(`${days} ${t('time.daysShort')} ${hours % 24} ${t('time.hoursShort')}`);
            } else {
                setTimeLeft(`${hours} ${t('time.hoursShort')} ${mins} ${t('time.minutesShort')} ${secs} ${t('time.secondsShort')}`);
            }
            return true;
        };

        calculateTimeLeft();
        const timer = setInterval(() => {
            const active = calculateTimeLeft();
            if (!active) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [product?.auctionEndTime, product?.status, t]);

    const timeLeftMs = new Date(product.auctionEndTime) - new Date();
    const isEndingSoon = (product.status === 'active') && timeLeftMs > 0 && timeLeftMs < 1000 * 60 * 60; // Less than 1 hour

    // Handle multiple images - support up to 10 images
    const images = product.images || (product.imageUrl ? [product.imageUrl] : []);
    const hasMultipleImages = images.length > 1;

    const handlePrevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
            {/* Image Section with Gradient Overlay */}
            <div className="relative h-56 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                    {isHotAuction && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            🔥 {t('product.hot')}
                        </span>
                    )}
                    {isEndingSoon && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            ⏰ {t('product.endingSoon')}
                        </span>
                    )}
                </div>

                {/* Product Image Carousel */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {images.length > 0 ? (
                        <img
                            src={images[currentImageIndex]}
                            alt={t('product.imageAlt', { name: product.name, index: currentImageIndex + 1 })}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => {
                                // Fallback to a generic placeholder image if the source fails (e.g., old Cloudinary demo URLs)
                                e.target.onerror = null;
                                e.target.src = `https://via.placeholder.com/600x400?text=${t('product.noImage')}`;
                            }}
                        />
                    ) : (
                        <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">
                            {product.image || "🏆"}
                        </div>
                    )}
                </div>

                {/* Navigation Arrows - Only show if multiple images */}
                {hasMultipleImages && (
                    <>
                        {/* Left Arrow */}
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                        >
                            <span className="text-lg">‹</span>
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                        >
                            <span className="text-lg">›</span>
                        </button>

                        {/* Image Indicator Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                            {images.slice(0, 10).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentImageIndex
                                        ? 'bg-white w-6'
                                        : 'bg-white/50 hover:bg-white/75'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
                    {product.name}
                </h3>

                {/* Description */}
                {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}

                {/* Time Left & Bids Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-xs text-gray-500">{t('product.timeLeft')}</p>
                            <p className={`text-sm font-bold ${isEndingSoon ? 'text-orange-600' : 'text-gray-800'}`}>{timeLeft || t('common.available')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-xs text-gray-500">{t('product.bids')}</p>
                            <p className="text-sm font-bold text-gray-800">{product.bids || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-2">
                        <div className="min-w-0 max-w-[10rem]">
                            <p className="text-xs text-gray-500 mb-1">{t('product.currentBid')}</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent overflow-hidden whitespace-nowrap text-ellipsis">
                                {formatCurrency(product.currentBid)}
                            </p>
                        </div>
                        {product.minBid && (
                            <div className="text-right min-w-0 max-w-[8rem]">
                                <p className="text-xs text-gray-500 mb-1">{t('product.minNextBid')}</p>
                                <p className="text-sm font-semibold text-gray-700 overflow-hidden whitespace-nowrap text-ellipsis">
                                    {formatCurrency(product.minBid)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    to={`/product/${product.id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    {t('product.placeBid')}
                </Link>

                {/* Quick Info - dynamic views & watchers */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            {(product.viewCount ?? product.views ?? 0).toLocaleString()} {t('product.views')}
                        </span>
                        <span className="flex items-center gap-1">
                            {(product.watcherCount ?? product.watchers ?? 0).toLocaleString()} {t('product.watchers')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
