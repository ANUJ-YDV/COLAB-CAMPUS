# ✅ Socket.io Client Integration - Complete Guide

**Date:** October 29, 2025  
**Status:** ✅ Ready for Integration

---

## 📦 Installation Complete

```bash
✅ socket.io-client@4.8.1 installed in client/
✅ socket.io installed in server/
```

---

## 📁 Files Created

### **Core Files**
1. **`client/src/socket.js`** - Socket connection utility
2. **`client/src/SocketContext.jsx`** - React Context Provider for socket

### **Example Files (for reference)**
3. **`client/src/pages/Login.example.jsx`** - Login with real API + socket
4. **`client/src/pages/ProjectBoard.example.jsx`** - Board with socket events
5. **`client/src/App.example.jsx`** - App wrapped with SocketProvider

---

## 🚀 Quick Start Guide

### **Step 1: Basic Socket Connection**

Use the `createSocket` function when you have a token:

```javascript
import { createSocket } from './socket';

// After login, when you have a JWT token
const token = localStorage.getItem('token');
const socket = createSocket(token);

// Socket is now connected and ready to use
socket.emit('join_project', { projectId: '123' });
```

### **Step 2: Using Socket Context (Recommended)**

Wrap your app with `SocketProvider` to access socket anywhere:

```javascript
// In App.jsx or index.js
import { SocketProvider } from './SocketContext';

<SocketProvider>
  <YourApp />
</SocketProvider>
```

Then in any component:

```javascript
import { useSocket } from './SocketContext';

function MyComponent() {
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('some_event', { data: 'value' });
      
      socket.on('response_event', (data) => {
        console.log('Received:', data);
      });

      return () => {
        socket.off('response_event');
      };
    }
  }, [socket]);

  return <div>My Component</div>;
}
```

---

## 📋 Socket Connection Flow

### **Client Side (React)**

```javascript
// 1. User logs in
const response = await axios.post('/api/auth/login', { email, password });
const { token } = response.data;

// 2. Store token
localStorage.setItem('token', token);

// 3. Create socket connection
const socket = createSocket(token);

// 4. Socket connects to server
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// 5. Server validates token and sends welcome
socket.on('welcome', (data) => {
  console.log(data.message);
});
```

### **Server Side (Already Configured)**

```javascript
// Server validates JWT in io.use() middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  socket.user = user; // ✅ User attached to socket
  next();
});

// Connection established
io.on('connection', (socket) => {
  console.log(`User ${socket.user.email} connected`);
  socket.emit('welcome', { message: 'Connected!' });
});
```

---

## 🎯 Integration Steps

### **Option A: Simple Integration (Direct)**

1. **Login Component** - Create socket after successful login:

```javascript
// In Login.jsx
import { createSocket } from '../socket';

const handleLogin = async () => {
  const { token } = await loginAPI(email, password);
  localStorage.setItem('token', token);
  
  // Create socket connection
  const socket = createSocket(token);
  
  navigate('/dashboard');
};
```

### **Option B: Advanced Integration (Context)**

1. **Wrap App with SocketProvider:**

```javascript
// In App.jsx
import { SocketProvider } from './SocketContext';

<SocketProvider>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/project/:id" element={<ProjectBoard />} />
  </Routes>
</SocketProvider>
```

2. **Use socket in any component:**

```javascript
// In ProjectBoard.jsx
import { useSocket } from '../SocketContext';

function ProjectBoard() {
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('join_project', { projectId });
      
      socket.on('task_updated', handleTaskUpdate);
      
      return () => socket.off('task_updated');
    }
  }, [socket]);
}
```

---

## 📡 Socket Events Reference

### **Events to Emit (Client → Server)**

```javascript
// Join a project room
socket.emit('join_project', { projectId: '123' });

// Leave a project room
socket.emit('leave_project', { projectId: '123' });

// Notify about task move
socket.emit('task_moved', {
  taskId: '456',
  oldStatus: 'todo',
  newStatus: 'in-progress',
  projectId: '123'
});
```

