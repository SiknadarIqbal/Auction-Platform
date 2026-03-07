import api from './api';

export const auctionService = {
    // Get all auctions with filters
    getAllAuctions: async (params) => {
        const response = await api.get('/auctions', { params });
        return response.data;
    },

    // Get single auction
    getAuction: async (id) => {
        const response = await api.get(`/auctions/${id}`);
        return response.data;
    },

    // Create auction
    createAuction: async (formData) => {
        const response = await api.post('/auctions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get seller's auctions
    getMyAuctions: async () => {
        const response = await api.get('/auctions/user/my-auctions');
        return response.data;
    },

    // Get won auctions
    getWonAuctions: async () => {
        const response = await api.get('/auctions/user/won');
        return response.data;
    },

    // Get homepage stats
    getHomepageStats: async () => {
        const response = await api.get('/stats');
        return response.data;
    },

    // Update auction
    updateAuction: async (id, formData) => {
        const response = await api.put(`/auctions/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete auction
    deleteAuction: async (id) => {
        const response = await api.delete(`/auctions/${id}`);
        return response.data;
    },

    // Toggle watch (requires auth)
    toggleWatch: async (auctionId) => {
        const response = await api.put(`/auctions/${auctionId}/watch`);
        return response.data;
    }
};
