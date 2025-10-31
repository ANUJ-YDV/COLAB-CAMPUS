# 🔒 Socket.io Security & Production Best Practices

**Date:** October 29, 2025  
**Project:** CollabCampus  
**Status:** ✅ Implemented

---

## ✅ Current Security Implementation

### **1. Token Authentication**
- ✅ Token sent via `socket.handshake.auth.token` (NOT query string)
- ✅ JWT verification in `io.use()` middleware
- ✅ User document attached to `socket.user`
- ✅ Password excluded from socket.user (`.select("-password")`)
- ✅ Invalid tokens rejected with "Unauthorized" error

### **2. CORS Configuration**
- ✅ Specific origin allowed: `process.env.CLIENT_ORIGIN`
- ✅ Credentials enabled for cookie support
- ✅ Limited HTTP methods: GET, POST, PUT, DELETE

### **3. Connection Management**
- ✅ Heartbeat configured (ping every 25s, timeout 20s)
- ✅ Automatic disconnect detection
- ✅ User context available in all handlers

---

## 🚨 Security Considerations

### **1. Token Handling (CRITICAL)**

#### **✅ What We're Doing Right:**
```javascript
// ✅ GOOD: Token in auth object
const socket = io(SERVER, {
  auth: { token }
});
```

#### **❌ What to AVOID:**
```javascript
// ❌ BAD: Token in query string (leaks in logs!)
const socket = io(SERVER + "?token=" + token);

// ❌ BAD: Token in headers (not supported by Socket.io)
const socket = io(SERVER, {
  extraHeaders: { Authorization: token }
});
```

**Why?** Query strings appear in:
- Server logs
- Proxy logs
- Browser history
- Referrer headers

---

### **2. Token Expiration & Refresh**

#### **Problem:** JWT tokens expire (typically 1h - 24h)

#### **Current Behavior:**
```javascript
// When token expires:
io.use() → jwt.verify() → throws error → next(new Error("Unauthorized"))
Client receives: connect_error event with "Unauthorized" message
```

#### **Solution: Implement Token Refresh Flow**

**Client-side handling:**
```javascript
// In client/src/socket.js
socket.on("connect_error", async (err) => {
  console.error("❌ Socket connection error:", err.message);
  
  if (err.message === "Unauthorized") {
    console.log("🔄 Token expired, attempting refresh...");
    
    try {
      // Call refresh token endpoint
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: localStorage.getItem('refreshToken')
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Update socket auth and reconnect
      socket.auth = { token };
      socket.connect();
      
      console.log("✅ Token refreshed, reconnecting...");
    } catch (refreshError) {
      console.error("❌ Token refresh failed, logging out");
      // Force logout
      localStorage.clear();
      window.location.href = '/login';
    }
  }
});
```

**Server-side refresh endpoint (to be implemented):**
```javascript
// server/routes/authRoutes.js
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) throw new Error("User not found");
    
    // Generate new access token
    const newToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});
```

---

### **3. CORS Security**

#### **Current Setup:**
```javascript
cors: {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}
```

#### **Production Hardening:**

**Update `.env` for production:**
```env
# Development
CLIENT_ORIGIN=http://localhost:3000

# Production
CLIENT_ORIGIN=https://your-production-domain.com
```

**Multiple origins (if needed):**
```javascript
cors: {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-production-domain.com',
      'https://staging.your-domain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}
```

---

### **4. Rate Limiting & Connection Limits**

#### **Problem:** Users can spam connections or events

#### **Solution: Add Rate Limiting**

**Install package:**
```bash
npm install socket.io-rate-limit
```

**Implement rate limiting:**
```javascript
import rateLimit from 'socket.io-rate-limit';

// Limit connections per IP
io.use(rateLimit({
  tokensPerInterval: 5,      // 5 connections
  interval: 60000,            // Per 60 seconds
  fireImmediately: true
}));

// Limit events per socket
io.on("connection", (socket) => {
  // Limit task_moved events
  const taskMoveLimit = rateLimit({
    tokensPerInterval: 10,    // 10 events
    interval: 10000,          // Per 10 seconds
  });
  
  socket.on("task_moved", taskMoveLimit((data) => {
    // Handle task move
  }));
});
```

---

### **5. Event Validation (CRITICAL)**

#### **Problem:** Never trust client payloads

#### **Current Risk:**
```javascript
// ❌ DANGEROUS: No validation
socket.on("task_moved", async (data) => {
  await Task.updateOne({ _id: data.taskId }, { status: data.newStatus });
});
```

#### **Solution: Validate Everything**

