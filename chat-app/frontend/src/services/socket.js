import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
    auth: { token: localStorage.getItem('chatly_token') },
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
}
