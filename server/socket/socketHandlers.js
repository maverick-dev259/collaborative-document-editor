const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Document = require('../models/Document');

// Track active users per document room
const activeUsers = new Map(); // documentId -> Map(socketId -> { user, cursor })

const setupSocketHandlers = (io) => {
  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    /**
     * JOIN DOCUMENT ROOM
     * Client sends: { documentId }
     * Server: joins room, broadcasts user-joined, sends active users list
     */
    socket.on('join-document', async ({ documentId }) => {
      try {
        // Verify user has access to this document
        const document = await Document.findById(documentId);
        if (!document) return;

        const isOwner =
          document.owner.toString() === socket.user._id.toString();
        const isCollaborator = document.collaborators.some(
          (c) => c.user.toString() === socket.user._id.toString()
        );

        if (!isOwner && !isCollaborator) return;

        const room = `document:${documentId}`;
        socket.join(room);
        socket.currentRoom = room;
        socket.currentDocumentId = documentId;

        // Track active user
        if (!activeUsers.has(documentId)) {
          activeUsers.set(documentId, new Map());
        }
        activeUsers.get(documentId).set(socket.id, {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar,
          cursor: null,
        });

        // Send current active users to the joining user
        const usersInRoom = Array.from(activeUsers.get(documentId).values());
        socket.emit('active-users', usersInRoom);

        // Notify others that a new user joined
        socket.to(room).emit('user-joined', {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar,
        });

        console.log(`${socket.user.name} joined room ${room}`);
      } catch (error) {
        console.error('Error joining document:', error.message);
      }
    });

    /**
     * LEAVE DOCUMENT ROOM
     */
    socket.on('leave-document', ({ documentId }) => {
      const room = `document:${documentId}`;
      socket.leave(room);

      // Remove from active users
      if (activeUsers.has(documentId)) {
        activeUsers.get(documentId).delete(socket.id);
        if (activeUsers.get(documentId).size === 0) {
          activeUsers.delete(documentId);
        }
      }

      // Notify others
      socket.to(room).emit('user-left', {
        _id: socket.user._id,
        name: socket.user.name,
      });

      socket.currentRoom = null;
      socket.currentDocumentId = null;
    });

    /**
     * DOCUMENT CHANGE
     * Client sends: { documentId, content }
     * Server: broadcasts to others in the room (NOT back to sender)
     */
    socket.on('document-change', ({ documentId, content }) => {
      const room = `document:${documentId}`;
      socket.to(room).emit('document-updated', {
        content,
        userId: socket.user._id,
      });
    });

    /**
     * SAVE DOCUMENT
     * Client sends: { documentId, content, title }
     * Server: saves to DB, confirms back
     */
    socket.on('save-document', async ({ documentId, content, title }) => {
      try {
        const update = {};
        if (content !== undefined) update.content = content;
        if (title !== undefined) update.title = title;

        await Document.findByIdAndUpdate(documentId, update);

        // Confirm save to the sender
        socket.emit('document-saved', { documentId });

        // Notify room
        socket.to(`document:${documentId}`).emit('document-saved', { documentId });
      } catch (error) {
        socket.emit('save-error', { message: 'Failed to save document' });
      }
    });

    /**
     * CURSOR MOVE
     * Client sends: { documentId, cursor: { from, to } }
     * Server: broadcasts to others
     */
    socket.on('cursor-move', ({ documentId, cursor }) => {
      const room = `document:${documentId}`;

      // Update stored cursor
      if (activeUsers.has(documentId) && activeUsers.get(documentId).has(socket.id)) {
        activeUsers.get(documentId).get(socket.id).cursor = cursor;
      }

      socket.to(room).emit('cursor-updated', {
        userId: socket.user._id,
        userName: socket.user.name,
        cursor,
      });
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);

      if (socket.currentDocumentId) {
        const documentId = socket.currentDocumentId;
        const room = `document:${documentId}`;

        // Remove from active users
        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.id);
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
          }
        }

        // Notify others
        socket.to(room).emit('user-left', {
          _id: socket.user._id,
          name: socket.user.name,
        });
      }
    });
  });
};

module.exports = { setupSocketHandlers };
