// CampusPulse Backend Socket.IO Service
import { Server } from 'socket.io';
import { readDb, writeDb } from '../database/db.js';

let io = null;
const onlineUsers = new Map(); // userId -> socket.id

export function initSocket(server, corsOrigin) {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Register user presence
    socket.on('register', (userId) => {
      const uId = parseInt(userId);
      if (!uId) return;
      socket.userId = uId;
      onlineUsers.set(uId, socket.id);
      
      socket.join(`user-${uId}`);
      console.log(`User registered: ${uId} on socket: ${socket.id} (joined room user-${uId})`);
      
      // Auto-join rooms for active conversations
      try {
        const db = readDb();
        const directConvos = db.participants ? db.participants.filter(p => p.userId === uId).map(p => p.conversationId) : [];
        
        const joinedClubs = db.club_members
          ? db.club_members.filter(cm => cm.userId === uId).map(cm => cm.clubId)
          : db.users.find(u => u.id === uId)?.joinedClubs || [];
        const clubConvos = joinedClubs.map(cid => `club-${cid}`);
        
        const registeredEvents = db.registrations
          ? db.registrations.filter(r => r.userId === uId && r.registrationStatus === 'registered').map(r => r.eventId)
          : [];
        const eventConvos = registeredEvents.map(eid => `event-${eid}`);
        
        const allConvos = [...directConvos, ...clubConvos, ...eventConvos, `ai-${uId}`];
        allConvos.forEach(convoId => {
          socket.join(`convo-${convoId}`);
          console.log(`Socket ${socket.id} auto-joined convo-${convoId}`);
        });
      } catch (err) {
        console.error('Error auto-joining socket rooms:', err);
      }

      // Notify everyone this user is online
      io.emit('user-status', { userId: uId, status: 'online' });
    });

    // Join room for active conversation
    socket.on('join-room', (conversationId) => {
      socket.join(`convo-${conversationId}`);
      console.log(`Socket ${socket.id} joined room convo-${conversationId}`);
    });

    // Leave room
    socket.on('leave-room', (conversationId) => {
      socket.leave(`convo-${conversationId}`);
      console.log(`Socket ${socket.id} left room convo-${conversationId}`);
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
      socket.to(`convo-${conversationId}`).emit('typing', { conversationId, userId, userName, isTyping });
    });

    // Mark messages as read in real time
    socket.on('mark-read', ({ conversationId, userId }) => {
      const convoId = conversationId;
      const readerId = parseInt(userId);
      
      try {
        const db = readDb();
        let changed = false;
        
        db.messages.forEach(msg => {
          if (msg.conversationId === convoId && msg.senderId !== readerId && !msg.isRead) {
            msg.isRead = true;
            msg.readStatus = 'read';
            changed = true;
          }
        });
        
        if (changed) {
          writeDb(db);
          // Broadcast message status update
          io.to(`convo-${convoId}`).emit('messages-read', { conversationId: convoId, readerId });
        }
      } catch (err) {
        console.error('Error marking messages read in socket:', err);
      }
    });

    // Query online status
    socket.on('get-user-status', (userId) => {
      const uId = parseInt(userId);
      const isOnline = onlineUsers.has(uId);
      socket.emit('user-status', { userId: uId, status: isOnline ? 'online' : 'offline' });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // Notify everyone this user is offline
        io.emit('user-status', { userId: socket.userId, status: 'offline' });
      }
    });
  });

  return io;
}

export function getIo() {
  return io;
}

export function isUserOnline(userId) {
  return onlineUsers.has(parseInt(userId));
}

export function getUserSocketId(userId) {
  return onlineUsers.get(parseInt(userId));
}
