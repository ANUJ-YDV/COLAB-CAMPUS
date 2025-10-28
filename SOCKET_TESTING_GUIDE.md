# 🧪 Socket.io Testing Guide - Complete Verification

**Date:** October 29, 2025  
**Project:** CollabCampus  
**Status:** Ready for Testing

---

## 📋 Testing Checklist

### **Phase 1: Server Startup** ✅
- [ ] Server starts without errors
- [ ] MongoDB connects successfully
- [ ] Socket.io initializes on port 5000
- [ ] Environment variables loaded

### **Phase 2: Client Connection** 🔌
- [ ] Valid token connects successfully
- [ ] Invalid token rejected with error
- [ ] Missing token rejected
- [ ] Welcome message received
- [ ] Socket ID assigned

### **Phase 3: Multi-User Testing** 👥
- [ ] Two users connect simultaneously
- [ ] Events broadcast to correct users
- [ ] Users can join/leave rooms
- [ ] No cross-contamination between projects

### **Phase 4: Error Handling** ⚠️
- [ ] Token expiration handled
- [ ] Network disconnect/reconnect works
- [ ] Server restart recovery
- [ ] Invalid event payloads rejected

---

## 🚀 Basic Testing Steps

### **Step 1: Start the Server**

```bash
cd server
npm start
```

**Expected Output:**
```
Environment variables loaded:
MONGO_URI: ✓ Loaded
PORT: 5000
JWT_SECRET: ✓ Loaded
✅ MongoDB connected
🚀 Server and Socket.io running on port 5000
```

✅ **Verification:** Server running without errors

---

### **Step 2: Get a Valid Token**

**Option A: Use existing test script**
```bash
cd server
node get-test-token.js
```

**Option B: Login via API**
```bash
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{email="test@example.com"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

**Option C: Use Postman/Thunder Client**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

✅ **Verification:** You have a JWT token string

---

### **Step 3: Test Socket Connection (Browser Console)**

1. **Start React app:**
```bash
cd client
npm start
```

2. **Open browser console** (F12)

3. **Create socket connection:**
```javascript
// Paste this in browser console
import { io } from 'socket.io-client';

