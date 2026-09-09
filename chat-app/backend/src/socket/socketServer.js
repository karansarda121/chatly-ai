import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import Chat from '../models/Chat.js';
import User from '../models/User.js';

function roomName(chatId) {
  return `chat:${chatId}`;
}

async function isChatMember(chatId, userId) {
  if (!mongoose.isObjectIdOrHexString(chatId)) return false;
  return Boolean(await Chat.exists({ _id: chatId, 'members.user': userId }));
}

export function configureSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || !process.env.JWT_SECRET) return next(new Error('Authentication is required.'));

      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(userId);
      if (!user || user.isSystemBot) return next(new Error('Your session is no longer valid.'));

      socket.data.userId = user._id.toString();
      return next();
    } catch {
      return next(new Error('Your session is invalid or has expired.'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      // Every connected user has a private room. This lets us deliver a new
      // message even when they are looking at another chat in the sidebar.
      socket.join(`user:${socket.data.userId}`);

      // Use an atomic update: the same person can connect from multiple tabs
      // at once, and loading/saving the document would cause VersionError.
      const previousUser = await User.findByIdAndUpdate(
        socket.data.userId,
        { $addToSet: { socketIds: socket.id }, $set: { isOnline: true } },
        { new: false, projection: '_id isOnline' },
      );
      if (previousUser && !previousUser.isOnline) {
        socket.broadcast.emit('user:presence', { userId: previousUser._id, isOnline: true });
      }
    } catch (error) {
      console.error('Could not update online presence:', error.message);
      socket.disconnect(true);
      return;
    }

    socket.on('chat:join', async ({ chatId }, acknowledge) => {
      const joined = await isChatMember(chatId, socket.data.userId);
      if (joined) socket.join(roomName(chatId));
      if (typeof acknowledge === 'function') acknowledge({ joined });
    });

    socket.on('chat:leave', ({ chatId }) => socket.leave(roomName(chatId)));

    socket.on('typing:start', async ({ chatId }) => {
      if (await isChatMember(chatId, socket.data.userId)) {
        socket.to(roomName(chatId)).emit('typing:start', { chatId, userId: socket.data.userId });
      }
    });

    socket.on('typing:stop', async ({ chatId }) => {
      if (await isChatMember(chatId, socket.data.userId)) {
        socket.to(roomName(chatId)).emit('typing:stop', { chatId, userId: socket.data.userId });
      }
    });

    socket.on('disconnect', async () => {
      try {
        // First remove only this socket. A conditional second update prevents
        // an older tab disconnecting from marking a newly connected tab offline.
        const user = await User.findByIdAndUpdate(
          socket.data.userId,
          { $pull: { socketIds: socket.id } },
          { new: true, projection: '_id socketIds' },
        );
        if (!user || user.socketIds.length > 0) return;

        const offlineUpdate = await User.updateOne(
          { _id: user._id, socketIds: { $size: 0 } },
          { $set: { isOnline: false, lastSeen: new Date() } },
        );
        if (offlineUpdate.modifiedCount > 0) {
          socket.broadcast.emit('user:presence', { userId: user._id, isOnline: false });
        }
      } catch (error) {
        console.error('Could not update offline presence:', error.message);
      }
    });
  });

  return io;
}
