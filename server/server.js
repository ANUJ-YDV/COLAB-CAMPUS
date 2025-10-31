import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/user.js';
import Project from './models/project.js';
import Message from './models/message.js';
import Conversation from './models/conversation.js';
import Document from './models/document.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { setIO } from './controllers/taskController.js';
// createMessage available for future use
import { testS3 } from './utils/s3.js';

dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Environment variables loaded:');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓ Loaded' : '✗ Missing');
console.log('PORT:', process.env.PORT || 'Using default 5000');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('AWS_REGION:', process.env.AWS_REGION ? '✓ Loaded' : '✗ Missing');
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME ? '✓ Loaded' : '✗ Missing');

// Test S3 Connection on startup
testS3();

const app = express();

// Configure CORS with environment variable
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect Auth Routes
app.use('/api/auth', authRoutes);

// Connect Project Routes
app.use('/api/projects', projectRoutes);

// Connect Task Routes
app.use('/api/tasks', taskRoutes);

// Connect Message Routes
app.use('/api/messages', messageRoutes);

// Connect Conversation Routes
app.use('/api/conversations', conversationRoutes);

// Connect Upload Routes (S3 Presigned URLs)
app.use('/api/upload', uploadRoutes);

// Connect GitHub Routes (Repository Integration)
app.use('/api/github', githubRoutes);

// Connect Document Routes (Collaborative Editing)
app.use('/api/documents', documentRoutes);

// Health check endpoint for deployment platforms
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running successfully!' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, data: 'This is your first API endpoint.' });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Create HTTP server and attach Socket.io
const httpServer = http.createServer(app);

// Configure Socket.io
const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  // Optional: add pingInterval/pingTimeout for heartbeat control
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Attach Socket.io instance to task controller for real-time broadcasting
setIO(io);

// --- PRESENCE TRACKING ---
// Map of userId -> { socketId, user, rooms: Set }
const onlineUsers = new Map();
// Map of roomId -> Set of userIds currently typing
const typingUsers = new Map();

// --- Socket.io auth middleware ---
io.use(async (socket, next) => {
  try {
    // Client sends token in socket.handshake.auth (not query string)
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new Error('User not found');

    // Attach user to socket for handlers to use
    socket.user = user;
    next();
  } catch (err) {
    console.log('❌ Socket auth error:', err.message);
    // This will send 'connect_error' event to client with the message
    next(new Error('Unauthorized'));
  }
});