const token = localStorage.getItem('token'); // Or paste your token
const socket = io('http://localhost:5000', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('welcome', (data) => {
  console.log('📩', data.message);
});

socket.on('connect_error', (err) => {
  console.error('❌', err.message);
});
```

**Expected Browser Console:**
```
✅ Connected: abc123xyz
📩 Connected to CollabCampus socket server
```

**Expected Server Console:**
```
✅ Socket connected: abc123xyz | User: test@example.com
```

✅ **Verification:** Socket connects successfully

---

### **Step 4: Test Invalid Token**

**In browser console:**
```javascript
const badSocket = io('http://localhost:5000', {
  auth: { token: 'invalid-token-xyz' }
});

badSocket.on('connect', () => {
  console.log('❌ Should NOT connect!');
});

badSocket.on('connect_error', (err) => {
  console.log('✅ Correctly rejected:', err.message);
});
```

**Expected Browser Console:**
```
✅ Correctly rejected: Unauthorized
```

**Expected Server Console:**
```
❌ Socket auth error: jwt malformed
```

✅ **Verification:** Invalid tokens rejected

---

### **Step 5: Test No Token**

**In browser console:**
```javascript
const noTokenSocket = io('http://localhost:5000', {
  auth: {} // No token
});

noTokenSocket.on('connect_error', (err) => {
  console.log('✅ No token rejected:', err.message);
});
```

**Expected:**
```
✅ No token rejected: Unauthorized
```

**Server:**
```
❌ Socket auth error: No token provided
```

✅ **Verification:** Missing tokens rejected

---

### **Step 6: Test Using Test Script**

**Update `server/test-socket-connection.js`** with your token:
```javascript
const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Paste real token
```

**Run:**
```bash
cd server
node test-socket-connection.js
```

**Expected Output:**
```
🧪 Testing Socket.io Connection with JWT Auth

📡 Test 1: Connecting with valid token...
✅ Test 1 PASSED: Connected with socket ID: abc123xyz
📩 Welcome message received: Connected to CollabCampus socket server
🔌 Disconnecting from server...
✅ Test 1: Disconnected successfully. Reason: client namespace disconnect

📡 Test 2: Connecting WITHOUT token (should fail)...
✅ Test 2 PASSED: Connection rejected as expected
   Error message: Unauthorized

📡 Test 3: Connecting with INVALID token (should fail)...
✅ Test 3 PASSED: Invalid token rejected as expected
   Error message: Unauthorized

🎉 All tests passed! Socket.io auth is working correctly.
```

✅ **Verification:** All automated tests pass

---

## 👥 Multi-User Testing

### **Setup: Two Browser Sessions**

1. **User 1:** Chrome (normal window)
   - Login as `user1@example.com`
   - Token stored in localStorage

2. **User 2:** Chrome (incognito window)
   - Login as `user2@example.com`
   - Token stored in incognito localStorage

### **Test Scenario: Both Users Connect**

**User 1 Console:**
```javascript
const socket1 = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

socket1.on('connect', () => {
  console.log('User 1 connected:', socket1.id);
});
```

**User 2 Console (Incognito):**
```javascript
const socket2 = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

socket2.on('connect', () => {
  console.log('User 2 connected:', socket2.id);
});
```

**Server Console Should Show:**
```
✅ Socket connected: abc123 | User: user1@example.com
✅ Socket connected: xyz789 | User: user2@example.com
```

✅ **Verification:** Multiple users can connect simultaneously

---

## 🎯 Advanced Testing Scenarios

### **Test 1: Reconnection After Network Loss**

**Simulate network disconnect:**
```javascript
// In browser console
socket.disconnect();
console.log('Manually disconnected');

// Reconnect after 3 seconds
setTimeout(() => {
  socket.connect();
  console.log('Reconnecting...');
}, 3000);
```

**Expected:**
```
Manually disconnected
🔌 Socket disconnected: abc123 | Reason: client namespace disconnect

... 3 seconds later ...
Reconnecting...
✅ Socket connected: abc123 | User: test@example.com
```

---

### **Test 2: Server Restart Recovery**

1. **Connect from browser**
2. **Restart server:** Stop and start `npm start`
3. **Check browser console**

**Expected:**
```
❌ Socket connection error: io server disconnect
🔄 Attempting to reconnect...
✅ Connected: new-socket-id-here
```

---

### **Test 3: Token Expiration Simulation**

**Manually expire a token:**
```javascript
// Create token with 5 second expiration
import jwt from 'jsonwebtoken';

const shortToken = jwt.sign(
  { id: 'user-id-here' },
  process.env.JWT_SECRET,
  { expiresIn: '5s' }
);

// Connect with short token
const socket = io('http://localhost:5000', {
  auth: { token: shortToken }
});

// Should connect initially
socket.on('connect', () => console.log('Connected'));

// Wait 10 seconds, then try to reconnect
setTimeout(() => {
  socket.disconnect();
  socket.connect(); // Should fail with expired token
}, 10000);
```

---

## 📊 Testing Checklist Summary

### **Server Side**
- [x] Server starts on port 5000
- [x] MongoDB connection successful
- [x] Socket.io initialized
- [x] JWT middleware active
- [x] User authentication working
- [x] Connection logs show user email
- [x] Disconnect logs show reason

### **Client Side**
- [ ] Valid token connects
- [ ] Invalid token rejected
- [ ] No token rejected
- [ ] Welcome message received
- [ ] Socket ID assigned
- [ ] Reconnection works
- [ ] Multiple instances possible

### **Security**
- [ ] Tokens not in URL
- [ ] Tokens in handshake.auth
- [ ] Password excluded from socket.user
- [ ] CORS enforced
- [ ] Invalid tokens logged but not exposed

### **Error Handling**
- [ ] connect_error event fires
- [ ] Network disconnect handled
- [ ] Server restart recovery
- [ ] Token expiration detected

---

## 🐛 Common Testing Issues

### **Issue 1: "Socket not connecting"**

**Symptoms:**
```
❌ Socket connection error: timeout
```

**Solutions:**
1. Check server is running: `netstat -ano | findstr :5000`
2. Verify token exists: `localStorage.getItem('token')`
3. Check CORS origin matches
4. Ensure firewall not blocking port 5000

---

### **Issue 2: "Unauthorized" error**

**Symptoms:**
```
❌ Socket connection error: Unauthorized
```

**Solutions:**
1. Verify token is valid (not 'mock-token')
2. Check JWT_SECRET matches between login and socket
3. Token might be expired - get a fresh one
4. User might be deleted from database

---

### **Issue 3: "Cannot read property 'email' of null"**

**Symptoms:**
```
Server crashes: Cannot read property 'email' of null
```

**Solutions:**
1. User not found in database
2. Check User model import is correct
3. Verify `.select("-password")` works
4. Database connection might be down

---

## 📝 Test Results Template

Use this to document your tests:

```markdown
## Test Results - [Date]

### Environment
- Server: Running on port 5000 ✅
- Database: MongoDB connected ✅
- Client: React app on port 3000 ✅

### Connection Tests
- [✅] Valid token connects
- [✅] Invalid token rejected
- [✅] No token rejected
- [✅] Welcome message received
- [✅] Socket ID assigned

### Multi-User Tests
- [✅] Two users connect simultaneously
- [✅] Each user has unique socket ID
- [✅] Server logs both connections

### Error Handling
- [✅] Network disconnect/reconnect works
- [✅] Server restart recovery works
- [ ] Token expiration handling (not yet implemented)

### Performance
- Connection time: ~50ms
- Memory usage: Normal
- No memory leaks detected

### Notes
- All tests passed
- Ready for integration with project rooms
```

---

## 🎉 Success Criteria

**You should be able to:**
1. ✅ Start server without errors
2. ✅ Connect with valid JWT token
3. ✅ See user email in server logs
4. ✅ Receive welcome message
5. ✅ Get rejected with invalid token
6. ✅ Connect multiple users simultaneously
7. ✅ Reconnect after disconnect
8. ✅ Handle server restarts gracefully

---

**Next Step:** Once all tests pass, proceed to implementing project rooms (Step 3.2)!
