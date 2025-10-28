# Socket.io Client - Integration Checklist

## ✅ Installation & Setup (Complete)
- [x] Install `socket.io-client` in client
- [x] Install `socket.io` in server  
- [x] Create `client/src/socket.js`
- [x] Create `client/src/SocketContext.jsx`
- [x] Create example files for reference

---

## 📝 Next Steps (Your Tasks)

### Step 1: Choose Integration Method
- [ ] **Option A:** Simple - Use `createSocket(token)` directly after login
- [ ] **Option B:** Advanced - Use `SocketProvider` + `useSocket()` hook

### Step 2: Update Login Component
- [ ] Replace mock login with real API call to `/api/auth/login`
- [ ] Store JWT token in localStorage
- [ ] Create socket connection after successful login
- [ ] Reference: `client/src/pages/Login.example.jsx`

### Step 3: Wrap App (If using Option B)
- [ ] Import `SocketProvider` in `App.jsx`
- [ ] Wrap routes with `<SocketProvider>`
- [ ] Reference: `client/src/App.example.jsx`

### Step 4: Update ProjectBoard
- [ ] Import `useSocket` hook
- [ ] Emit `join_project` event on mount
- [ ] Listen for `task_updated` events from other users
- [ ] Emit `task_moved` event when dragging tasks
- [ ] Clean up socket listeners on unmount
- [ ] Reference: `client/src/pages/ProjectBoard.example.jsx`

### Step 5: Testing
- [ ] Start server: `cd server && npm start`
- [ ] Start client: `cd client && npm start`
- [ ] Login with real credentials
- [ ] Check browser console for connection messages
- [ ] Verify server logs show socket connection
- [ ] Test drag-and-drop with socket events

---

## 🎯 Quick Usage Examples

### Using Socket Directly (Option A)
```javascript
import { createSocket } from './socket';

// After login
const token = localStorage.getItem('token');
const socket = createSocket(token);

// Use socket
socket.emit('join_project', { projectId: '123' });
```

### Using Socket Context (Option B)
```javascript
import { useSocket } from './SocketContext';

function MyComponent() {
  const socket = useSocket();
  
  useEffect(() => {
    if (socket) {
      socket.on('some_event', handleEvent);
      return () => socket.off('some_event');
    }
  }, [socket]);
}
```

---

## 🧪 Testing Checklist

### Browser Console Tests
- [ ] See "✅ Socket connected: [socket-id]"
- [ ] See "📩 Server message: Connected to CollabCampus"
- [ ] No "connect_error" messages
- [ ] Socket reconnects after server restart

### Server Console Tests  
- [ ] See "✅ Socket connected: [socket-id] | User: [email]"
- [ ] See user join/leave project events
- [ ] See task_moved events logged

### Functional Tests
- [ ] Login creates socket connection
- [ ] Logout disconnects socket
- [ ] Drag task emits `task_moved` event
- [ ] Other users see task updates in real-time
- [ ] Reconnects automatically after network issues

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `client/src/socket.js` | Socket connection utility |
| `client/src/SocketContext.jsx` | React Context for socket |
| `client/src/pages/Login.example.jsx` | Login with socket example |
| `client/src/pages/ProjectBoard.example.jsx` | Board with socket events |
| `CLIENT_SOCKET_INTEGRATION.md` | Complete documentation |
| `SOCKET_QUICK_REFERENCE.md` | Quick reference guide |

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Socket not connecting | Check token is valid (not 'mock-token') |
| "Unauthorized" error | Re-login to get fresh JWT token |
| Events not received | Verify event names match exactly |
| Multiple connections | Use SocketContext, don't create multiple instances |

---

## ✅ When You're Done

You should have:
- ✅ Real login that gets JWT token from server
- ✅ Socket connection established after login  
- ✅ Socket available in components via context or direct reference
- ✅ Events emitted when user interacts (join_project, task_moved)
- ✅ Events listened to for real-time updates from other users
- ✅ Clean socket disconnection on logout

---

**Next Phase:** Server-side event handlers (join_project, task_moved, etc.)
