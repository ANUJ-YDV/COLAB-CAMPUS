# 🚀 Socket.io Client Integration Guide

## Overview
This guide explains how to use Socket.io for real-time features in your React application.

---

## ✅ What's Already Set Up

### 1. **Package Installed**
```bash
npm install socket.io-client  # ✅ Already installed
```

### 2. **Socket Context Provider**
Location: `client/src/SocketContext.jsx`

The `SocketProvider` manages:
- ✅ Automatic connection with JWT token
- ✅ Online users tracking (`onlineUsers` array)
- ✅ Typing indicators (`typingUsers` object)
- ✅ Connection error handling

### 3. **Custom Hooks**
- `client/src/hooks/useSocket.js` - Access socket, onlineUsers, typingUsers
- `client/src/hooks/useTypingIndicator.js` - Automatic typing detection with timeout

### 4. **Ready-to-Use Components**
- `OnlineUsers.jsx` - Display online users with green dots
- `TypingIndicator.jsx` - Show typing status with animated dots
- `ChatRoom.jsx` - Complete chat example (NEW)

---

## 📖 Quick Start Guide

### Step 1: Wrap Your App with SocketProvider

**File: `client/src/index.js` or `client/src/App.js`**

```jsx
import { SocketProvider } from './SocketContext';

function App() {
  return (
    <SocketProvider>
      {/* Your app components */}
      <YourRoutes />
    </SocketProvider>
  );
}
```

✅ This is likely already done in your app!

---

### Step 2: Use the Socket Hook in Any Component

```jsx
import { useSocket } from '../hooks/useSocket';

function MyComponent() {
  const { socket, onlineUsers, typingUsers } = useSocket();
  
  // socket - Socket.io client instance
  // onlineUsers - Array of online users: [{ userId, userName, email }]
  // typingUsers - Object: { roomId: [{ id, name }] }
  
  return (
    <div>
      <h2>{onlineUsers.length} users online</h2>
    </div>
  );
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Display Online Users

```jsx
import { useSocket } from '../hooks/useSocket';

