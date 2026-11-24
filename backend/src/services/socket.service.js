import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerCallHandlers, startCallSweeper } from './call.service.js';

let io = null;

/** Attaches Socket.io to the HTTP server. Each user joins a private room "user:<id>". */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL?.split(',') || true },
  });

  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(id).select('fullName role isActive');
      if (!user?.isActive) return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { _id, role } = socket.user;
    socket.join(`user:${_id}`);
    socket.join(`role:${role}`);

    // Typing indicator for chat (not persisted)
    socket.on('chat:typing', ({ to }) => {
      if (to) io.to(`user:${to}`).emit('chat:typing', { from: String(_id) });
    });

    // Video consultation signaling
    registerCallHandlers(io, socket);
  });

  startCallSweeper(io);
  return io;
}

/** The Socket.io server, or null when sockets are not running (tests, seed). */
export const getIO = () => io;

/** Sends an event to every open tab of one user. Safe to call when sockets are not running (tests, seed). */
export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