### **Events to Listen (Server → Client)**

```javascript
// Connection established
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Welcome message from server
socket.on('welcome', (data) => {
  console.log(data.message);
});

// Another user moved a task
socket.on('task_updated', (data) => {
  console.log('Task updated:', data);
  // Update UI with new task status
});

// Connection error (invalid token, etc.)
socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

---

## 🔧 Configuration

### **Environment Variables**

Create `.env` in `client/` directory:

```env
REACT_APP_SERVER_URL=http://localhost:5000
```

In production:
```env
REACT_APP_SERVER_URL=https://your-production-server.com
```

### **Socket Options**

Customize in `client/src/socket.js`:

```javascript
const socket = io(SERVER, {
  auth: { token },
  transports: ["websocket", "polling"], // Fallback to polling
  reconnection: true,                    // Auto-reconnect
  reconnectionDelay: 1000,               // Wait 1s before reconnect
  reconnectionAttempts: 5,               // Try 5 times
});
```

---

## 🧪 Testing the Connection

### **Test 1: Check Connection in Browser Console**

1. Login to your app
2. Open browser DevTools Console
3. Look for:
   ```
   ✅ Socket connected: abc123xyz
   📩 Server message: Connected to CollabCampus socket server
   ```

### **Test 2: Emit and Listen to Events**

In browser console:

```javascript
// Assuming socket is in global scope or accessible
const socket = window.socket; // If you expose it

// Emit an event
socket.emit('join_project', { projectId: '1' });

// Listen for response
socket.on('project_joined', (data) => console.log(data));
```

### **Test 3: Check Server Logs**

Server console should show:
```
✅ Socket connected: abc123xyz | User: user@example.com
```

---

## 🐛 Troubleshooting

### **Problem: Socket not connecting**

**Solution:**
- Check token exists: `localStorage.getItem('token')`
- Verify token is valid (not 'mock-token')
- Ensure server is running on port 5000
- Check browser console for `connect_error` events

### **Problem: "Unauthorized" error**

**Solution:**
- Token might be expired or invalid
- Verify `JWT_SECRET` matches between server and token generation
- Re-login to get a fresh token

### **Problem: Events not received**

**Solution:**
- Ensure you're listening to the event before it's emitted
- Check event names match exactly (case-sensitive)
- Verify socket is connected: `socket.connected === true`

### **Problem: Multiple connections**

**Solution:**
- Don't create multiple socket instances
- Use SocketContext to share one instance
- Clean up with `socket.disconnect()` on unmount

---

## ✅ Checklist

- [x] `socket.io-client` installed in client
- [x] `socket.io` installed in server
- [x] `client/src/socket.js` created
- [x] `client/src/SocketContext.jsx` created
- [x] Example files created for reference
- [ ] Wrap App with SocketProvider (optional)
- [ ] Update Login to create socket connection
- [ ] Update ProjectBoard to emit/listen events
- [ ] Test connection in browser
- [ ] Implement real-time features (join_project, task_moved, etc.)

---

## 🎯 Next Steps

1. **Choose Integration Method:**
   - Simple: Use `createSocket()` directly after login
   - Advanced: Use `SocketProvider` + `useSocket()` hook

2. **Update Login Component:**
   - Use example from `Login.example.jsx`
   - Replace mock login with real API call
   - Create socket connection after successful login

3. **Update ProjectBoard Component:**
   - Use example from `ProjectBoard.example.jsx`
   - Emit `join_project` on mount
   - Listen for `task_updated` events
   - Emit `task_moved` when user drags tasks

4. **Implement Server-Side Events:**
   - Handle `join_project` event (Step 3.2)
   - Handle `task_moved` event (Step 3.3)
   - Broadcast to room members

---

## 📚 Resources

- **Socket.io Client Docs:** https://socket.io/docs/v4/client-api/
- **Server Code:** `server/server.js` (already configured)
- **Quick Reference:** `SOCKET_QUICK_REFERENCE.md`

---

**🎉 Client-side Socket.io integration is ready! Choose your integration method and start building real-time features.**
