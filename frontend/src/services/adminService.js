import api from './api';

export const adminService = {
    getAuditLogs: async () => {
        const response = await api.get('/admin/audit-logs');
        return response.data;
    },
    pauseAuction: async (auctionId, reason) => {
        const response = await api.put(`/admin/auctions/${auctionId}/pause`, { reason });
        return response.data;
    },
    cancelAuction: async (auctionId, reason) => {
        const response = await api.put(`/admin/auctions/${auctionId}/cancel`, { reason });
        return response.data;
    },
};
