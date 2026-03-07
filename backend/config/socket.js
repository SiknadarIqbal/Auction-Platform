import { Server } from 'socket.io';

let io;

const configureSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        // Join auction room
        socket.on('join_auction', (auctionId) => {
            socket.join(`auction_${auctionId}`);
            console.log(`User ${socket.id} joined auction ${auctionId}`);
        });

        // Leave auction room
        socket.on('leave_auction', (auctionId) => {
            socket.leave(`auction_${auctionId}`);
            console.log(`User ${socket.id} left auction ${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });

    console.log('✅ Socket.IO configured');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

export { configureSocket, getIO };
