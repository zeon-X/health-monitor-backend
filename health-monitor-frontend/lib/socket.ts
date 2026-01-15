// WebSocket client for real-time updates
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
    if (!socket) {
        socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });
    }

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default { initializeSocket, getSocket, disconnectSocket };
