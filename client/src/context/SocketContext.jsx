import { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from '../api/axios';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (user) {
            const newSocket = io(API_BASE_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });
            
            newSocket.on('connect', () => {
                setIsConnected(true);
                newSocket.emit('join', user._id);
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        } else {
            setSocket(null);
            setIsConnected(false);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
