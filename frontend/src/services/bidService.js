import api from './api';

export const bidService = {
    // Place bid
    placeBid: async (auctionId, bidAmount) => {
        const response = await api.post('/bids', { auctionId, bidAmount });
        return response.data;
    },

    // Buy Now
    buyNow: async (auctionId) => {
        const response = await api.post('/bids/buy-now', { auctionId });
        return response.data;
    },

    // Get bid history for auction
    getBidHistory: async (auctionId) => {
        const response = await api.get(`/bids/auction/${auctionId}`);
        return response.data;
    },

    // Get user's bids
    getMyBids: async () => {
        const response = await api.get('/bids/my-bids');
        return response.data;
    }
};
