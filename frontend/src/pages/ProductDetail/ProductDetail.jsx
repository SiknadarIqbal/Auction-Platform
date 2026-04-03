import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { auctionService } from "../../services/auctionService";
import { bidService } from "../../services/bidService";
import { useAuth } from "../../context/AuthContext";
import { joinAuctionRoom, leaveAuctionRoom, getSocket } from "../../services/socketService";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../context/NotificationContext";
import { formatCurrency } from "../../utils/currencyUtils";


const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showInfo, showError, showSuccess, showConfirm } = useNotification();

    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [auctionEnded, setAuctionEnded] = useState(false);
    const [showBidConfirmation, setShowBidConfirmation] = useState(false);
    const [bidAmount, setBidAmount] = useState("");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [bidHistory, setBidHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState("");

    // Listen for network changes
    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initial Data Fetch
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [auctionData, bidsData] = await Promise.all([
                    auctionService.getAuction(id),
                    bidService.getBidHistory(id)
                ]);

                if (auctionData.success) {
                    const data = auctionData.data;
                    setProduct({
                        ...data,
                        currentBid: data.currentHighestBid || data.startingBid || 0,
                        minBid: (data.currentHighestBid || data.startingBid || 0) + (data.minimumBidIncrement || 0),
                        bidAmount: (data.currentHighestBid || data.startingBid || 0) + (data.minimumBidIncrement || 0),
                        bids: data.totalBids || 0,
                        seller: data.sellerId?.name || 'Unknown Seller',
                        isVerifiedSeller: data.sellerId?.isEmailVerified || false,
                        sellerRating: 4.5, // Placeholder
                        timeLeft: 'Loading...' // Handled by a timer or separate logic
                    });
                    // Check if auction ended
                    if (data.status !== 'active') {
                        setAuctionEnded(true);
                    }
                }
                if (bidsData.success) {
                    setBidHistory(bidsData.data);
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setError("Failed to load auction data.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    // Socket.IO Integration
    React.useEffect(() => {
        if (!id) return;

        joinAuctionRoom(id);
        const socket = getSocket();

        const handleBidUpdate = async (data) => {
            setProduct(prev => {
                if (!prev) return prev;
                const newBid = data.currentHighestBid;
                const increment = prev.minimumBidIncrement || 0;
                return {
                    ...prev,
                    currentHighestBid: newBid,
                    currentBid: newBid,
                    minBid: newBid + increment,
                    totalBids: data.totalBids,
                    bids: data.totalBids,
                    highestBidderId: { _id: data.highestBidderId }
                };
            });

            // Fetch latest bid history from backend for real-time accuracy
            try {
                const bidsData = await bidService.getBidHistory(id);
                if (bidsData.success) {
                    setBidHistory(bidsData.data);
                }
            } catch (err) {
                console.error('Bid history refresh failed:', err);
            }
        };

        const handleAuctionEnded = (data) => {
            setAuctionEnded(true);
            setProduct(prev => ({
                ...prev,
                status: 'sold',
                winnerId: data.winnerId,
                finalPrice: data.finalPrice
            }));
        };

        const handleAuctionExtended = (data) => {
            setProduct(prev => ({
                ...prev,
                auctionEndTime: data.newEndTime,
                extensionCount: data.extensionCount
            }));
            showInfo(t('product.auctionExtendedMsg'));
        };

        socket.on('bid_update', handleBidUpdate);
        socket.on('auction_ended', handleAuctionEnded);
        socket.on('auction_extended', handleAuctionExtended);

        return () => {
            leaveAuctionRoom(id);
            socket.off('bid_update', handleBidUpdate);
            socket.off('auction_ended', handleAuctionEnded);
            socket.off('auction_extended', handleAuctionExtended);
        };
    }, [id, showInfo]);

    // Live Countdown Logic
    React.useEffect(() => {
        if (!product || product.status !== 'active') return;

        const calculateTimeLeft = () => {
            const diff = new Date(product.auctionEndTime) - new Date();
            if (diff <= 0) {
                setTimeLeft(t('product.ended'));
                setAuctionEnded(true);
                return false;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours} ${t('time.hoursShort')} ${mins} ${t('time.minutesShort')} ${secs} ${t('time.secondsShort')}`);
            return true;
        };

        // Initial calculation
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(() => {
            const active = calculateTimeLeft();
            if (!active) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [product?.auctionEndTime, product?.status, t]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || t('product.noResults')}</h2>
                    <Link to="/" className="text-blue-600 hover:underline">{t('navbar.title')}</Link>
                </div>
            </div>
        );
    }

    const isHotAuction = (product.totalBids || product.bids) > 10;
    const timeLeftMs = new Date(product.auctionEndTime) - new Date();
    const isEndingSoon = (product.status === 'active') && timeLeftMs > 0 && timeLeftMs < 1000 * 60 * 60; // Less than 1 hour
    const isReserveMet = (product.currentHighestBid || product.currentBid) >= (product.reservePrice || 0);
    const isSeller = user && product && (user._id === product.sellerId?._id || user._id === product.sellerId);



    const handlePlaceBid = async (e) => {
        e.preventDefault();

        if (isOffline) {
            showError(t('product.internetLost'));
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        // Prevent sellers from bidding on their own items
        if (user._id === product.sellerId?._id) {
            showError(t('product.sellerCannotBid'));
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await bidService.placeBid(id, bidAmount);
            if (response.success) {
                setShowBidConfirmation(true);
                setTimeout(() => setShowBidConfirmation(false), 3000);
                setBidAmount("");
            }
        } catch (err) {
            showError(err.response?.data?.message || t('product.bidPlaceFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (isSeller) {
            showError(t('product.cannotBuyOwnProduct'));
            return;
        }

        const confirmed = await showConfirm(t('product.buyNowConfirm', { price: formatCurrency(product.buyNowPrice) }));
        if (confirmed) {
            try {
                const response = await bidService.buyNow(id);
                if (response.success) {
                    setAuctionEnded(true);
                }
            } catch (err) {
                showError(err.response?.data?.message || t('product.buyNowFailed'));
            }
        }
    };

    const handleReport = () => {
        showSuccess(t('product.reportSubmitted'));
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 py-8">
            <div className="container mx-auto px-4 lg:px-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition duration-200"
                >
                    <span className="font-medium">{t('product.backToAuctions')}</span>
                </button>

                {/* Network Status */}
                {isOffline && (
                    <div className="mb-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between">
                        <span className="font-semibold">⚠️ {t('product.internetLost')}</span>
                        <button onClick={() => window.location.reload()} className="bg-white/20 px-3 py-1 rounded hover:bg-white/30">{t('product.retry')}</button>
                    </div>
                )}

                {/* Auction Ended View */}
                {auctionEnded ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-10 text-center animate-slideDown">
                        <div className={`w-20 h-20 ${product.status === 'sold' ? 'bg-green-100' : 'bg-amber-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                            <span className="text-4xl">{product.status === 'sold' ? '🏆' : '⌛'}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('product.auctionEndedTitle')}</h2>
                        <p className="text-gray-500 mb-8">
                            {product.status === 'sold'
                                ? t('product.auctionEndedSubtitle')
                                : t('product.auctionEndedUnsoldSubtitle')}
                        </p>

                        <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <p className="text-sm text-gray-500 mb-1">{t('product.winningBidder')}</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {product.status === 'sold'
                                        ? (() => {
                                            const winner = product.winnerId || product.highestBidderId;
                                            const winnerId = winner?._id || winner;
                                            const currentUserId = user?._id || user;
                                            
                                            if (winnerId && currentUserId && winnerId.toString() === currentUserId.toString()) {
                                                return `${t('product.user')} (${t('product.verified')})`;
                                            }
                                            return winner?.name || t('product.newBidder');
                                        })()
                                        : t('product.noWinner')}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <p className="text-sm text-gray-500 mb-1">
                                    {product.status === 'sold' ? t('product.finalPrice') : t('product.finalBid')}
                                </p>
                                <p className={`text-xl font-bold ${product.status === 'sold' ? 'text-green-600' : 'text-gray-600'}`}>
                                    {formatCurrency(product.finalPrice || product.currentHighestBid || product.currentBid || 0)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link to="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">{t('product.goToDashboard')}</Link>
                            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800 font-medium px-4">{t('product.backToAuctions')}</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Success Message */}
                        {showBidConfirmation && (
                            <div className="mb-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideDown">
                                <span className="text-2xl">✅</span>
                                <span className="font-semibold">{t('product.bidSuccessExtension')}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Side - Product Image */}
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden lg:sticky lg:top-24 h-fit">
                                {/* Status Badges */}
                                <div className="absolute top-4 left-4 flex gap-2 z-10">
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

                                {/* Favorite Button */}
                                {/* <button className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all duration-200 z-10">
                            <span className="text-2xl">🤍</span>
                        </button> */}

                                {/* Product Image Carousel */}
                                <div className="relative h-96 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center overflow-hidden group">
                                    {(() => {
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
                                            <>
                                                {images.length > 0 ? (
                                                    <img
                                                        src={images[currentImageIndex]}
                                                        alt={t('product.imageAlt', { name: product.name, index: currentImageIndex + 1 })}
                                                        className="w-full h-full object-cover transition-opacity duration-300"
                                                        onError={(e) => {
                                                            console.error(`Image failed to load: ${images[currentImageIndex]}`);
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-9xl">{product.image}</div>
                                                )}

                                                {/* Navigation Arrows - Only show if multiple images */}
                                                {hasMultipleImages && (
                                                    <>
                                                        {/* Left Arrow */}
                                                        <button
                                                            onClick={handlePrevImage}
                                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="text-2xl">‹</span>
                                                        </button>

                                                        {/* Right Arrow */}
                                                        <button
                                                            onClick={handleNextImage}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="text-2xl">›</span>
                                                        </button>

                                                        {/* Image Indicator Dots */}
                                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                                            {images.slice(0, 10).map((_, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setCurrentImageIndex(index);
                                                                    }}
                                                                    className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentImageIndex
                                                                        ? 'bg-white w-8'
                                                                        : 'bg-white/50 hover:bg-white/75'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Product Info Summary */}
                                <div className="p-6 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('product.seller')}</p>
                                            <p className="font-semibold text-gray-800 flex items-center gap-1">
                                                <span>👤</span> {product.seller}
                                                {product.isVerifiedSeller && (
                                                    <span className="text-blue-500 text-lg" title={t('product.verifiedSeller')}>🛡️</span>
                                                )}
                                            </p>
                                          
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('product.condition')}</p>
                                            <p className="font-semibold text-gray-800">{t(`dashboard.products.conditions.${product.condition?.toLowerCase().replace(' ', '')}`) || product.condition}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('product.yearMade')}</p>
                                            <p className="font-semibold text-gray-800">{product.yearMade}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('product.location')}</p>
                                            <p className="font-semibold text-gray-800 flex items-center gap-1">
                                                <span>📍</span> {product.location}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('product.contact')}</p>
                                            <p className="font-semibold text-gray-800 flex items-center gap-1 text-blue-600">
                                                <span>📞</span> <a href={`tel:${product.contactNumber}`}>{product.contactNumber}</a>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReport}
                                        className="mt-4 text-xs text-gray-400 hover:text-red-500 underline flex items-center gap-1 transition-colors"
                                    >
                                    </button>
                                </div>
                            </div>

                            {/* Right Side - Product Details & Bidding */}
                            <div className="space-y-6">
                                {/* Product Title & Description */}
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                                        {product.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {(() => {
                                                const catKey = `categories.${product.category}.name`;
                                                const translatedCat = t(catKey);
                                                return translatedCat !== catKey ? translatedCat : product.category;
                                            })()}
                                        </span>
                                        <span className="text-gray-500 text-sm">{t('product.productId')}: #{product.id}</span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>

                                {/* Auction Stats */}
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                            <p className="text-xs text-gray-600 mb-1">{t('product.timeLeft')}</p>
                                            <p className="text-lg font-bold text-gray-800 flex items-center justify-center gap-1">
                                                {timeLeft || t('common.loading')}
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-green-600 font-medium">{t('product.syncWithServer')}</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                            <p className="text-xs text-gray-600 mb-1">{t('product.bids')}</p>
                                            <p className="text-lg font-bold text-gray-800">{product.bids}</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                            <p className="text-xs text-gray-600 mb-1">{t('product.views')}</p>
                                            <p className="text-lg font-bold text-gray-800">{(product.viewCount ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                            <p className="text-xs text-gray-600 mb-1">{t('product.watchers')}</p>
                                            <p className="text-lg font-bold text-gray-800">{(product.watcherCount ?? 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {user && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await auctionService.toggleWatch(id);
                                                    if (res.success && res.data) {
                                                        setProduct(prev => ({
                                                            ...prev,
                                                            watcherCount: res.data.watcherCount ?? prev.watcherCount,
                                                            isWatching: res.data.watching ?? !prev.isWatching
                                                        }));
                                                    }
                                                } catch (e) {
                                                    console.error('Toggle watch failed:', e);
                                                }
                                            }}
                                            className={`mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-all ${product.isWatching ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {product.isWatching ? t('product.unwatch') : t('product.watch')}
                                        </button>
                                    )}
                                </div>

                                {/* Bidding Section */}
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('product.placeYourBid')}</h2>

                                    {/* Current Bid */}
                                    <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-600 mb-1">{t('product.currentBid')}</p>
                                                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
                                                    {formatCurrency(product.currentBid || 0)}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isReserveMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {isReserveMet ? t('product.reserveMet') : t('product.reserveNotMet')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buy Now Option */}
                                    {product.buyNowActive && (
                                        <div className="mb-6">
                                            <button
                                                onClick={handleBuyNow}
                                                disabled={isOffline || isSeller}
                                                className={`w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isSeller ? 'cursor-not-allowed' : ''}`}
                                            >

                                                {t('product.buyNowFor', { price: (product.buyNowPrice || 0).toLocaleString() })}
                                            </button>
                                            <p className="text-xs text-center text-gray-500 mt-2">{t('product.buyNowDesc')}</p>
                                        </div>
                                    )}

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-2 bg-white text-sm text-gray-500">{t('product.orPlaceBid')}</span>
                                        </div>
                                    </div>

                                    {/* Bid Form */}
                                    <form onSubmit={handlePlaceBid} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('product.yourBidAmount')}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-4 text-gray-500 text-lg font-semibold">SAR</span>
                                                <input
                                                    type="number"
                                                    value={bidAmount}
                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                    placeholder={(product.minBid || 0).toLocaleString()}
                                                    min={product.minBid}
                                                    step="100"
                                                    required
                                                    className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-lg text-lg font-semibold focus:outline-none focus:border-blue-500 transition duration-200"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {t('product.minBid')}: {formatCurrency(product.minBid || 0)}
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || isOffline || isSeller}
                                            className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 ${isSubmitting || isSeller ? 'opacity-75 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                                    {t('product.processingBid')}
                                                </>
                                            ) : isSeller ? (
                                                t('product.userRoleSeller')
                                            ) : (
                                                <>
                                                    {t('product.placeBid')} ({t('product.minBidButton')} {formatCurrency(product.minBid || 0)})
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {/* Quick Bid Buttons */}
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setBidAmount(product.minBid.toString())}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition duration-200"
                                        >
                                            {t('product.minBidButton')}
                                        </button>
                                        <button
                                            onClick={() => setBidAmount((product.minBid + 500).toString())}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition duration-200"
                                        >
                                            {t('product.quickBid', { amount: 500 })}
                                        </button>
                                        <button
                                            onClick={() => setBidAmount((product.minBid + 1000).toString())}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition duration-200"
                                        >
                                            {t('product.quickBid', { amount: 1000 })}
                                        </button>
                                    </div>
                                </div>

                                {/* Bid History */}
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">{t('product.bidHistory')}</h2>
                                    <div className="space-y-3">
                                        {bidHistory.map((bid, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{bid.bidderName || bid.bidder?.name || t('product.user')}</p>
                                                        <p className="text-xs text-gray-500">{bid.timestamp ? new Date(bid.timestamp).toLocaleString() : t('product.justNow')}</p>
                                                    </div>
                                                </div>
                                                <p className="text-lg font-bold text-green-600 overflow-hidden whitespace-nowrap text-ellipsis max-w-[10rem]">
                                                    {formatCurrency(bid.bidAmount || bid.amount || 0)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Animation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}} />
        </div >
    );
};

export default ProductDetail;
