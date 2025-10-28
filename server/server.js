import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
import Project from "./models/project.js";
import Message from "./models/message.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { setIO } from "./controllers/taskController.js";
import { createMessage } from "./controllers/messageController.js";

dotenv.config();

console.log("Environment variables loaded:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Loaded" : "✗ Missing");
console.log("PORT:", process.env.PORT || "Using default 5000");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Loaded" : "✗ Missing");

const app = express();

app.use(cors());
app.use(express.json());

// Connect Auth Routes
app.use("/api/auth", authRoutes);

// Connect Project Routes
app.use("/api/projects", projectRoutes);

// Connect Task Routes
app.use("/api/tasks", taskRoutes);

// Connect Message Routes
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running successfully!" });
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, data: "This is your first API endpoint." });
});

// Create HTTP server and attach Socket.io
const httpServer = http.createServer(app);

// Configure Socket.io
const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  // Optional: add pingInterval/pingTimeout for heartbeat control
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Attach Socket.io instance to task controller for real-time broadcasting
setIO(io);

// --- Socket.io auth middleware ---
io.use(async (socket, next) => {
  try {
    // Client sends token in socket.handshake.auth (not query string)
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw new Error("User not found");

    // Attach user to socket for handlers to use
    socket.user = user;
    next();
  } catch (err) {
    console.log("❌ Socket auth error:", err.message);
    // This will send 'connect_error' event to client with the message
    next(new Error("Unauthorized"));
  }
});

// --- Connection handler ---
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user.email}`);

  // Send a welcome event
  socket.emit("welcome", { message: "Connected to CollabCampus socket server" });

  // --- JOIN PROJECT ROOM ---
  socket.on("join_project", async ({ projectId }) => {
    try {
      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        console.log(`❌ Project not found: ${projectId}`);
        return socket.emit("error_message", { message: "Project not found" });
      }

      // Verify user is a member of the project
      const isMember = project.members.some(
        (memberId) => memberId.toString() === socket.user._id.toString()
      );

      if (!isMember) {
        console.log(`❌ Access denied: ${socket.user.email} is not a member of project ${projectId}`);
        return socket.emit("error_message", { message: "Access denied to this project" });
      }

      // Join the project room
      socket.join(projectId);
      console.log(`✅ ${socket.user.name} joined project ${projectId}`);

      // Confirm to the user
      socket.emit("joined_project", { projectId, projectName: project.name });

      // Send chat history to this user only
      const messages = await Message.find({ project: projectId })
        .populate("sender", "name email")
        .sort({ createdAt: 1 }); // Oldest first (chronological)
      
      socket.emit("chat_history", messages);
      console.log(`📜 Sent ${messages.length} chat messages to ${socket.user.name}`);

      // Inform other members in the room
      socket.to(projectId).emit("user_joined", {
        user: socket.user.name,
        userId: socket.user._id,
        email: socket.user.email,
      });
    } catch (err) {
      console.error("❌ join_project error:", err);
      socket.emit("error_message", { message: "Unable to join project" });
    }
  });

  // --- LEAVE PROJECT ROOM ---
  socket.on("leave_project", ({ projectId }) => {
    socket.leave(projectId);
    console.log(`🚪 ${socket.user.email} left project room: ${projectId}`);

    // Inform other members
    socket.to(projectId).emit("user_left", {
      user: socket.user.name,
      userId: socket.user._id,
    });
  });

  // --- SEND CHAT MESSAGE ---
  socket.on("send_message", async ({ projectId, content }) => {
    try {
      if (!content || content.trim().length === 0) {
        return socket.emit("error_message", { message: "Message content is required" });
      }

      if (content.length > 2000) {
        return socket.emit("error_message", { message: "Message is too long (max 2000 characters)" });
      }

      // Verify user is in the project room
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(projectId)) {
        return socket.emit("error_message", { message: "You must join the project first" });
      }

      // Save message to database
      const newMsg = await Message.create({
        project: projectId,
        sender: socket.user._id,
        content: content.trim()
      });

      // Populate sender details
      await newMsg.populate("sender", "name email");

      console.log(`💬 ${socket.user.name} sent message in project ${projectId}`);

      // Broadcast to all users in the project room (including sender)
      io.to(projectId).emit("receive_message", newMsg);

    } catch (err) {
      console.error("❌ send_message error:", err);
      socket.emit("error_message", { message: "Unable to send message" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} | User: ${socket.user.email} | Reason: ${reason}`);
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    // Listen using httpServer, not app
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server and Socket.io running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Mongo connection error:", err);
  });
