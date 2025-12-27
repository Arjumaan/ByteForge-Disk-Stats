import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useWebSocket() {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const subscribe = useCallback((event, callback) => {
        if (!socketRef.current) return;
        socketRef.current.on(event, callback);
        return () => socketRef.current.off(event, callback);
    }, []);

    return { isConnected, socket: socketRef.current, subscribe };
}