// --- Connection handler ---
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user.email}`);

  // Send a welcome event
  socket.emit('welcome', { message: 'Connected to CollabCampus socket server' });

  // --- PRESENCE: User comes online ---
  const userId = socket.user._id.toString();
  onlineUsers.set(userId, {
    socketId: socket.id,
    user: {
      id: userId,
      name: socket.user.name,
      email: socket.user.email,
      username: socket.user.username || socket.user.email.split('@')[0],
    },
    rooms: new Set(),
    connectedAt: new Date(),
  });

  // Broadcast updated online users list to everyone
  const onlineUsersList = Array.from(onlineUsers.values()).map((u) => u.user);
  io.emit('online-users', onlineUsersList);
  console.log(`🟢 User online: ${socket.user.name} (${onlineUsersList.length} users online)`);

  // --- JOIN PROJECT ROOM ---
  socket.on('join_project', async ({ projectId }) => {
    try {
      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        console.log(`❌ Project not found: ${projectId}`);
        return socket.emit('error_message', { message: 'Project not found' });
      }

      // Verify user is a member of the project
      const isMember = project.members.some(
        (memberId) => memberId.toString() === socket.user._id.toString()
      );

      if (!isMember) {
        console.log(
          `❌ Access denied: ${socket.user.email} is not a member of project ${projectId}`
        );
        return socket.emit('error_message', { message: 'Access denied to this project' });
      }

      // Join the project room
      socket.join(projectId);

      // Track room membership for presence
      const userId = socket.user._id.toString();
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).rooms.add(projectId);
      }

      console.log(`✅ ${socket.user.name} joined project ${projectId}`);

      // Confirm to the user
      socket.emit('joined_project', { projectId, projectName: project.name });

      // Send chat history to this user only
      const messages = await Message.find({ project: projectId })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 }); // Oldest first (chronological)

      socket.emit('chat_history', messages);
      console.log(`📜 Sent ${messages.length} chat messages to ${socket.user.name}`);

      // Inform other members in the room
      socket.to(projectId).emit('user_joined', {
        user: socket.user.name,
        userId: socket.user._id,
        email: socket.user.email,
      });
    } catch (err) {
      console.error('❌ join_project error:', err);
      socket.emit('error_message', { message: 'Unable to join project' });
    }
  });

  // --- LEAVE PROJECT ROOM ---
  socket.on('leave_project', ({ projectId }) => {
    socket.leave(projectId);

    // Remove room from user's tracked rooms
    const userId = socket.user._id.toString();
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).rooms.delete(projectId);
    }

    console.log(`🚪 ${socket.user.email} left project room: ${projectId}`);

    // Inform other members
    socket.to(projectId).emit('user_left', {
      user: socket.user.name,
      userId: socket.user._id,
    });
  });

  // --- JOIN GLOBAL ROOM ---
  socket.on('join_global', async () => {
    try {
      // Find or create global conversation
      let convo = await Conversation.findOne({ type: 'global' });
      if (!convo) {
        convo = await Conversation.create({
          type: 'global',
          name: 'Global Chat',
          participants: [],
        });
      }

      const convoId = convo._id.toString();
      socket.join(convoId);
      console.log(`🌍 ${socket.user.email} joined global chat: ${convoId}`);

      // Fetch and send chat history
      const msgs = await Message.find({ conversation: convo._id })
        .populate('sender', 'name username email')
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit('chat_history', msgs);
    } catch (err) {
      console.error('❌ join_global error:', err);
      socket.emit('error_message', { message: 'Failed to join global chat' });
    }
  });

  // --- JOIN DM ROOM ---
  socket.on('join_dm', async ({ userId }) => {
    try {
      const me = socket.user._id;

      // Find or create DM between me and userId
      let convo = await Conversation.findOne({
        type: 'dm',
        participants: { $all: [me, userId] },
      });

      if (!convo) {
        convo = await Conversation.create({
          type: 'dm',
          participants: [me, userId],
        });
      }

      const convoId = convo._id.toString();
      socket.join(convoId);
      console.log(`💬 ${socket.user.email} joined DM with user ${userId}: ${convoId}`);

      // Fetch and send chat history
      const msgs = await Message.find({ conversation: convo._id })
        .populate('sender', 'name username email')
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit('chat_history', msgs);
    } catch (err) {
      console.error('❌ join_dm error:', err);
      socket.emit('error_message', { message: 'Failed to join DM' });
    }
  });

  // --- SEND MESSAGE (Global / DM) ---
  socket.on('send_message', async ({ convoId, content }) => {
    try {
      if (!content?.trim()) {
        return socket.emit('error_message', { message: 'Message content is required' });
      }

      if (content.length > 2000) {
        return socket.emit('error_message', {
          message: 'Message is too long (max 2000 characters)',
        });
      }

      // Create message
      const newMsg = await Message.create({
        conversation: convoId,
        sender: socket.user._id,
        content: content.trim(),
      });

      // Populate sender details
      await newMsg.populate('sender', 'name username email');

      console.log(`� ${socket.user.email} sent message in conversation ${convoId}`);

      // Broadcast to all users in the conversation room (including sender)
      io.to(convoId).emit('receive_message', newMsg);
    } catch (err) {
      console.error('❌ send_message error:', err);
      socket.emit('error_message', { message: 'Unable to send message' });
    }
  });

  // --- SEND CHAT MESSAGE ---
  socket.on('send_message', async ({ projectId, content }) => {
    try {
      if (!content || content.trim().length === 0) {
        return socket.emit('error_message', { message: 'Message content is required' });
      }

      if (content.length > 2000) {
        return socket.emit('error_message', {
          message: 'Message is too long (max 2000 characters)',
        });
      }

      // Verify user is in the project room
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(projectId)) {
        return socket.emit('error_message', { message: 'You must join the project first' });
      }

      // Save message to database
      const newMsg = await Message.create({
        project: projectId,
        sender: socket.user._id,
        content: content.trim(),
      });

      // Populate sender details
      await newMsg.populate('sender', 'name email');

      console.log(`💬 ${socket.user.name} sent message in project ${projectId}`);

      // Broadcast to all users in the project room (including sender)
      io.to(projectId).emit('receive_message', newMsg);
    } catch (err) {
      console.error('❌ send_message error:', err);
      socket.emit('error_message', { message: 'Unable to send message' });
    }
  });

  // --- TYPING INDICATOR: User starts typing ---
  socket.on('typing', ({ roomId }) => {
    if (!roomId) return;

    const userId = socket.user._id.toString();

    // Initialize typing users set for this room if not exists
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Set());
    }

    // Add user to typing set
    typingUsers.get(roomId).add(userId);

    // Broadcast to others in the room (not to sender)
    socket.to(roomId).emit('user-typing', {
      userId,
      userName: socket.user.name,
      roomId,
    });

    console.log(`⌨️  ${socket.user.name} is typing in room ${roomId}`);
  });

  // --- TYPING INDICATOR: User stops typing ---
  socket.on('stop-typing', ({ roomId }) => {
    if (!roomId) return;

    const userId = socket.user._id.toString();

    // Remove user from typing set
    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId).delete(userId);

      // Clean up empty sets
      if (typingUsers.get(roomId).size === 0) {
        typingUsers.delete(roomId);
      }
    }

    // Broadcast to others in the room
    socket.to(roomId).emit('user-stop-typing', {
      userId,
      userName: socket.user.name,
      roomId,
    });

    console.log(`⏸️  ${socket.user.name} stopped typing in room ${roomId}`);
  });

  // --- GET TYPING USERS: Request current typing users in a room ---
  socket.on('get-typing-users', ({ roomId }) => {
    const typingInRoom = typingUsers.get(roomId);
    const typingUserIds = typingInRoom ? Array.from(typingInRoom) : [];

    // Get user details for each typing user
    const typingUserDetails = typingUserIds
      .map((userId) => onlineUsers.get(userId)?.user)
      .filter(Boolean);

    socket.emit('typing-users-update', {
      roomId,
      users: typingUserDetails,
    });
  });

  // ===============================================
  // 📝 COLLABORATIVE DOCUMENT EDITING
  // ===============================================

  // --- JOIN DOCUMENT: Load document content for a project ---
  socket.on('join-document', async (projectId) => {
    try {
      console.log(`📄 ${socket.user.name} joining document for project ${projectId}`);

      // Verify project access
      const project = await Project.findById(projectId);
      if (!project) {
        return socket.emit('error_message', { message: 'Project not found' });
      }

      const isMember = project.members.some(
        (memberId) => memberId.toString() === socket.user._id.toString()
      );

      if (!isMember) {
        return socket.emit('error_message', { message: 'Access denied to this document' });
      }

      // Join the document room
      socket.join(`doc-${projectId}`);

      // Load or create document
      let document = await Document.findOne({ projectId });

      if (!document) {
        // Create new document if it doesn't exist
        document = await Document.create({
          projectId,
          title: `${project.name} - Notes`,
          content: '',
          lastEditedBy: socket.user._id,
        });
        console.log(`📝 Created new document for project ${projectId}`);
      }

      // Send document content to the user
      socket.emit('load-document', {
        content: document.content,
        title: document.title,
        version: document.version,
        lastUpdated: document.lastUpdated,
        lastEditedBy: document.lastEditedBy,
      });

      // Notify others in the room
      socket.to(`doc-${projectId}`).emit('user-joined-document', {
        userName: socket.user.name,
        userId: socket.user._id,
      });

      console.log(`✅ ${socket.user.name} loaded document for project ${projectId}`);
    } catch (err) {
      console.error('❌ join-document error:', err);
      socket.emit('error_message', { message: 'Unable to load document' });
    }
  });

  // --- SEND CHANGES: Broadcast document changes to other users ---
  socket.on('send-changes', ({ projectId, delta }) => {
    try {
      // Broadcast changes to all other users in the document room
      socket.to(`doc-${projectId}`).emit('receive-changes', {
        delta,
        userId: socket.user._id,
        userName: socket.user.name,
        timestamp: new Date(),
      });

      console.log(`📝 ${socket.user.name} sent changes to document ${projectId}`);
    } catch (err) {
      console.error('❌ send-changes error:', err);
    }
  });

  // --- SAVE DOCUMENT: Persist document changes to database ---
  socket.on('save-document', async ({ projectId, content, title }) => {
    try {
      const document = await Document.findOneAndUpdate(
        { projectId },
        {
          content: content || '',
          title: title || 'Untitled Document',
          lastEditedBy: socket.user._id,
          lastUpdated: new Date(),
          $inc: { version: 1 }, // Increment version number
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
        }
      );

      console.log(`💾 Document saved for project ${projectId} (v${document.version})`);

      // Confirm save to the user
      socket.emit('document-saved', {
        success: true,
        version: document.version,
        lastUpdated: document.lastUpdated,
      });

      // Notify others in the room about the save
      socket.to(`doc-${projectId}`).emit('document-saved-by-other', {
        userName: socket.user.name,
        version: document.version,
        lastUpdated: document.lastUpdated,
      });
    } catch (err) {
      console.error('❌ save-document error:', err);
      socket.emit('document-saved', {
        success: false,
        error: 'Failed to save document',
      });
    }
  });

  // --- LEAVE DOCUMENT: User leaves document room ---
  socket.on('leave-document', (projectId) => {
    socket.leave(`doc-${projectId}`);

    // Notify others
    socket.to(`doc-${projectId}`).emit('user-left-document', {
      userName: socket.user.name,
      userId: socket.user._id,
    });

    console.log(`📄 ${socket.user.name} left document for project ${projectId}`);
  });

  // --- DOCUMENT CURSOR: Share cursor position (optional for advanced UX) ---
  socket.on('cursor-position', ({ projectId, position, selection }) => {
    socket.to(`doc-${projectId}`).emit('cursor-update', {
      userId: socket.user._id,
      userName: socket.user.name,
      position,
      selection,
    });
  });

  socket.on('disconnect', (reason) => {
    const userId = socket.user._id.toString();

    console.log(
      `🔌 Socket disconnected: ${socket.id} | User: ${socket.user.email} | Reason: ${reason}`
    );

    // --- PRESENCE: User goes offline ---
    onlineUsers.delete(userId);

    // Remove user from all typing indicators
    for (const [roomId, typingSet] of typingUsers.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);
        // Notify room that user stopped typing
        io.to(roomId).emit('user-stop-typing', {
          userId,
          userName: socket.user.name,
          roomId,
        });
      }
      // Clean up empty sets
      if (typingSet.size === 0) {
        typingUsers.delete(roomId);
      }
    }

    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsers.values()).map((u) => u.user);
    io.emit('online-users', onlineUsersList);
    console.log(`🔴 User offline: ${socket.user.name} (${onlineUsersList.length} users online)`);
  });
});

const PORT = process.env.PORT || 5000;

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
      // Listen using httpServer, not app
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server and Socket.io running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Mongo connection error:', err);
    });
}

// Export app for testing
export default app;
