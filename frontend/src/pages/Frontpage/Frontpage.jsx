import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import { auctionService } from "../../services/auctionService";

const Frontpage = () => {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [statsData, setStatsData] = useState({
        activeAuctions: 0,
        totalBids: 0,
        itemsSold: 0,
        activeBidders: 0
    });

    useEffect(() => {
        fetchAuctions();
        fetchStats();
    }, [activeCategory, searchQuery]);

    const fetchStats = async () => {
        try {
            const response = await auctionService.getHomepageStats();
            if (response.success) {
                setStatsData(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const params = {
                status: 'active',
                category: activeCategory !== 'all' ? activeCategory : undefined,
                search: searchQuery || undefined,
                _t: Date.now() // avoid cached response so list matches current DB
            };
            const response = await auctionService.getAllAuctions(params);
            if (response.success) {
                setProducts(response.data.auctions || []);
            }
        } catch (err) {
            console.error("Failed to fetch auctions:", err);
            setError(t('product.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: "all", name: t('frontpage.categories.allItems'), icon: "🔍" },
        { id: "watches", name: t('categories.watches.name'), icon: "⌚" },
        { id: "art", name: t('categories.art.name'), icon: "🎨" },
        { id: "antiques", name: t('categories.antiques.name'), icon: "🏺" },
        { id: "collectibles", name: t('categories.collectibles.name'), icon: "🪙" },
        { id: "furniture", name: t('categories.furniture.name'), icon: "🛋️" },
        { id: "luxury", name: t('categories.luxury.name'), icon: "👜" },
    ];

    const stats = [
        { label: t('frontpage.stats.activeAuctions'), value: statsData.activeAuctions.toLocaleString() },
        { label: t('frontpage.stats.totalBids'), value: statsData.totalBids.toLocaleString() },
        { label: t('frontpage.stats.itemsSold'), value: statsData.itemsSold.toLocaleString() },
        { label: t('frontpage.stats.activeBidders'), value: statsData.activeBidders.toLocaleString() },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
            {/* Hero Section */}
            <div className="relative text-white overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url(/images/dummyimg.jpg)'
                    }}
                ></div>

                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Content */}
                <div className="container mx-auto px-6 py-16 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                            {t('frontpage.hero.title')}
                        </h1>
                        <p className="text-xl text-blue-100 mb-8 drop-shadow-md">
                            {t('frontpage.hero.subtitle')}
                        </p>

                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="container mx-auto px-6 -mt-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 pb-12">
                {/* Search and Filter Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                        {/* Search Bar */}
                        <div className="w-full lg:w-96">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('navbar.search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    // Debounce handled by useEffect on searchQuery change
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                                />
                                <span className="absolute left-4 top-3.5 text-xl">🔍</span>
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeCategory === category.id
                                        ? "bg-blue-600 text-white shadow-lg scale-105"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <span className="mr-2">{category.icon}</span>
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Featured Auctions Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {activeCategory === "all" ? t('frontpage.featured.title') : `${categories.find(c => c.id === activeCategory)?.name} ${t('frontpage.featured.title')}`}
                        </h2>
                        <p className="text-gray-600">
                            {products.length} {products.length === 1 ? t('product.item') : t('product.items')} {t('common.available')}
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">{t('common.loading')}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-red-500">
                        <p>{error}</p>
                        <button onClick={fetchAuctions} className="mt-4 text-blue-600 underline">{t('common.tryAgain')}</button>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={{
                                id: product._id,
                                ...product,
                                name: product.title,
                                currentBid: product.currentHighestBid,
                                minBid: product.currentHighestBid + product.minimumBidIncrement,
                                bids: product.totalBids,
                                image: product.images[0]
                            }} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('common.noResults')}</h3>
                        <p className="text-gray-600">{t('common.adjustFilters')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Frontpage;
