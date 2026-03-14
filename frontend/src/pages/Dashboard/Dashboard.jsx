import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaBox, FaGavel, FaTrophy, FaTimesCircle, FaBroadcastTower, FaUserShield, FaList, FaBell, FaCamera, FaCog, FaChevronLeft, FaChevronRight, FaCheckCircle, FaInfoCircle, FaClock, FaArrowLeft, FaBars, FaEdit, FaTrash, FaSignOutAlt } from "react-icons/fa";
import { categoryAPI } from "../../services/api";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { auctionService } from "../../services/auctionService";
import { bidService } from "../../services/bidService";
import { userService } from '../../services/userService';
import { adminService } from '../../services/adminService';

const BidCountdown = ({ endTime, status }) => {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!endTime || status !== 'active') {
            setTimeLeft(status === 'ended' ? t('product.ended') : status?.toUpperCase() || "");
            return;
        }

        const calculate = () => {
            const diff = new Date(endTime) - new Date();
            if (diff <= 0) {
                setTimeLeft(t('product.ended'));
                return false;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeLeft(`${days}d ${hours % 24}h`);
            } else {
                setTimeLeft(`${hours}h ${mins}m ${secs}s`);
            }
            return true;
        };

        calculate();
        const timer = setInterval(() => {
            const active = calculate();
            if (!active) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime, status, t]);

    return <span>{timeLeft}</span>;
};

