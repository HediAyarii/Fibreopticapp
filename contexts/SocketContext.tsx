'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialiser la connexion Socket.IO en utilisant l'origine courante
    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    console.log('🔌 Connexion Socket.IO à:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connecté:', socketInstance.id);
      setIsConnected(true);
      
      // Authentifier si utilisateur connecté
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.id) {
            socketInstance.emit('authenticate', { employeeId: user.id });
          }
        } catch (error) {
          console.error('Erreur parsing user:', error);
        }
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO déconnecté');
      setIsConnected(false);
    });

    socketInstance.on('authenticated', (data) => {
      console.log('✅ Authentifié Socket.IO:', data);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error.message);
      setIsConnected(false);
    });

    // Écouter TOUS les événements pour debug
    socketInstance.onAny((eventName, ...args) => {
      console.log(`🔔 [Socket.IO Event] ${eventName}:`, args);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
