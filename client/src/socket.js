import { io } from 'socket.io-client';

// Initialize Socket.io connection with robust options
const socket = io('http://localhost:5000', {
    transports: ['websocket'], // Force WebSocket to avoid polling issues
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export default socket;
