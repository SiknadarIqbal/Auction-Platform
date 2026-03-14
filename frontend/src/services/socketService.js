import io from "socket.io-client";

let socket;

export const connectSocket = () => {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

    socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      secure: socketUrl.startsWith('https'),
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  return socket;
};

export const joinAuctionRoom = (auctionId) => {
  const socket = getSocket();

  const joinRoom = () => {
    socket.emit('join_auction', auctionId);
  };

  if (socket.connected) {
    joinRoom();
  } else {
    socket.once('connect', joinRoom);
  }
};

export const leaveAuctionRoom = (auctionId) => {
  const socket = getSocket();

  const leaveRoom = () => {
    socket.emit('leave_auction', auctionId);
  };

  if (socket.connected) {
    leaveRoom();
  } else {
    socket.once('connect', leaveRoom);
  }
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