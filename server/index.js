import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import env from './src/config/env.js';

const PORT = env.port;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// In-memory message store: Map<roomId, Message[]>
const rooms = new Map();

const getRoom = (roomId) => {
  if (!rooms.has(roomId)) rooms.set(roomId, []);
  return rooms.get(roomId);
};

io.on('connection', (socket) => {
  // User joins their personal room
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    const history = getRoom(roomId);
    socket.emit('message_history', history);
  });

  // Admin joins any room to monitor/reply
  socket.on('admin_join_room', ({ roomId }) => {
    socket.join(roomId);
    const history = getRoom(roomId);
    socket.emit('message_history', history);
  });

  // Get list of all active rooms (for admin panel)
  socket.on('get_rooms', () => {
    const list = [];
    for (const [roomId, messages] of rooms.entries()) {
      if (messages.length === 0) continue;
      const last = messages[messages.length - 1];
      list.push({ roomId, lastMessage: last, count: messages.length });
    }
    socket.emit('room_list', list);
  });

  // Send a message
  socket.on('send_message', ({ roomId, message }) => {
    const history = getRoom(roomId);
    history.push(message);
    io.to(roomId).emit('new_message', message);

    if (roomId.startsWith('user:')) {
      io.to('admin_room').emit('new_message', { ...message, roomId });
      io.to('admin_room').emit('rooms_updated', {
        roomId,
        lastMessage: message,
        count: history.length,
      });
    }
  });

  // Admin listens for all room updates
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    const list = [];
    for (const [roomId, messages] of rooms.entries()) {
      if (messages.length === 0) continue;
      const last = messages[messages.length - 1];
      list.push({ roomId, lastMessage: last, count: messages.length });
    }
    socket.emit('room_list', list);
  });

  // Video call signaling
  socket.on('video_call_offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('video_call_offer', { offer });
  });

  socket.on('video_call_answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('video_call_answer', { answer });
  });

  socket.on('video_call_ice', ({ roomId, candidate }) => {
    socket.to(roomId).emit('video_call_ice', { candidate });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
