# 🚀 Conversation System - Quick Reference

## Socket.io Events Cheatsheet

### Client Emits (Send to Server)

```javascript
// Join a conversation (global or DM)
socket.emit('join_conversation', { 
  conversationId: '507f...' 
});

// Leave a conversation
socket.emit('leave_conversation', { 
  conversationId: '507f...' 
});

// Send a message
socket.emit('send_conversation_message', {
  conversationId: '507f...',
  content: 'Hello!'
});
```

### Client Listens (Receive from Server)

```javascript
// Confirmation of joining
socket.on('joined_conversation', ({ conversationId, type, participants }) => {
  // Successfully joined
});

// Receive message history (50 most recent)
socket.on('conversation_history', (messages) => {
  // Array of past messages
});

// Receive new message in real-time
socket.on('receive_conversation_message', (message) => {
  // message.content
  // message.sender.username
  // message.conversationId
  // message.createdAt
});

// User joined (DM only)
socket.on('user_joined_conversation', ({ user, userId, conversationId }) => {
  // Someone joined the DM
});

// User left
socket.on('user_left_conversation', ({ user, userId, conversationId }) => {
  // Someone left the conversation
});

// Errors
socket.on('error_message', ({ message }) => {
  // Error occurred
});
```

---

## REST API Cheatsheet

All endpoints require: `Authorization: Bearer <token>`

### Create Global Chat
```http
POST /api/conversations
{
  "type": "global",
  "name": "General Chat",
  "participants": []
}
```

### Create/Find DM
```http
POST /api/conversations/dm
{
  "participantIds": ["userId1", "userId2"]
}
```
Returns existing DM if found, creates new one if not.

### Get My Conversations
```http
GET /api/conversations
```
Returns all conversations user is part of + all global chats.

### Get Conversation Details
```http
GET /api/conversations/:conversationId
```

### Get Conversation Messages
```http
GET /api/conversations/:conversationId/messages?limit=50
```

### Delete Conversation
```http
DELETE /api/conversations/:conversationId
```
Deletes conversation and all messages (participant only).

---

## React Component Template

```jsx
import { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';

function MyConversation({ conversationId }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Join conversation
    socket.emit('join_conversation', { conversationId });

    // Listen for history
    socket.on('conversation_history', (history) => {
      setMessages(history);
    });

    // Listen for new messages
    socket.on('receive_conversation_message', (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    // Cleanup
    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('conversation_history');
      socket.off('receive_conversation_message');
    };
  }, [conversationId, socket]);

  const sendMessage = () => {
    socket.emit('send_conversation_message', {
      conversationId,
      content: input
    });
    setInput('');
  };

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg._id}>
            <strong>{msg.sender.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## Database Models

### Conversation
```javascript
{
  _id: ObjectId,
  type: "global" | "dm",
  participants: [ObjectId],  // User IDs
  name: String,              // Optional
  createdAt: Date,
  updatedAt: Date
}
```

### Message
```javascript
{
  _id: ObjectId,
  conversation: ObjectId,    // Conversation ref
  project: ObjectId,         // OR project ref (not both)
  sender: ObjectId,          // User ref (required)
  content: String,           // Max 2000 chars
  createdAt: Date,
  updatedAt: Date
}
```

---

## Common Patterns

### Initialize Global Chat (App.jsx)
```javascript
useEffect(() => {
  const init = async () => {
    try {
      await axios.post('/api/conversations', {
        type: 'global',
        name: 'General Chat'
      });
    } catch (err) {
      // Already exists, ignore
    }
  };
  init();
}, []);
```

### Start DM with User
```javascript
const startChat = async (userId) => {
  const res = await axios.post('/api/conversations/dm', {
    participantIds: [userId]
  });
  setActiveConversation(res.data);
};
```

### Get Conversation Name for Display
```javascript
const getName = (conversation, currentUserId) => {
  if (conversation.type === 'global') {
    return conversation.name || 'Global Chat';
  } else {
    const other = conversation.participants.find(
      p => p._id !== currentUserId
    );
    return other?.username || 'Unknown';
  }
};
```

---

## Testing Commands

```bash
# Run automated test suite
cd server
node test-conversations.js

# Expected output:
# ✅ Global chat created
# ✅ DM conversation created
# ✅ Messages sent and retrieved
# ✅ All tests passed

# Start server
npm start

# Server runs on port 5000
# MongoDB must be connected
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Conversation not found" | Check conversationId is valid ObjectId |
| "Access denied" | User not in participants (DM only) |
| "Must join conversation first" | Emit join_conversation before sending |
| Messages not appearing | Check socket.connected, verify listeners |
| Duplicate DMs | Use `/api/conversations/dm` endpoint |

---

## Security Checklist

- [x] JWT required for all endpoints
- [x] Socket authentication via handshake.auth
- [x] DM participant validation
- [x] Message length limit (2000 chars)
- [x] Room join verification before send
- [x] Error messages don't leak info

---

## Performance Tips

1. **Limit message history**: Default 50, paginate if needed
2. **Index queries**: Already indexed on conversation + createdAt
3. **Populate only needed fields**: username, email (not password)
4. **Use room isolation**: Socket.io rooms prevent message spam
5. **Cleanup listeners**: Prevent memory leaks on unmount

---

**Created:** October 29, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
