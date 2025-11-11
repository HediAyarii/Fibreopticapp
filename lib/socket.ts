import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export type SocketServer = SocketIOServer;

let io: SocketIOServer | undefined;

export const initSocketServer = (httpServer: NetServer): SocketIOServer => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
      path: '/api/socketio',
    });

    io.on('connection', (socket) => {
      console.log('Client connecté:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
      });
    });

    console.log('✅ Socket.IO serveur initialisé');
  }

  return io;
};

export const getSocketServer = (): SocketIOServer | undefined => {
  return io;
};