function OnlineUsersList() {
  const { onlineUsers } = useSocket();
  
  return (
    <div className="p-4">
      <h3 className="font-bold mb-2">
        Online Users ({onlineUsers.length})
      </h3>
      <ul className="space-y-2">
        {onlineUsers.map((user) => (
          <li key={user.userId} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{user.userName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Use Case 2: Join a Chat Room

```jsx
import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

function ChatComponent({ projectId }) {
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Join the room
    socket.emit('join_project', projectId);
    
    // Listen for messages
    socket.on('receive_message', (message) => {
      console.log('New message:', message);
    });
    
    // Cleanup: leave room when component unmounts
    return () => {
      socket.emit('leave_project', projectId);
      socket.off('receive_message');
    };
  }, [socket, projectId]);
  
  return <div>Chat content here</div>;
}
```

---

### Use Case 3: Send Messages

```jsx
import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

function MessageInput({ projectId }) {
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  
  const sendMessage = () => {
    if (!socket || !message.trim()) return;
    
    socket.emit('send_message', {
      projectId: projectId,
      message: message.trim()
    });
    
    setMessage('');
  };
  
  return (
    <div className="flex space-x-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
        className="flex-1 border px-4 py-2 rounded"
      />
      <button 
        onClick={sendMessage}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Send
      </button>
    </div>
  );
}
```

---

### Use Case 4: Typing Indicator (Simple)

```jsx
import { useSocket } from '../hooks/useSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import TypingIndicator from './TypingIndicator';

function ChatInput({ roomId }) {
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  
  // Get typing handler - automatically manages typing state
  const handleTyping = useTypingIndicator(roomId);
  
  return (
    <div>
      {/* Show who's typing */}
      <TypingIndicator roomId={roomId} />
      
      {/* Input triggers typing indicator */}
      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping(); // ✨ Auto-detects typing
        }}
        placeholder="Type a message..."
        className="w-full border px-4 py-2 rounded"
      />
    </div>
  );
}
```

---

### Use Case 5: Manual Typing Control (Advanced)

```jsx
import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

function ManualTypingControl({ roomId }) {
  const { socket } = useSocket();
  let typingTimeout = null;
  
  const handleTyping = () => {
    if (!socket) return;
    
    // Emit typing event
    socket.emit('typing', { roomId });
    
    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Auto-stop typing after 2 seconds
    typingTimeout = setTimeout(() => {
      socket.emit('stop-typing', { roomId });
    }, 2000);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && typingTimeout) {
        socket.emit('stop-typing', { roomId });
        clearTimeout(typingTimeout);
      }
    };
  }, [socket, roomId]);
  
  return (
    <input
      type="text"
      onChange={handleTyping}
      placeholder="Type..."
    />
  );
}
```

---

## 🔌 Available Socket Events

### **Events You Can EMIT (Send to Server)**

| Event | Payload | Description |
|-------|---------|-------------|
| `join_project` | `projectId` (string) | Join a project room |
| `leave_project` | `projectId` (string) | Leave a project room |
| `send_message` | `{ projectId, message }` | Send a chat message |
| `typing` | `{ roomId }` | Notify others you're typing |
| `stop-typing` | `{ roomId }` | Stop typing notification |
| `join_global` | - | Join global chat |
| `join_dm` | `conversationId` (string) | Join DM conversation |

### **Events You Can LISTEN TO (Receive from Server)**

| Event | Payload | Description |
|-------|---------|-------------|
| `welcome` | `{ message }` | Connection successful |
| `online-users` | `[{ userId, userName, email }]` | List of online users |
| `chat_history` | `[messages]` | Chat history for room |
| `receive_message` | `{ message, user, timestamp }` | New message received |
| `user-typing` | `{ userId, userName, roomId }` | User started typing |
| `user-stop-typing` | `{ userId, roomId }` | User stopped typing |
| `connect_error` | `error` | Connection error |

---

## 📦 Component Architecture

```
App (Wrapped in SocketProvider)
├── SocketContext
│   ├── socket (Socket.io instance)
│   ├── onlineUsers (Array)
│   └── typingUsers (Object)
│
├── Dashboard
│   └── OnlineUsers (Shows online users)
│
├── ProjectChat
│   ├── TypingIndicator (Shows who's typing)
│   └── useTypingIndicator (Hook for auto-typing)
│
└── ChatRoom (Complete example)
    ├── Messages display
    ├── TypingIndicator
    ├── MessageInput with auto-typing
    └── Online users sidebar
```

---

## 🎨 UI Components Reference

### 1. **OnlineUsers Component**
```jsx
import OnlineUsers from '../components/OnlineUsers';

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h1>My App</h1>
      <OnlineUsers />  {/* Shows online users with green dots */}
    </div>
  );
}
```

### 2. **TypingIndicator Component**
```jsx
import TypingIndicator from '../components/TypingIndicator';

function ChatBox({ projectId }) {
  return (
    <div>
      {/* Shows "User is typing..." with animated dots */}
      <TypingIndicator roomId={projectId} />
    </div>
  );
}
```

### 3. **ChatRoom Component** (Complete Example)
```jsx
import ChatRoom from '../components/ChatRoom';

function ProjectPage({ projectId }) {
  return (
    <ChatRoom 
      roomId={projectId} 
      roomName="Project Alpha Chat" 
    />
  );
}
```

---

## 🧪 Testing Your Integration

### Test 1: Verify Socket Connection
1. Open browser DevTools → Console
2. Look for: `🔌 Initializing socket connection...`
3. Then: `✅ Socket connected: Welcome to ColabCampus!`

### Test 2: Online Users
1. Open app in **Browser 1** (normal window)
2. Open app in **Browser 2** (incognito)
3. Login with different users
4. Both should see "2 users online"

### Test 3: Typing Indicators
1. Both users join the same project chat
2. **User A** starts typing
3. **User B** should see "User A is typing..."
4. After 2 seconds of inactivity, indicator disappears

### Test 4: Real-time Messaging
1. **User A** sends a message
2. **User B** receives it instantly (no refresh)
3. Check console for `💬 New message received`

---

## 🐛 Troubleshooting

### Problem: "Socket is null"
**Solution:** Make sure you're using `SocketProvider` at the top level of your app.

```jsx
// ❌ Wrong
function App() {
  return <MyComponent />;
}

// ✅ Correct
function App() {
  return (
    <SocketProvider>
      <MyComponent />
    </SocketProvider>
  );
}
```

---

### Problem: "useSocket must be used within a SocketProvider"
**Solution:** Wrap your component tree with `SocketProvider`.

---

### Problem: Not receiving online users updates
**Solution:**
1. Check if token exists: `localStorage.getItem('token')`
2. Token must NOT be 'mock-token'
3. Check browser console for connection errors

---

### Problem: Typing indicator not working
**Solution:**
1. Make sure you've joined the room first: `socket.emit('join_project', roomId)`
2. Use `useTypingIndicator` hook for automatic handling
3. Check `typingUsers` state in console

---

## 📚 Complete Example: Mini Chat App

```jsx
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import TypingIndicator from '../components/TypingIndicator';
import OnlineUsers from '../components/OnlineUsers';

function MiniChat({ projectId }) {
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const handleTyping = useTypingIndicator(projectId);
  
  // Join room and listen for messages
  useEffect(() => {
    if (!socket) return;
    
    socket.emit('join_project', projectId);
    
    socket.on('chat_history', (msgs) => setMessages(msgs));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    
    return () => {
      socket.emit('leave_project', projectId);
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, [socket, projectId]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    socket.emit('send_message', { projectId, message: input });
    setInput('');
  };
  
  return (
    <div className="flex h-screen">
      {/* Chat */}
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-4">Project Chat</h1>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className="bg-gray-100 p-3 rounded">
              <strong>{msg.user?.userName}:</strong> {msg.message}
            </div>
          ))}
        </div>
        
        {/* Typing Indicator */}
        <TypingIndicator roomId={projectId} />
        
        {/* Input */}
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 border px-4 py-2 rounded"
          />
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </form>
      </div>
      
      {/* Sidebar */}
      <div className="w-64 border-l p-4">
        <OnlineUsers />
      </div>
    </div>
  );
}

export default MiniChat;
```

---

## 🎯 Next Steps

1. ✅ Socket.io client is already installed
2. ✅ SocketProvider is set up
3. ✅ Components are ready (OnlineUsers, TypingIndicator)
4. ✅ Hooks are available (useSocket, useTypingIndicator)

**You can now:**
- Import `ChatRoom` component for a complete chat UI
- Use `useSocket()` hook in any component
- Add typing indicators with one line: `handleTyping()`
- Display online users with `<OnlineUsers />`

**Test it:**
```bash
cd client
npm start
```

Open two browser windows and watch the magic happen! 🎉

---

## 📖 Related Files

- `client/src/SocketContext.jsx` - Socket provider
- `client/src/hooks/useSocket.js` - Socket hook
- `client/src/hooks/useTypingIndicator.js` - Typing hook
- `client/src/components/OnlineUsers.jsx` - Online users UI
- `client/src/components/TypingIndicator.jsx` - Typing UI
- `client/src/components/ChatRoom.jsx` - Complete chat example
- `server/server.js` - Socket.io server setup

---

## 🆘 Need Help?

Check the browser console for Socket.io logs:
- 🔌 Connection status
- 🟢 Online users updates
- ⌨️ Typing events
- 💬 Message events

All socket events are logged with emojis for easy debugging!