```javascript
// ✅ SAFE: Validate and verify permissions
socket.on("task_moved", async (data) => {
  try {
    // 1. Validate payload structure
    if (!data.taskId || !data.newStatus || !data.projectId) {
      return socket.emit('error', { message: 'Invalid data' });
    }
    
    // 2. Validate status value
    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(data.newStatus)) {
      return socket.emit('error', { message: 'Invalid status' });
    }
    
    // 3. Check user has permission
    const project = await Project.findById(data.projectId);
    if (!project) {
      return socket.emit('error', { message: 'Project not found' });
    }
    
    const isMember = project.members.some(
      m => m.toString() === socket.user._id.toString()
    );
    
    if (!isMember) {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    
    // 4. Validate task belongs to project
    const task = await Task.findById(data.taskId);
    if (!task || task.project.toString() !== data.projectId) {
      return socket.emit('error', { message: 'Task not found' });
    }
    
    // 5. NOW it's safe to update
    task.status = data.newStatus;
    await task.save();
    
    // 6. Broadcast to room
    io.to(`project_${data.projectId}`).emit('task_updated', {
      taskId: task._id,
      newStatus: task.status,
    });
    
  } catch (err) {
    console.error('Error in task_moved:', err);
    socket.emit('error', { message: 'Server error' });
  }
});
```

---

### **6. HTTPS/WSS in Production**

#### **Development:**
```
http://localhost:5000  → ws://localhost:5000
```

#### **Production:**
```
https://your-domain.com → wss://your-domain.com
```

#### **Nginx Configuration (for WSS):**

```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # REST API
  location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
  }

  # WebSocket upgrade
  location /socket.io {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

### **7. Environment-Specific Configuration**

**Update `server/.env`:**
```env
# Development
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=mySuperSecretKey123
REFRESH_TOKEN_SECRET=myRefreshSecret456

# Production (use environment-specific values)
NODE_ENV=production
CLIENT_ORIGIN=https://your-production-domain.com
JWT_SECRET=<strong-random-secret-use-crypto.randomBytes(64).toString('hex')>
REFRESH_TOKEN_SECRET=<another-strong-random-secret>
```

**Use environment checks:**
```javascript
const isProduction = process.env.NODE_ENV === 'production';

const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  // Production-specific settings
  ...(isProduction && {
    transports: ['websocket', 'polling'], // Allow fallback in prod
    allowEIO3: true, // Compatibility
  }),
});
```

---

## 📋 Security Checklist

### **Authentication & Authorization**
- [x] Token sent via `handshake.auth` (not query string)
- [x] JWT verified in middleware
- [x] User attached to socket
- [ ] Token refresh flow implemented
- [ ] Refresh token rotation
- [x] Password excluded from socket.user

### **Connection Security**
- [x] CORS configured with specific origin
- [ ] Multiple origins validated (if needed)
- [ ] Rate limiting on connections
- [ ] Rate limiting on events
- [x] Heartbeat configured

### **Data Validation**
- [ ] All event payloads validated
- [ ] User permissions checked for each action
- [ ] Input sanitization
- [ ] SQL/NoSQL injection prevention

### **Production Readiness**
- [ ] HTTPS/WSS enabled
- [ ] Strong JWT secrets (64+ chars)
- [ ] Environment variables secured
- [ ] Nginx/proxy configured for WebSocket
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (without tokens!)

### **Monitoring & Limits**
- [ ] Connection limits per user
- [ ] Connection limits per IP
- [ ] Event rate limiting
- [ ] Memory leak detection
- [ ] Socket connection monitoring

---

## 🚨 Common Security Mistakes to Avoid

| Mistake | Impact | Solution |
|---------|--------|----------|
| Token in query string | Leaks in logs | Use `handshake.auth` |
| No event validation | Data corruption, unauthorized access | Validate all payloads |
| No rate limiting | DoS attacks | Implement socket.io-rate-limit |
| Trusting client data | Security breach | Always verify permissions |
| Generic error messages | Security risk | Log details server-side only |
| No token expiration | Stolen tokens valid forever | Use short-lived tokens + refresh |
| HTTP in production | Man-in-the-middle attacks | Always use HTTPS/WSS |

---

## 📊 Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong random JWT secrets
- [ ] Configure HTTPS/WSS
- [ ] Set up Nginx/reverse proxy
- [ ] Enable rate limiting
- [ ] Implement token refresh
- [ ] Add error monitoring (Sentry, etc.)
- [ ] Configure logging (Winston, etc.)
- [ ] Set up health checks
- [ ] Test with production-like load

---

**🔒 Security is an ongoing process. Review and update these measures regularly!**
