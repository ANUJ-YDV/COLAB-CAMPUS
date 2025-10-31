# 🚀 Socket.io Quick Reference - Step 3.1

## ✅ What Was Completed

### Server Setup (`server/server.js`)
```javascript
// 1. Created HTTP server
const httpServer = http.createServer(app);

// 2. Attached Socket.io with CORS
const io = new IOServer(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN },
  pingInterval: 25000,
  pingTimeout: 20000
});

// 3. JWT Auth Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");
  socket.user = user; // ✅ User available in all handlers
  next();
});

// 4. Connection Handler
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user.email}`);
  socket.emit("welcome", { message: "Connected to CollabCampus" });
  
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Disconnected: ${socket.id} | Reason: ${reason}`);
  });
});

// 5. Listen on HTTP server (not app!)
httpServer.listen(PORT, () => {
  console.log(`🚀 Server and Socket.io running on port ${PORT}`);
});
```

---

## 🧪 Testing Steps

### Step 1: Get a JWT Token
```bash
node server/get-test-token.js
```
This will attempt to login and give you a token to use.

### Step 2: Update Test File
Open `server/test-socket-connection.js` and paste your token:
```javascript
const VALID_TOKEN = "paste_your_jwt_here";
```

### Step 3: Run Tests
```bash
node server/test-socket-connection.js
```

Expected output:
```
✅ Test 1 PASSED: Connected with socket ID: abc123
📩 Welcome message received: Connected to CollabCampus socket server
✅ Test 1: Disconnected successfully
✅ Test 2 PASSED: Connection rejected as expected (no token)
✅ Test 3 PASSED: Invalid token rejected as expected
🎉 All tests passed!
```

---

## 📋 Server Logs to Watch For

### Successful Connection:
```
✅ Socket connected: abc123xyz | User: user@example.com
```

### Auth Errors:
```
❌ Socket auth error: No token provided
❌ Socket auth error: jwt malformed
❌ Socket auth error: User not found
```

### Disconnect:
```
🔌 Socket disconnected: abc123xyz | Reason: transport close
```

---

## 🔑 Key Points

1. **Token Location**: Client sends token in `socket.handshake.auth.token` (NOT headers or query)
2. **User Access**: Every socket handler has access to `socket.user` (the DB user document)
3. **Security**: Only authenticated users can connect
4. **CORS**: Configured for `http://localhost:3000` (React client)
5. **Single Port**: REST API and WebSocket on same port (5000)

---

## 📦 Client-Side Setup (Next Step)

Install in `client/` directory:
```bash
cd client
npm install socket.io-client
```

Connect from React:
```javascript
import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const socket = io("http://localhost:5000", {
  auth: { token }
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("welcome", (data) => {
  console.log(data.message);
});
```

---

## ⚡ Quick Commands

```bash
# Start server
cd server
npm start

# Get test token
node server/get-test-token.js

# Run socket tests
node server/test-socket-connection.js

# Check if server is running
netstat -ano | findstr :5000
```

---

## 🎯 Next Steps (Step 3.2)

- Implement `join_project` event
- Create project-specific rooms
- Broadcast to room members
- Handle `leave_project` event

---

**Status**: ✅ Server is running on port 5000 with Socket.io + JWT auth
