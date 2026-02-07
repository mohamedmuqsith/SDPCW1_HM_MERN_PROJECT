import { io } from 'socket.io-client';

// Initialize Socket.io connection with robust options
const socket = io('http://localhost:5000', {
    transports: ['websocket'], // Enforce websocket to avoid polling 400 errors
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export default socket;