const Dashboard = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get("tab");
        const buyerTabs = ["my-bids", "won-auctions", "view-bidding", "notification", "settings"];
        if (user?.role === 'buyer' && (!tab || !buyerTabs.includes(tab))) {
            return "view-bidding";
        }
        return tab || "products";
    });
    const [myAuctions, setMyAuctions] = useState([]);
    const [loadingAuctions, setLoadingAuctions] = useState(false);
    const [myBidsData, setMyBidsData] = useState([]);
    const [loadingBids, setLoadingBids] = useState(false);
    const [unsoldItemsData, setUnsoldItemsData] = useState([]);
    const [loadingUnsold, setLoadingUnsold] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [loadingLiveAuctions, setLoadingLiveAuctions] = useState(false);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) {
            const sellerTabs = ["products", "unsold"];
            const adminTabs = ["admin-controls", "category"];
            if (user?.role === 'buyer' && (sellerTabs.includes(tab) || adminTabs.includes(tab))) {
                setActiveTab("view-bidding");
            } else if (user?.role === 'seller' && adminTabs.includes(tab)) {
                setActiveTab("view-bidding");
            } else {
                setActiveTab(tab);
            }
        }
    }, [searchParams, user?.role]);

    useEffect(() => {
        if (!user) return;

        if (activeTab === 'products') {
            fetchMyAuctions();
        } else if (activeTab === 'won-auctions') {
            fetchWonAuctions();
        } else if (activeTab === 'my-bids') {
            fetchMyBids();
        } else if (activeTab === 'unsold') {
            fetchUnsoldItems();
        } else if (activeTab === 'notification') {
            fetchNotifications();
        } else if (activeTab === 'view-bidding' || activeTab === 'admin-controls') {
            fetchLiveAuctions();
        }
        if (activeTab === 'admin-controls') {
            fetchAuditLogs();
        }
    }, [activeTab, user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchLiveAuctions = async () => {
        if (!user) return;
        try {
            setLoadingLiveAuctions(true);
            let response;
            if (user?.role === 'admin') {
                // Admin sees all live auctions
                response = await auctionService.getAllAuctions({ status: 'active' });
                if (response.success) {
                    setLiveAuctions(response.data.auctions || []);
                }
            } else if (user?.role === 'seller') {
                // Seller sees their own active auctions
                response = await auctionService.getMyAuctions();
                if (response.success) {
                    const activeOnly = response.data.filter(a => a.status === 'active');
                    setLiveAuctions(activeOnly);
                }
            } else {
                // Buyer sees auctions they have bid on that are still active
                response = await bidService.getMyBids();
                if (response.success) {
                    // Extract unique auctions from bids
                    const uniqueAuctions = [];
                    const seenIds = new Set();

                    response.data.forEach(bid => {
                        if (bid.auctionId && !seenIds.has(bid.auctionId._id)) {
                            uniqueAuctions.push(bid.auctionId);
                            seenIds.add(bid.auctionId._id);
                        }
                    });
                    setLiveAuctions(uniqueAuctions);
                }
            }
        } catch (error) {
            console.error("Error fetching live auctions:", error);
            setLiveAuctions([]); // Prevent crashes
        } finally {
            setLoadingLiveAuctions(false);
        }
    };

    const formatAuditAction = (action) => {
        const map = {
            manual_deactivation: 'User Deactivated',
            reactivate_user: 'User Reactivated',
            delete_account: 'Account Deleted',
            deactivate_user: 'User Deactivated',
            auction_paused: 'Auction Paused',
            auction_cancelled: 'Auction Cancelled'
        };
        return map[action] || action?.replace(/_/g, ' ') || action;
    };
    const formatAuditTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts);
        return isNaN(d.getTime()) ? ts : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    };

    const fetchAuditLogs = async () => {
        if (user?.role !== 'admin') return;
        try {
            setLoadingAuditLog(true);
            const response = await adminService.getAuditLogs();
            if (response.success && response.data) {
                setAuditLog(response.data);
            } else {
                setAuditLog([]);
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            setAuditLog([]);
        } finally {
            setLoadingAuditLog(false);
        }
    };

    const fetchMyAuctions = async () => {
        if (!user) return;
        try {
            setLoadingAuctions(true);
            const response = await auctionService.getMyAuctions();
            if (response.success) {
                setMyAuctions(response.data);
            }
        } catch (error) {
            console.error("Error fetching auctions:", error);
        } finally {
            setLoadingAuctions(false);
        }
    };

    const fetchWonAuctions = async () => {
        if (!user) return;
        try {
            setLoadingWonAuctions(true);
            const response = await auctionService.getWonAuctions();
            if (response.success) {
                setWonAuctions(response.data);
            }
        } catch (error) {
            console.error("Error fetching won auctions:", error);
        } finally {
            setLoadingWonAuctions(false);
        }
    };

    const fetchMyBids = async () => {
        if (!user) return;
        try {
            setLoadingBids(true);
            const response = await bidService.getMyBids();
            if (response.success) {
                setMyBidsData(response.data);
            }
        } catch (error) {
            console.error("Error fetching my bids:", error);
        } finally {
            setLoadingBids(false);
        }
    };

    const fetchUnsoldItems = async () => {
        if (!user) return;
        try {
            setLoadingUnsold(true);
            const response = await auctionService.getMyAuctions();
            if (response.success) {
                // Filter for auctions that have the 'unsold' status
                const unsoldOnly = response.data.filter(a => a.status === 'unsold');
                setUnsoldItemsData(unsoldOnly);
            }
        } catch (error) {
            console.error("Error fetching unsold auctions:", error);
        } finally {
            setLoadingUnsold(false);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setLoadingNotifications(true);
            const response = await userService.getNotifications();
            if (response.success) {
                setNotifications(response.data.notifications || []);
                setNotificationsUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            const response = await userService.markNotificationRead(id);
            if (response.success) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Initialize sidebar state based on screen size
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (isSidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        category: "",
        startingBid: "",
        minBid: "100", // Default increment
        buyNowPrice: "",
        condition: "",
        yearMade: "",
        location: "",
        contactNumber: "",
        duration: "7",
        reservePrice: "0",
        images: [],
        imagePreviews: []
    });

    const [categories, setCategories] = useState([]);
    const [categoryModal, setCategoryModal] = useState({ isOpen: false, mode: 'create', data: null });
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'FaBox' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (categoryModal.mode === 'create') {
                await categoryAPI.create(categoryForm);
                showSuccess("Category created successfully");
            } else {
                await categoryAPI.update(categoryModal.data._id, categoryForm);
                showSuccess("Category updated successfully");
            }
            setCategoryModal({ isOpen: false, mode: 'create', data: null });
            setCategoryForm({ name: '', description: '', icon: 'FaBox' });
            fetchCategories();
        } catch (error) {
            const msg = error.response?.data?.message || "Error saving category";
            if (msg === "Invalid or expired token." || msg === "Access denied. No token provided.") {
                showError("Session expired. Please login again.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                setTimeout(() => window.location.href = '/login', 1500);
                return;
            }
            showError(msg);
        }
    };

    const handleDeleteCategory = async (id) => {
        const confirmed = await showConfirm("Are you sure you want to delete this category?");
        if (confirmed) {
            try {
                await categoryAPI.delete(id);
                showSuccess("Category deleted successfully");
                fetchCategories();
            } catch (error) {
                showError(error.response?.data?.message || "Error deleting category");
            }
        }
    };

    const openCategoryModal = (mode, data = null) => {
        setCategoryModal({ isOpen: true, mode, data });
        if (data) {
            setCategoryForm({ name: data.name, description: data.description, icon: data.icon });
        } else {
            setCategoryForm({ name: '', description: '', icon: 'FaBox' });
        }
    };

    const [userVerified, setUserVerified] = useState(false); // Mock Email Verification Status
    const [adminModal, setAdminModal] = useState({ isOpen: false, type: null, auctionId: null });
    const [adminActionReason, setAdminActionReason] = useState("");
    const [auditLog, setAuditLog] = useState([]);
    const [loadingAuditLog, setLoadingAuditLog] = useState(false);

    const menuItems = [
        { id: "products", name: t('dashboard.tabs.myProducts'), icon: <FaBox />, roles: ['seller', 'admin'] },
        { id: "my-bids", name: t('dashboard.tabs.myBids'), icon: <FaGavel />, roles: ['buyer', 'seller', 'admin'] },
        { id: "won-auctions", name: t('dashboard.tabs.wonAuctions'), icon: <FaTrophy />, roles: ['buyer', 'seller', 'admin'] },
        { id: "unsold", name: t('dashboard.tabs.unsoldItems'), icon: <FaTimesCircle />, roles: ['seller', 'admin'] },
        { id: "view-bidding", name: t('dashboard.tabs.liveAuctions'), icon: <FaBroadcastTower />, roles: ['buyer', 'seller', 'admin'] },
        { id: "admin-controls", name: t('dashboard.tabs.adminControls'), icon: <FaUserShield />, roles: ['admin'] },
        { id: "category", name: t('dashboard.tabs.categories'), icon: <FaList />, roles: ['admin'] },
        { id: "notification", name: t('dashboard.tabs.notification'), icon: <FaBell />, roles: ['buyer', 'seller', 'admin'] },
        { id: "settings", name: t('dashboard.tabs.settings'), icon: <FaCog />, roles: ['buyer', 'seller', 'admin'] },
    ].filter(item => item.roles.includes(user?.role));

    const [wonAuctions, setWonAuctions] = useState([]);
    const [loadingWonAuctions, setLoadingWonAuctions] = useState(false);







    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordModal.newPassword !== passwordModal.confirmPassword) {
            showError("New passwords do not match");
            return;
        }

        try {
            setPasswordLoading(true);
            const res = await userService.changePassword({
                currentPassword: passwordModal.currentPassword,
                newPassword: passwordModal.newPassword
            });

            if (res.success) {
                showSuccess("Password updated successfully");
                setPasswordModal({
                    isOpen: false,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            showError(error.response?.data?.message || "Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = await showConfirm("WARNING: Are you sure you want to delete your account? This action is permanent and cannot be undone.");
        if (confirmed) {
            try {
                const res = await userService.deleteAccount();
                if (res.success) {
                    showSuccess("Account deleted successfully.");
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    setTimeout(() => window.location.href = '/', 1500);
                }
            } catch (error) {
                showError(error.response?.data?.message || "Failed to delete account");
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Limit to 10 images total
            const currentCount = newProduct.images.length;
            const availableSlots = 10 - currentCount;
            const filesToAdd = files.slice(0, availableSlots);

            if (filesToAdd.length < files.length) {
                showWarning(`You can only upload up to 10 images. ${files.length - filesToAdd.length} file(s) were not added.`);
            }

            const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));

            setNewProduct(prev => ({
                ...prev,
                images: [...prev.images, ...filesToAdd],
                imagePreviews: [...prev.imagePreviews, ...newPreviews]
            }));
        }
    };

    const handleRemoveImage = (index) => {
        setNewProduct(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    const [formErrors, setFormErrors] = useState({});

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        setFormErrors({}); // Clear previous errors

        const formData = new FormData();
        formData.append('title', newProduct.name);
        formData.append('description', newProduct.description);
        formData.append('category', newProduct.category);
        formData.append('startingBid', newProduct.startingBid);
        formData.append('minimumBidIncrement', newProduct.minBid || 100);
        formData.append('reservePrice', newProduct.reservePrice || 0);
        formData.append('buyNowPrice', newProduct.buyNowPrice || 0);
        formData.append('condition', newProduct.condition);
        formData.append('yearMade', newProduct.yearMade);
        formData.append('location', newProduct.location);
        formData.append('contactNumber', newProduct.contactNumber);
        formData.append('duration', newProduct.duration || 7);

        // Append images
        newProduct.images.forEach(file => {
            if (file instanceof File) {
                formData.append('images', file);
            }
        });

        // If editing, keep track of existing images if needed (backend logic dependent)
        // For simplicity, we assume the backend handles image replacement or we append new ones.

        try {
            let response;
            if (editingProduct) {
                response = await auctionService.updateAuction(editingProduct._id, formData);
            } else {
                response = await auctionService.createAuction(formData);
            }

            if (response.success) {
                showSuccess(editingProduct ? "Auction updated successfully!" : "Auction created successfully! It is now live on the website.");
                setShowAddProduct(false);
                setEditingProduct(null);
                setNewProduct({
                    name: "",
                    description: "",
                    category: "",
                    startingBid: "",
                    minBid: "100",
                    buyNowPrice: "",
                    condition: "",
                    yearMade: "",
                    location: "",
                    contactNumber: "",
                    duration: "7",
                    reservePrice: "0",
                    images: [],
                    imagePreviews: []
                });
                fetchMyAuctions();
            }
        } catch (error) {
            console.error(error);
            // Handle Mongoose validation errors
            if (error.response?.data?.errors) {
                const backendErrors = {};
                // Map backend error keys to frontend form keys
                // Backend: title, description, category, startingBid, etc.
                // Frontend keys: name, description, category, startingBid, etc.
                const errorMap = {
                    title: 'name',
                    description: 'description',
                    category: 'category',
                    startingBid: 'startingBid',
                    minimumBidIncrement: 'minBid',
                    reservePrice: 'reservePrice',
                    buyNowPrice: 'buyNowPrice',
                    condition: 'condition',
                    yearMade: 'yearMade',
                    location: 'location',
                    images: 'images'
                };

                Object.keys(error.response.data.errors).forEach(key => {
                    const frontendKey = errorMap[key] || key;
                    backendErrors[frontendKey] = error.response.data.errors[key].message;
                });

                setFormErrors(backendErrors);
                // Also show alert for visibility
                showError("Please correct the errors in the form.");
                return;
            }

            const msg = error.response?.data?.message || "Error creating auction";
            if (msg === "Invalid or expired token." || (error.response?.status === 401)) {
                showError("Session expired. Please login again.");
                return;
            }
            showError(msg);
        }
    };



    const handleEditClick = (auction) => {
        if (auction.totalBids > 0) {
            showError("This auction cannot be edited because bids have already been placed.");
            return;
        }
        setEditingProduct(auction);
        setNewProduct({
            name: auction.title,
            description: auction.description,
            category: auction.category,
            startingBid: auction.startingBid,
            minBid: auction.minimumBidIncrement || 100,
            buyNowPrice: auction.buyNowPrice || "",
            condition: auction.condition,
            yearMade: auction.yearMade,
            location: auction.location,
            contactNumber: auction.contactNumber || "",
            duration: auction.duration || 7,
            reservePrice: auction.reservePrice || 0,
            images: auction.images || [],
            imagePreviews: auction.images || []
        });
        setShowAddProduct(true);
    };

    const handleDeleteProduct = async (id) => {
        const confirmed = await showConfirm("Are you sure you want to delete this auction? This action cannot be undone.");
        if (confirmed) {
            try {
                const response = await auctionService.deleteAuction(id);
                if (response.success) {
                    showSuccess("Auction deleted successfully.");
                    fetchMyAuctions();
                }
            } catch (error) {
                showError(error.response?.data?.message || "Error deleting auction");
            }
        }
    };



    const renderContent = () => {
        switch (activeTab) {
            case "products":
                return (
                    <div>
                        {showAddProduct ? (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingProduct ? `${t('dashboard.products.edit')}: ${editingProduct.title}` : t('dashboard.products.addTitle')}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddProduct(false);
                                            setEditingProduct(null);
                                        }}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 flex items-center justify-center gap-2"
                                    >
                                        <FaArrowLeft /> {t('dashboard.products.backToProducts')}
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-8">
                                    <form onSubmit={handleSubmitProduct} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.productName')} *</label>
                                                <input type="text" name="name" value={newProduct.name} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="e.g: Rolex Watch" />
                                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.category')} *</label>
                                                <select name="category" value={newProduct.category} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.category ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`}>
                                                    <option value="">{t('common.select')}</option>
                                                    {categories.map(cat => (
                                                        <option key={cat._id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.startingBid')} *</label>
                                                <input type="number" name="startingBid" value={newProduct.startingBid} onChange={handleInputChange} required min="0" step="100" className={`w-full px-4 py-3 border-2 ${formErrors.startingBid ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="10000" />
                                                {formErrors.startingBid && <p className="text-red-500 text-xs mt-1">{formErrors.startingBid}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.minBid')} *</label>
                                                <input type="number" name="minBid" value={newProduct.minBid} onChange={handleInputChange} required min="0" step="100" className={`w-full px-4 py-3 border-2 ${formErrors.minBid ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="10500" />
                                                {formErrors.minBid && <p className="text-red-500 text-xs mt-1">{formErrors.minBid}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.buyNowPrice')} <span className="text-gray-400 font-normal">({t('dashboard.products.optional')})</span></label>
                                                <input type="number" name="buyNowPrice" value={newProduct.buyNowPrice} onChange={handleInputChange} min="0" step="100" className={`w-full px-4 py-3 border-2 ${formErrors.buyNowPrice ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="e.g: 15000" />
                                                {formErrors.buyNowPrice && <p className="text-red-500 text-xs mt-1">{formErrors.buyNowPrice}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.condition')} *</label>
                                                <select name="condition" value={newProduct.condition} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.condition ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`}>
                                                    <option value="">{t('common.select')}</option>
                                                    <option value="Mint">Mint</option>
                                                    <option value="Excellent">Excellent</option>
                                                    <option value="Very Good">Very Good</option>
                                                    <option value="Good">Good</option>
                                                    <option value="Fair">Fair</option>
                                                    <option value="Restored">Restored</option>
                                                </select>
                                                {formErrors.condition && <p className="text-red-500 text-xs mt-1">{formErrors.condition}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.yearMade')} *</label>
                                                <input type="text" name="yearMade" value={newProduct.yearMade} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.yearMade ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="e.g: 2026" />
                                                {formErrors.yearMade && <p className="text-red-500 text-xs mt-1">{formErrors.yearMade}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.location')} *</label>
                                                <input type="text" name="location" value={newProduct.location} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.location ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="e.g: UAE" />
                                                {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.contactNumber')} *</label>
                                                <input type="text" name="contactNumber" value={newProduct.contactNumber} onChange={handleInputChange} required className={`w-full px-4 py-3 border-2 ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="e.g: +1 234 567 890" />
                                                {formErrors.contactNumber && <p className="text-red-500 text-xs mt-1">{formErrors.contactNumber}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.reservePrice')}</label>
                                                <input type="number" name="reservePrice" onChange={handleInputChange} className={`w-full px-4 py-3 border-2 ${formErrors.reservePrice ? 'border-red-500' : 'border-gray-200'} rounded-lg`} placeholder="Hidden min price" />
                                                {formErrors.reservePrice && <p className="text-red-500 text-xs mt-1">{formErrors.reservePrice}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.duration')}</label>
                                                <select name="duration" value={newProduct.duration} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg">
                                                    <option value="3">3 Days</option>
                                                    <option value="5">5 Days</option>
                                                    <option value="7">7 Days</option>
                                                    <option value="10">10 Days</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.productImages')} * ({t('dashboard.products.imagesLimit')})</label>
                                                <div className={`border-2 border-dashed ${formErrors.images ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg p-6 hover:border-blue-500 transition duration-200`}>
                                                    {newProduct.imagePreviews.length > 0 ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                                {newProduct.imagePreviews.map((preview, index) => (
                                                                    <div key={index} className="relative group">
                                                                        <img
                                                                            src={preview}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveImage(index)}
                                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                                            {index + 1}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {newProduct.imagePreviews.length < 10 && (
                                                                <div className="text-center">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        multiple
                                                                        onChange={handleImageChange}
                                                                        className="mt-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                                    />
                                                                    <p className="text-sm text-gray-500 mt-2">{newProduct.imagePreviews.length} / 10 images uploaded</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <div className="text-6xl mb-3 flex justify-center text-gray-400"><FaCamera /></div>
                                                            <p className="text-gray-600 mb-2">{t('dashboard.products.uploadImages')}</p>
                                                            <p className="text-sm text-gray-500 mb-4">{t('dashboard.products.uploadHint')}</p>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={handleImageChange}
                                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {formErrors.images && <p className="text-red-500 text-xs mt-1 text-center">{formErrors.images}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.products.description')} *</label>
                                            <textarea name="description" value={newProduct.description} onChange={handleInputChange} required rows="4" className={`w-full px-4 py-3 border-2 ${formErrors.description ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-blue-500 transition duration-200`} placeholder="Detailed description of the product..."></textarea>
                                            {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                                            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-lg">
                                                {editingProduct ? t('common.saveChanges') : t('dashboard.products.submitAdd')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddProduct(false);
                                                    setEditingProduct(null);
                                                    setNewProduct({
                                                        name: "",
                                                        description: "",
                                                        category: "",
                                                        startingBid: "",
                                                        minBid: "100",
                                                        buyNowPrice: "",
                                                        condition: "",
                                                        yearMade: "",
                                                        location: "",
                                                        contactNumber: "",
                                                        duration: "7",
                                                        reservePrice: "0",
                                                        images: [],
                                                        imagePreviews: []
                                                    });
                                                }}
                                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
                                            >
                                                {t('dashboard.products.cancel')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.products.title')}</h2>
                                    {(user?.role === 'seller' || user?.role === 'admin') && (
                                        <button
                                            onClick={() => setShowAddProduct(true)}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-md w-full md:w-auto"
                                        >
                                            + {t('dashboard.products.addNew')}
                                        </button>
                                    )}
                                </div>

                                {loadingAuctions ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : myAuctions.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
                                        <div className="text-5xl md:text-6xl mb-4">📦</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.products.noItems')}</h3>
                                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{t('dashboard.products.noItemsSubtitle')}</p>
                                        <button
                                            onClick={() => setShowAddProduct(true)}
                                            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95"
                                        >
                                            {t('dashboard.products.addFirst')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile View: Request Cards */}
                                        <div className="md:hidden space-y-4">
                                            {myAuctions.map((auction) => (
                                                <div key={auction._id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                                                    <div className="flex gap-3 mb-3">
                                                        {auction.images && auction.images[0] && (
                                                            <img
                                                                src={auction.images[0]}
                                                                alt={auction.title}
                                                                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                                                onError={(e) => console.error(`Image failed: ${auction.images[0]}`)}
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h3 className="font-bold text-gray-800">{auction.title}</h3>
                                                                    <p className="text-xs text-gray-500">ID: ...{auction._id.slice(-6)}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${auction.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {t(`dashboard.status.${auction.status}`)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">{t('dashboard.products.currentBid')}</p>
                                                            <p className="font-semibold text-green-600">${auction.currentHighestBid || auction.startingBid}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">{t('dashboard.products.bids')}</p>
                                                            <p className="font-semibold text-gray-800">{auction.totalBids || 0}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleEditClick(auction)}
                                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${auction.totalBids > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                                                        >
                                                            {t('dashboard.products.edit')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(auction._id)}
                                                            className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                                                        >
                                                            {t('dashboard.products.delete')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop View: Table */}
                                        <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.image')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.title')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.products.currentBid')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.status')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.products.bids')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {myAuctions.map((auction) => (
                                                        <tr key={auction._id} className="hover:bg-gray-50 transition duration-150">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-10 w-10 flex-shrink-0">
                                                                        <img className="h-10 w-10 rounded-lg object-cover border" src={auction.images[0]} alt="" onError={(e) => console.error(`Image failed: ${auction.images[0]}`)} />
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">{auction.title}</div>
                                                                        <div className="text-xs text-gray-500">{auction.category}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-semibold text-green-600">${auction.currentHighestBid || auction.startingBid}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${auction.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {auction.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {auction.totalBids || 0}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex space-x-3">
                                                                    <button
                                                                        onClick={() => handleEditClick(auction)}
                                                                        className={`${auction.totalBids > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'}`}
                                                                        title={auction.totalBids > 0 ? "Cannot edit auction with bids" : t('dashboard.products.edit')}
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(auction._id)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                        title={t('dashboard.products.delete')}
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );



            case "won-auctions":
                return (
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
                            <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.wonAuctions.title')}</h2>
                        </div>

                        {loadingWonAuctions ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : wonAuctions.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
                                <div className="text-5xl md:text-6xl mb-4">🏆</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.wonAuctions.noItems')}</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">{t('dashboard.wonAuctions.noItemsSubtitle')}</p>
                                <Link to="/" className="inline-block w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 text-center">
                                    {t('dashboard.wonAuctions.browse')}
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Mobile View: Won Items Cards */}
                                <div className="md:hidden space-y-4">
                                    {wonAuctions.map(item => (
                                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group active:scale-[0.98] transition-transform duration-200">
                                            <div className="flex p-4 gap-4">
                                                {item.images && item.images[0] && (
                                                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100">
                                                        <img
                                                            src={item.images[0]}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => console.error(`Image failed: ${item.images[0]}`)}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-bold text-gray-900 truncate pr-2">{item.title}</h3>
                                                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            Won
                                                        </div>
                                                    </div>
                                                    <p className="text-xl font-black text-blue-600 mb-2">
                                                        ${item.finalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span className="shrink-0 font-medium text-gray-400">Seller:</span>
                                                            <span className="truncate text-gray-700 font-semibold">{item.sellerId?.name || 'Seller'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span className="shrink-0 font-medium text-gray-400">Phone:</span>
                                                            <a href={`tel:${item.contactNumber}`} className="text-blue-600 font-bold hover:underline select-all">
                                                                {item.contactNumber}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 flex gap-2 border-t border-gray-100">
                                                <Link
                                                    to={`/product/${item._id}`}
                                                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold text-center active:bg-gray-100 transition-colors"
                                                >
                                                    {t('dashboard.liveAuctions.viewDetails')}
                                                </Link>
                                                <a
                                                    href={`tel:${item.contactNumber}`}
                                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold text-center active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Call Seller
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('table.title')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('dashboard.wonAuctions.finalPrice')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('product.seller')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('dashboard.products.contactNumber')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {wonAuctions.map(item => (
                                                <tr key={item._id}>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{item.title}</td>
                                                    <td className="px-6 py-4 text-gray-600">${item.finalPrice?.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-gray-600 font-medium">{item.sellerId?.name || 'Seller'}</td>
                                                    <td className="px-6 py-4 text-blue-600 font-semibold">
                                                        <a href={`tel:${item.contactNumber}`} className="hover:underline">{item.contactNumber}</a>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link to={`/product/${item._id}`} className="text-blue-600 hover:text-blue-800 font-bold text-sm">
                                                            {t('dashboard.liveAuctions.viewDetails')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                            <p><strong>Note:</strong> Items listed here have been successfully won by you. Please contact the seller for fulfillment.</p>
                        </div>
                    </div>
                );

            case "my-bids":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.tabs.myBids')}</h2>

                        {loadingBids ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : myBidsData.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">📢</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('dashboard.bids.noItems')}</h3>
                                <p className="text-gray-600 mb-6">{t('dashboard.bids.noItemsSubtitle')}</p>
                                <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow">
                                    {t('dashboard.bids.browse')}
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Mobile View: My Bids Cards */}
                                <div className="md:hidden space-y-4">
                                    {myBidsData.map(bid => (
                                        <div key={bid._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group active:scale-[0.98] transition-transform duration-200">
                                            <div className="flex p-4 gap-4">
                                                {bid.auctionId?.images && bid.auctionId.images[0] && (
                                                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100">
                                                        <img
                                                            src={bid.auctionId.images[0]}
                                                            alt={bid.auctionId.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => console.error(`Image failed: ${bid.auctionId.images[0]}`)}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-bold text-gray-900 truncate pr-2">{bid.auctionId?.title}</h3>
                                                        {bid.status === 'winning' && (
                                                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                                                                {t('dashboard.status.winning')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-baseline gap-2 mb-2">
                                                        <span className="text-2xl font-black text-gray-900">${bid.bidAmount}</span>
                                                        <span className="text-xs text-gray-400 font-medium">Your Bid</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                        <FaClock className="text-blue-500" />
                                                        <span className="font-black transition-colors group-hover:text-blue-600 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                                            <BidCountdown endTime={bid.auctionId?.endDate || bid.auctionId?.auctionEndTime} status={bid.auctionId?.status || 'active'} />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-4 pb-4">
                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Current Highest</p>
                                                        <p className="text-lg font-bold text-green-600">${bid.auctionId?.currentHighestBid}</p>
                                                    </div>
                                                    <Link
                                                        to={`/product/${bid.auctionId?._id}`}
                                                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm active:bg-blue-700"
                                                    >
                                                        Bid Again
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('table.image')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('table.title')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('dashboard.bids.myMaxBid')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('dashboard.bids.highestBid')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('dashboard.bids.timeLeft')}</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('table.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {myBidsData.map(bid => (
                                                <tr key={bid._id} className="hover:bg-gray-50 transition duration-150">
                                                    <td className="px-6 py-4">
                                                        {bid.auctionId?.images && bid.auctionId.images[0] && (
                                                            <img
                                                                src={bid.auctionId.images[0]}
                                                                alt={bid.auctionId.title}
                                                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                                                onError={(e) => console.error(`Image failed: ${bid.auctionId.images[0]}`)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link to={`/product/${bid.auctionId?._id}`} className="font-medium text-gray-800 hover:text-blue-600">
                                                            {bid.auctionId?.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 font-semibold">${bid.bidAmount}</td>
                                                    <td className="px-6 py-4 text-green-600 font-bold">${bid.auctionId?.currentHighestBid}</td>
                                                    <td className="px-6 py-4 text-gray-700 font-bold">
                                                        <div className="flex items-center gap-2">
                                                            <FaClock className="text-blue-500 shrink-0" size={14} />
                                                            <BidCountdown endTime={bid.auctionId?.endDate || bid.auctionId?.auctionEndTime} status={bid.auctionId?.status || 'active'} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${bid.status === 'winning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {bid.status === 'winning' ? t('dashboard.status.winning') : t('dashboard.status.outbid')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                );

            case "admin-controls":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.tabs.adminControls')}</h2>

                        {/* Audit Log */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">{t('dashboard.admin.auditLog')}</h3>
                            {loadingAuditLog ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500 text-sm">{t('common.loading')}</p>
                                </div>
                            ) : auditLog.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">{t('dashboard.admin.noAuditLog')}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile View: Audit Cards */}
                                    <div className="md:hidden space-y-4">
                                        {auditLog.map(log => (
                                            <div key={log._id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group overflow-hidden">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest">{formatAuditAction(log.action)}</span>
                                                        <h4 className="font-bold text-gray-900 truncate">{log.target}</h4>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{formatAuditTime(log.timestamp)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                        {(log.admin || '').charAt(0)}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium">{t('dashboard.admin.admin')}: <span className="text-gray-700 font-bold">{log.admin}</span></p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-3 text-left">{t('dashboard.admin.action')}</th>
                                                    <th className="p-3 text-left">{t('dashboard.admin.target')}</th>
                                                    <th className="p-3 text-left">{t('dashboard.admin.admin')}</th>
                                                    <th className="p-3 text-left">{t('dashboard.admin.time')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLog.map(log => (
                                                    <tr key={log._id} className="border-t">
                                                        <td className="p-3 font-medium">{formatAuditAction(log.action)}</td>
                                                        <td className="p-3 text-gray-600">{log.target}</td>
                                                        <td className="p-3 text-gray-600">{log.admin}</td>
                                                        <td className="p-3 text-gray-500">{formatAuditTime(log.timestamp)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Active Auctions Management */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                {t('dashboard.admin.manageLive')}
                            </h3>
                            <div className="space-y-4">
                                {loadingLiveAuctions ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-500 text-sm">{t('common.loading')}</p>
                                    </div>
                                ) : liveAuctions.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <FaGavel className="text-gray-300 text-3xl mx-auto mb-2" />
                                        <p className="text-gray-500 font-medium">{t('dashboard.admin.noLive')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                        {liveAuctions.map(p => (
                                            <div key={p._id || p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-100 hover:shadow-md transition-all group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.title || p.name}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] uppercase font-bold text-gray-400">#{p._id?.slice(-8) || p.id?.slice(-8)}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {t(`dashboard.status.${p.status}`)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setAdminModal({ isOpen: true, type: 'Pause', auctionId: p._id || p.id })}
                                                            className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all text-center"
                                                        >
                                                            {t('dashboard.admin.pause')}
                                                        </button>
                                                        <button
                                                            onClick={() => setAdminModal({ isOpen: true, type: 'Cancel', auctionId: p._id || p.id })}
                                                            className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all text-center"
                                                        >
                                                            {t('dashboard.admin.cancel')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Action Modal */}
                        {adminModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg w-96 shadow-2xl animate-fadeIn">
                                    <h3 className="text-xl font-bold mb-4">{adminModal.type} {t('product.auction')} #{adminModal.auctionId?.slice(-8)}</h3>
                                    <textarea
                                        value={adminActionReason}
                                        onChange={(e) => setAdminActionReason(e.target.value)}
                                        placeholder="Enter justification/reason..."
                                        className="w-full border p-2 rounded mb-4"
                                        rows="3"
                                    ></textarea>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setAdminModal({ isOpen: false, type: null, auctionId: null }); setAdminActionReason(''); }} className="px-4 py-2 text-gray-600">{t('common.close')}</button>
                                        <button
                                            onClick={async () => {
                                                if (!adminActionReason?.trim()) {
                                                    alert(t('dashboard.admin.reasonRequired') || 'Reason required');
                                                    return;
                                                }
                                                try {
                                                    if (adminModal.type === 'Pause') {
                                                        await adminService.pauseAuction(adminModal.auctionId, adminActionReason.trim());
                                                    } else {
                                                        await adminService.cancelAuction(adminModal.auctionId, adminActionReason.trim());
                                                    }
                                                    setAdminModal({ isOpen: false, type: null, auctionId: null });
                                                    setAdminActionReason('');
                                                    fetchLiveAuctions();
                                                    fetchAuditLogs();
                                                    alert(adminModal.type === 'Pause' ? (t('dashboard.admin.pauseSuccess') || 'Auction paused successfully.') : (t('dashboard.admin.cancelSuccess') || 'Auction cancelled successfully.'));
                                                } catch (err) {
                                                    const msg = err.response?.data?.message || err.message || 'Action failed';
                                                    alert(msg);
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded font-bold">
                                            {t('dashboard.admin.confirm')} {adminModal.type}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case "unsold":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.tabs.unsoldItems')}</h2>

                        {loadingUnsold ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : unsoldItemsData.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">⌛</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('dashboard.unsold.noItems')}</h3>
                                <p className="text-gray-600 mb-6">{t('dashboard.unsold.noItemsSubtitle')}</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm md:shadow-md overflow-hidden p-3 md:p-0 border border-gray-100 md:border-0">
                                {/* Mobile View: Unsold Cards */}
                                <div className="md:hidden space-y-4">
                                    {unsoldItemsData.map(item => (
                                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all duration-300 group active:scale-[0.99] overflow-hidden">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-gray-900 truncate pr-2">{item.title}</h3>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">#{item._id?.slice(-8)}</p>
                                                </div>
                                                <span className="inline-block self-start bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-amber-100 leading-tight">
                                                    {t('dashboard.unsold.reserveNotMet')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight truncate">{t('dashboard.products.reservePrice')}</span>
                                                    <span className="text-sm font-black text-gray-700">${item.reservePrice}</span>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight truncate">{t('dashboard.products.currentBid')}</span>
                                                    <span className="text-sm font-black text-rose-600">${item.currentHighestBid}</span>
                                                </div>
                                            </div>
                                            <Link to={`/product/${item._id}`} className="flex items-center justify-center w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all gap-2 text-xs">
                                                {t('dashboard.liveAuctions.viewDetails')}
                                                <FaChevronRight size={10} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left">{t('table.image')}</th>
                                                <th className="px-6 py-4 text-left">{t('table.title')}</th>
                                                <th className="px-6 py-4 text-left">{t('dashboard.products.reservePrice')}</th>
                                                <th className="px-6 py-4 text-left">{t('dashboard.products.currentBid')}</th>
                                                <th className="px-6 py-4 text-left">{t('table.status')}</th>
                                                <th className="px-6 py-4 text-left">{t('table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {unsoldItemsData.map(item => (
                                                <tr key={item._id} className="hover:bg-gray-50 transition duration-150">
                                                    <td className="px-6 py-4">
                                                        <img
                                                            src={item.images?.[0]}
                                                            alt={item.title}
                                                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{item.title}</td>
                                                    <td className="px-6 py-4 text-gray-600">${item.reservePrice}</td>
                                                    <td className="px-6 py-4 text-red-500 font-semibold">${item.currentHighestBid}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                                            {t('dashboard.unsold.reserveNotMet')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link to={`/product/${item._id}`} className="text-blue-600 hover:underline text-sm font-bold">
                                                            {t('dashboard.liveAuctions.viewDetails')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );




            case "view-bidding":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.liveAuctions.title')}</h2>
                        {loadingLiveAuctions ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">{t('dashboard.liveAuctions.loading')}</p>
                            </div>
                        ) : liveAuctions.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
                                <FaBroadcastTower className="text-4xl md:text-5xl text-blue-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.liveAuctions.noBids')}</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">{t('dashboard.liveAuctions.noBidsSubtitle')}</p>
                                <Link to="/" className="inline-block w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 text-center">
                                    {t('dashboard.liveAuctions.browse')}
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Mobile View: Premium Cards */}
                                <div className="md:hidden space-y-4">
                                    {liveAuctions.map((product) => (
                                        <div key={product._id || product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group active:scale-[0.99] transition-all">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-gray-900 truncate pr-2">{product.title || product.name}</h3>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">#{product._id?.slice(-8) || product.id?.slice(-8)}</p>
                                                </div>
                                                <span className="shrink-0 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                    {t('dashboard.status.active')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('dashboard.products.currentBid')}</span>
                                                    <span className="text-lg font-black text-green-600">${(product.currentHighestBid || product.price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('dashboard.products.bids')}</span>
                                                    <span className="text-lg font-black text-gray-700">{product.totalBids || product.bids || 0}</span>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/product/${product._id || product.id}`}
                                                className="flex items-center justify-center w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-sm active:bg-blue-800 transition-all gap-2 text-sm"
                                            >
                                                {t('dashboard.liveAuctions.viewDetails')}
                                                <FaChevronRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: "System" Table */}
                                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">{t('table.image')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">{t('table.title')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">{t('dashboard.products.currentBid')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">{t('dashboard.products.bids')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">{t('table.status')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest text-right">{t('table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {liveAuctions.map((product) => (
                                                <tr key={product._id || product.id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                                            <img
                                                                src={product.images?.[0] || product.image}
                                                                alt={product.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{product.title || product.name}</p>
                                                            <p className="text-[10px] font-medium text-gray-400">ID: #{product._id?.slice(-8) || product.id?.slice(-8)}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-green-600 text-base">${(product.currentHighestBid || product.price || 0).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{product.totalBids || product.bids || 0}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Bids</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-sm">
                                                            {t('dashboard.status.active')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            to={`/product/${product._id || product.id}`}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                                                        >
                                                            {t('dashboard.liveAuctions.viewDetails')}
                                                            <FaChevronRight size={10} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "category":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.tabs.categories')}</h2>
                            <button
                                onClick={() => openCategoryModal('create')}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-md"
                            >
                                {t('dashboard.category.add')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {categories.map((cat) => (
                                <div key={cat._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-200 relative group">
                                    <div className="text-center">
                                        <div className="text-4xl mb-3 flex justify-center text-blue-600">
                                            <FaList />
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-2">{cat.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{cat.description}</p>
                                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => openCategoryModal('edit', cat)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                                title={t('common.edit')}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                title={t('common.delete')}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Category Modal */}
                        {categoryModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                                        {categoryModal.mode === 'create' ? t('dashboard.category.addTitle') : t('dashboard.category.editTitle')}
                                    </h3>
                                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.name')}</label>
                                            <input
                                                type="text"
                                                required
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                placeholder={t('common.name')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.description')}</label>
                                            <textarea
                                                required
                                                value={categoryForm.description}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                placeholder={t('common.description')}
                                                rows="3"
                                            ></textarea>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setCategoryModal({ isOpen: false, mode: 'create', data: null })}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg"
                                            >
                                                {categoryModal.mode === 'create' ? t('common.create') : t('common.saveChanges')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "notification":
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.tabs.notification')}</h2>
                            {notificationsUnreadCount > 0 && (
                                <button
                                    onClick={() => handleMarkRead('all')}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <FaCheckCircle className="text-xs" /> {t('dashboard.notifications.markAllRead')}
                                </button>
                            )}
                        </div>

                        {loadingNotifications ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                                <div className="text-6xl mb-4">🔕</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('dashboard.notifications.noItems')}</h3>
                                <p>{t('dashboard.notifications.noItemsSubtitle')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notif) => {
                                    let Icon = FaBell;
                                    let iconColor = "bg-blue-100 text-blue-600";

                                    if (notif.type === 'win') {
                                        Icon = FaCheckCircle;
                                        iconColor = "bg-green-100 text-green-600";
                                    } else if (notif.type === 'sale') {
                                        Icon = FaCheckCircle;
                                        iconColor = "bg-green-100 text-green-600";
                                    } else if (notif.type === 'bid_placed') {
                                        Icon = FaGavel;
                                        iconColor = "bg-blue-100 text-blue-600";
                                    } else if (notif.type === 'outbid') {
                                        Icon = FaGavel;
                                        iconColor = "bg-orange-100 text-orange-600";
                                    } else if (notif.type === 'new_auction') {
                                        Icon = FaBell;
                                        iconColor = "bg-purple-100 text-purple-600";
                                    } else if (['payment_due', 'auction_ending', 'info'].includes(notif.type)) {
                                        Icon = FaInfoCircle;
                                        iconColor = "bg-yellow-100 text-yellow-600";
                                    } else if (['auction_paused', 'auction_cancelled'].includes(notif.type)) {
                                        Icon = FaTimesCircle;
                                        iconColor = "bg-red-100 text-red-600";
                                    }

                                    const params = notif.params || {};

                                    // Determine correct translation key for 'info' type
                                    const getNotifMessage = () => {
                                        if (notif.type === 'info') {
                                            // If has a reason, it's the seller's "no sale" notification
                                            if (params.reason) {
                                                return t('dashboard.notifications.types.info_no_sale', { title: params.title });
                                            }
                                            // Otherwise it's the bidder's "reserve not met" notification
                                            return t('dashboard.notifications.types.info_reserve', { title: params.title });
                                        }
                                        const key = `dashboard.notifications.types.${notif.type}`;
                                        const translated = t(key, params);

                                        // Win notifications should include title+price params; otherwise fall back to stored message
                                        if (notif.type === 'win' && (!params.title || !params.price)) {
                                            return notif.message;
                                        }

                                        // If key not found (returns the key itself), fall back to stored message
                                        return translated === key ? notif.message : translated;
                                    };

                                    const NotificationContent = () => (
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-gray-800 leading-tight ${!notif.readStatus ? 'font-bold' : 'font-medium'}`}>
                                                {getNotifMessage()}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                                                    <FaClock className="text-[8px]" /> {timeAgo(notif.createdAt)}
                                                </span>
                                                {!notif.readStatus && (
                                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full tracking-tighter shadow-sm animate-pulse">
                                                        {t('dashboard.notifications.new')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <div
                                            key={notif._id}
                                            onClick={() => !notif.readStatus && handleMarkRead(notif._id)}
                                            className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all duration-300 hover:shadow-md active:scale-[0.99] ${notif.readStatus ? 'opacity-80' : 'ring-1 ring-blue-50 border-blue-100'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300 ${iconColor}`}>
                                                    <Icon size={18} />
                                                </div>

                                                {notif.auctionId ? (
                                                    <Link to={`/product/${notif.auctionId}`} className="block flex-1 min-w-0">
                                                        <NotificationContent />
                                                    </Link>
                                                ) : (
                                                    <NotificationContent />
                                                )}

                                                <div className="flex flex-col gap-2">
                                                    {!notif.readStatus && (
                                                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {notif.auctionId && (
                                                <Link
                                                    to={`/product/${notif.auctionId}`}
                                                    className="mt-3 md:hidden flex items-center justify-center w-full py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                                                >
                                                    {t('dashboard.liveAuctions.viewDetails')}
                                                    <FaChevronRight size={10} />
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );

            case "settings":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.tabs.settings')}</h2>

                        {/* Account Settings */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <FaCog className="text-blue-600" />
                                {t('dashboard.settings.account')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t('auth.email')}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 italic">Managed by Auth System</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t('auth.password')}</p>
                                        <p className="text-sm text-gray-500">••••••••</p>
                                    </div>
                                    <button
                                        onClick={() => setPasswordModal({ ...passwordModal, isOpen: true })}
                                        className="mt-2 md:mt-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    >
                                        {t('common.edit')}
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t('dashboard.settings.deleteAccount')}</p>
                                        <p className="text-sm text-gray-500">{t('dashboard.settings.deleteAccountDesc')}</p>
                                    </div>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="mt-2 md:mt-0 text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t('dashboard.settings.signOut')}</p>
                                        <p className="text-sm text-gray-500">{t('dashboard.settings.signOutDesc')}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const confirmed = await showConfirm(t('common.confirmSignOut'));
                                            if (confirmed) {
                                                localStorage.removeItem('accessToken');
                                                localStorage.removeItem('refreshToken');
                                                localStorage.removeItem('user');
                                                // Also try calling context logout just in case
                                                try { await logout(); } catch (e) { }
                                                window.location.href = '/';
                                            }
                                        }}
                                        className="mt-2 md:mt-0 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 flex items-center gap-2"
                                    >
                                        <FaSignOutAlt /> {t('dashboard.settings.signOut')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Password Change Modal */}
                        {passwordModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
                                        <button
                                            onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <FaTimesCircle size={24} />
                                        </button>
                                    </div>
                                    <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                value={passwordModal.currentPassword}
                                                onChange={(e) => setPasswordModal({ ...passwordModal, currentPassword: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                value={passwordModal.newPassword}
                                                onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                value={passwordModal.confirmPassword}
                                                onChange={(e) => setPasswordModal({ ...passwordModal, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={passwordLoading}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {passwordLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return <div>Select a menu item</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex">
            {/* Mobile Sidebar Overlay Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0'} fixed md:sticky top-0 left-0 z-50 bg-white shadow-xl transition-all duration-300 flex flex-col h-screen max-h-screen overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200">
                    {/* Back to Home Button */}
                    <Link
                        to="/"
                        className={`flex items-center gap-2 mb-6 text-gray-500 hover:text-blue-600 transition-all duration-200 group ${!isSidebarOpen && 'justify-center'}`}
                        title={t('common.backHome')}
                    >
                        <FaArrowLeft className={`transition-transform group-hover:-translate-x-1 ${!isSidebarOpen && 'text-xl'}`} />
                        {isSidebarOpen && <span className="text-sm font-semibold tracking-wide uppercase">{t('common.backHome')}</span>}
                    </Link>

                    <div className="flex items-center justify-between">
                        {isSidebarOpen && (
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {t('dashboard.title')}
                            </h1>
                        )}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
                        >
                            <span className="text-xl">{isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}</span>
                        </button>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 p-4 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (window.innerWidth < 768) {
                                            setIsSidebarOpen(false);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    {isSidebarOpen && (
                                        <span className="font-medium flex-1">{item.name}</span>
                                    )}
                                    {item.id === 'notification' && notificationsUnreadCount > 0 && (
                                        <span className={`${isSidebarOpen ? 'relative' : 'absolute top-2 right-2'} min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm`}>
                                            {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 text-xs ${!isSidebarOpen && 'justify-center'}`}>
                        {isSidebarOpen ? (
                            <span>&copy; 2026 Auction Platform</span>
                        ) : (
                            <span>&copy;</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                            >
                                <span className="text-2xl"><FaBars /></span>
                            </button>
                            {/* <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Welcome to Dashboard
                                </h1>
                                <p className="text-gray-600">Manage your auction platform efficiently</p>
                                {!userVerified && (
                                    <div className="mt-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center animate-slideDown gap-4">
                                        <div>
                                            <p className="font-bold">Check your email</p>
                                            <p className="text-sm">Please verify your email address to unlock full bidding limits.</p>
                                        </div>
                                        <button onClick={() => { setUserVerified(true); alert("Verification email sent!"); }} className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-600 whitespace-nowrap">
                                            Resend Email
                                        </button>
                                    </div>
                                )}
                            </div> */}
                        </div>
                        <div className="flex items-center gap-4 self-end md:self-auto">
                            <div className="flex items-center gap-3 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-semibold text-gray-700 hidden sm:block">
                                    {user?.name || t('common.user')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-fadeIn">
                    {renderContent()}
                </div>
            </div>

            {/* Animation Styles */}
            {/* Animation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}} />
        </div>
    );
};

export default Dashboard;
