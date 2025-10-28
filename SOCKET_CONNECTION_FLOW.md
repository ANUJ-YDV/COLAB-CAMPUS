# Socket.io Connection Flow - Visual Guide

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SERVER SOCKET FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

📱 CLIENT (React)                          🖥️  SERVER (Node.js/Express)
─────────────────                          ──────────────────────────


1️⃣ USER LOGS IN
┌──────────────┐
│ POST /login  │────────────────────────►  ┌────────────────────┐
│ {email, pwd} │                           │ Verify credentials │
└──────────────┘                           │ Generate JWT       │
                                           └────────────────────┘
        ◄───────────────────────────────────────┘
        { token: "eyJhbG...", user: {...} }


2️⃣ STORE TOKEN & CREATE SOCKET
┌──────────────────────┐
│ localStorage.setItem │
│ ("token", token)     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ createSocket(token)  │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ io(SERVER, {         │───────────────────►  ┌──────────────────┐
│   auth: { token }    │  WebSocket Handshake │ io.use(middleware)│
│ })                   │                      └──────────────────┘
└──────────────────────┘                               │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ jwt.verify(token)    │
                                            │ User.findById(...)   │
                                            │ socket.user = user   │
                                            └──────────────────────┘
                                                       │
        ◄───────────────────────────────────────────────┘
        ✅ Connection Established
        socket.id = "abc123xyz"


3️⃣ WELCOME & INITIAL SETUP
        ◄───────────────────────────────────────────────┐
        event: "welcome"                    ┌───────────────────┐
        { message: "Connected!" }           │ socket.emit       │
                                            │ ("welcome", {...})│
                                            └───────────────────┘


4️⃣ JOIN PROJECT ROOM
┌──────────────────────┐
│ socket.emit(         │────────────────────►  ┌──────────────────┐
│ "join_project",      │                       │ socket.join      │
│ { projectId: "123" } │                       │ (`project_123`)  │
└──────────────────────┘                       └──────────────────┘
                                                       │
        ◄───────────────────────────────────────────────┘
        event: "project_joined"
        { projectId: "123", members: [...] }


5️⃣ DRAG & DROP TASK (Real-time Update)
┌──────────────────────┐
│ User drags task      │
│ from "todo" to       │
│ "in-progress"        │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ PUT /api/tasks/:id   │────────────────────►  ┌──────────────────┐
│ { status: "in-prog" }│                       │ Update in DB     │
└──────────────────────┘                       └──────────────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────────┐                      ┌──────────────────┐
│ socket.emit(         │────────────────────► │ io.to('project_  │
│ "task_moved",        │                      │ 123').emit(      │
│ { taskId, status })  │                      │ "task_updated")  │
└──────────────────────┘                      └──────────────────┘
                                                       │
        ◄───────────────────────────────────────────────┘
        event: "task_updated" (broadcast to all users)
        { taskId: "456", newStatus: "in-progress" }


6️⃣ OTHER USERS RECEIVE UPDATE
👤 User 2's Browser                        👤 User 3's Browser
┌──────────────────────┐                  ┌──────────────────────┐
│ socket.on(           │                  │ socket.on(           │
│ "task_updated",      │                  │ "task_updated",      │
│ (data) => {          │                  │ (data) => {          │
│   updateUI(data)     │                  │   updateUI(data)     │
│ })                   │                  │ })                   │
└──────────────────────┘                  └──────────────────────┘
         │                                         │
         ▼                                         ▼
   ✅ UI Updates                            ✅ UI Updates
   Task moves in real-time              Task moves in real-time


7️⃣ USER LOGS OUT
┌──────────────────────┐
│ socket.disconnect()  │────────────────────►  ┌──────────────────┐
│                      │                       │ socket.on(       │
│ localStorage.clear() │                       │ "disconnect")    │
└──────────────────────┘                       └──────────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Remove from rooms    │
                                            │ Clean up listeners   │
                                            └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         KEY CONCEPTS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ 🔑 JWT Token: Sent in socket.handshake.auth.token                   │
│                                                                      │
│ 👤 socket.user: User document attached after JWT validation         │
│                                                                      │
│ 🏠 Rooms: Group sockets by project (io.to('project_123'))           │
│                                                                      │
│ 📡 Emit: Send event to server (socket.emit)                         │
│                                                                      │
│ 📩 Listen: Receive events from server (socket.on)                   │
│                                                                      │
│ 📢 Broadcast: Send to all users in room (io.to(room).emit)          │
│                                                                      │
│ 🔄 Real-time: Changes propagate instantly to all connected users    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      EVENT NAMING CONVENTION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Client → Server (Actions)                                           │
│   • join_project                                                    │
│   • leave_project                                                   │
│   • task_moved                                                      │
│   • send_message                                                    │
│                                                                      │
│ Server → Client (Notifications)                                     │
│   • welcome                                                         │
│   • project_joined                                                  │
│   • task_updated                                                    │
│   • new_message                                                     │
│   • user_joined                                                     │
│   • user_left                                                       │
│                                                                      │
│ Bidirectional (System Events)                                       │
│   • connect                                                         │
│   • disconnect                                                      │
│   • connect_error                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

1. **Authentication First**: Socket connects AFTER login with JWT token
2. **Rooms for Isolation**: Each project is a separate room
3. **Broadcast Pattern**: One user's action → All users see update
4. **Optimistic UI**: Update local state immediately, then sync with server
5. **Clean Disconnection**: Always cleanup listeners and leave rooms

---

## 📊 Event Flow Summary

| Step | Client Action | Server Response | Result |
|------|--------------|-----------------|--------|
| Login | POST /login | JWT token | Store token |
| Connect | io(server, {auth}) | Validate JWT | socket.user set |
| Join | emit('join_project') | socket.join(room) | User in room |
| Update | emit('task_moved') | io.to(room).emit | All users notified |
| Receive | on('task_updated') | - | Update UI |
| Logout | disconnect() | Remove from rooms | Clean state |

---

**This diagram shows the complete lifecycle of a socket connection in your CollabCampus app!**
