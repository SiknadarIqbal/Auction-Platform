import io from 'socket.io-client';

let socket;

export const connectSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return connectSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinAuctionRoom = (auctionId) => {
    const socket = getSocket();
    socket.emit('join_auction', auctionId);
};

export const leaveAuctionRoom = (auctionId) => {
    const socket = getSocket();
    socket.emit('leave_auction', auctionId);
};
