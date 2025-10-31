# Global Chat & Direct Messages Implementation Guide

## 🎯 Overview

This implementation adds support for:
- **Global Chat Rooms**: Public rooms where everyone can see messages
- **Direct Messages (DM)**: Private conversations between two or more users
- **Real-time Communication**: Using Socket.io for instant message delivery
- **Message Persistence**: All messages stored in MongoDB

---

## 📁 Files Created/Modified

### New Files Created:

#### Server Files:
1. **`server/models/conversation.js`** - Conversation model (global/dm)
2. **`server/controllers/conversationController.js`** - Conversation business logic
3. **`server/routes/conversationRoutes.js`** - REST API endpoints for conversations
4. **`server/test-conversations.js`** - Automated test script

#### Client Files:
1. **`client/src/components/ConversationList.jsx`** - List of conversations
2. **`client/src/components/ConversationChat.jsx`** - Chat interface

### Modified Files:
1. **`server/models/message.js`** - Added conversation reference
2. **`server/controllers/messageController.js`** - Added conversation message methods
3. **`server/server.js`** - Added conversation socket events and routes

---

## 🗄️ Database Models

### Conversation Model
```javascript
{
  type: "global" | "dm",           // Type of conversation
  participants: [ObjectId],         // User IDs (empty for global)
  name: String,                     // Optional name for global rooms
  timestamps: true                  // createdAt, updatedAt
}
```

**Indexes:**
- `{ participants: 1, type: 1 }` - Find user's conversations
- `{ type: 1, createdAt: -1 }` - List conversations by type

**Methods:**
- `hasParticipant(userId)` - Check if user is a participant

### Updated Message Model
```javascript
{
  project: ObjectId,                // Optional (for project chat)
  conversation: ObjectId,           // Optional (for global/dm)
  sender: ObjectId,                 // Required - User ID
  content: String,                  // Required - Message text (max 2000 chars)
  timestamps: true                  // createdAt, updatedAt
}
```

**Validation:**
- Message MUST belong to either a project OR a conversation (not both, not neither)

**Indexes:**
- `{ project: 1, createdAt: -1 }` - Project messages
- `{ conversation: 1, createdAt: -1 }` - Conversation messages

---

## 🔌 REST API Endpoints

All endpoints require JWT authentication (`Authorization: Bearer <token>`)

### Create Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "type": "global",
  "name": "General Chat",
  "participants": []  // Empty for global, [userId1, userId2] for DM
}
```

### Get User's Conversations
```http
GET /api/conversations
```
Returns all conversations where user is a participant OR all global conversations.

### Find or Create DM
```http
POST /api/conversations/dm
Content-Type: application/json

{
  "participantIds": ["userId1", "userId2"]
}
```
Returns existing DM if found, otherwise creates new one.

### Get Conversation by ID
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
Deletes conversation and all its messages (only if user is participant).

---

## 🔥 Socket.io Events

### Client → Server Events

#### 1. Join Conversation
```javascript
socket.emit('join_conversation', { 
  conversationId: '507f1f77bcf86cd799439011' 
});
```

**Server Responses:**
- `joined_conversation` - Confirmation with conversation details
- `conversation_history` - Array of past messages (50 most recent)
- `error_message` - If conversation not found or access denied

#### 2. Send Message
```javascript
socket.emit('send_conversation_message', {
  conversationId: '507f1f77bcf86cd799439011',
  content: 'Hello everyone!'
});
```

**Validation:**
- Content required, max 2000 characters
- User must be in conversation room
- For DM: User must be a participant

#### 3. Leave Conversation
```javascript
socket.emit('leave_conversation', { 
  conversationId: '507f1f77bcf86cd799439011' 
});
```

### Server → Client Events

#### 1. joined_conversation
```javascript
socket.on('joined_conversation', ({ conversationId, type, participants }) => {
  console.log('Joined conversation:', conversationId);
});
```

#### 2. conversation_history
```javascript
socket.on('conversation_history', (messages) => {
  // Array of message objects with sender populated
  messages.forEach(msg => {
    console.log(`${msg.sender.username}: ${msg.content}`);
  });
});
```

#### 3. receive_conversation_message
```javascript
socket.on('receive_conversation_message', (message) => {
  // New message received in real-time
  console.log('New message:', message.content);
  console.log('From:', message.sender.username);
  console.log('Conversation:', message.conversationId);
});
```

#### 4. user_joined_conversation (DM only)
```javascript
socket.on('user_joined_conversation', ({ user, userId, conversationId }) => {
  console.log(`${user} joined the conversation`);
});
```

#### 5. user_left_conversation
```javascript
socket.on('user_left_conversation', ({ user, userId, conversationId }) => {
  console.log(`${user} left the conversation`);
});
```

#### 6. error_message
```javascript
socket.on('error_message', ({ message }) => {
  console.error('Error:', message);
});
```

---

## 🧪 Testing

### Run Automated Tests
```bash
cd server
node test-conversations.js
```

**What it tests:**
1. ✅ Create global chat room
2. ✅ Send global messages
3. ✅ Create DM conversation
4. ✅ Send DM messages
5. ✅ Retrieve conversation history
6. ✅ Get user's conversations
7. ✅ Participant validation

**Expected Output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Found 3 users:
   1. alice (alice@example.com)
   2. bob (bob@example.com)
   3. charlie (charlie@example.com)

TEST 1: Creating Global Chat Room
=====================================
✅ Created global chat room
   ID: 507f1f77bcf86cd799439011
   Type: global
   Name: General Chat

... (more tests)

🎉 ALL TESTS PASSED!
```

### Manual Socket Testing

1. **Start the server:**
```bash
cd server
npm start
```

2. **Use the test IDs from automated test output**

3. **Test Global Chat:**
   - Open 2 browser tabs with different logged-in users
   - Both emit `join_conversation` with global chat ID
   - Send messages and verify both users see them

4. **Test DM:**
   - Join DM conversation in both tabs
   - Verify only participants can see messages
   - Try joining as third user (should be denied)

---

## 🎨 React Integration

### Example Usage

```javascript
// client/src/pages/Messages.jsx
import { useState } from 'react';
import { useSocket } from '../SocketContext';
import ConversationList from '../components/ConversationList';
import ConversationChat from '../components/ConversationChat';

function MessagesPage() {
  const { socket } = useSocket();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="flex h-screen">
      {/* Left sidebar - Conversation list */}
      <div className="w-1/3">
        <ConversationList
          onSelectConversation={setSelectedConversation}
          currentUserId={currentUser._id}
        />
      </div>

      {/* Right panel - Active conversation */}
      <div className="flex-1">
        <ConversationChat
          socket={socket}
          conversation={selectedConversation}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

export default MessagesPage;
```

### Creating a Global Chat on App Load

```javascript
// Create global chat if it doesn't exist
useEffect(() => {
  const initializeGlobalChat = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to create global chat (will fail if exists)
      await axios.post('http://localhost:5000/api/conversations', {
        type: 'global',
        name: 'General Chat',
        participants: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Ignore error if global chat already exists
      console.log('Global chat already initialized');
    }
  };

  initializeGlobalChat();
}, []);
```

### Starting a DM with a User

```javascript
const startDMWithUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post('http://localhost:5000/api/conversations/dm', {
      participantIds: [userId]  // Other user's ID
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // response.data contains the conversation (new or existing)
    setSelectedConversation(response.data);
  } catch (err) {
    console.error('Error creating DM:', err);
  }
};
```

---

## 🔒 Security Features

1. **JWT Authentication**: All REST endpoints and socket connections require valid JWT
2. **Participant Validation**: Users can only access DMs they're part of
3. **Message Length Limits**: Max 2000 characters per message
4. **Room Verification**: Must join conversation before sending messages
5. **Error Handling**: Comprehensive error messages for debugging

---

## 🚀 Key Features

### Global Chat
- ✅ Everyone can join
- ✅ No participant restrictions
- ✅ Named rooms (e.g., "General Chat")
- ✅ Perfect for announcements, general discussion

### Direct Messages
- ✅ Private conversations
- ✅ 2+ participants
- ✅ Find-or-create pattern (avoids duplicates)
- ✅ Participant-only access
- ✅ Real-time presence notifications

### Real-time Updates
- ✅ Instant message delivery via Socket.io
- ✅ Message history on join
- ✅ User join/leave notifications (DM only)
- ✅ Optimistic UI updates possible

### Message Persistence
- ✅ All messages stored in MongoDB
- ✅ Indexed for fast retrieval
- ✅ Timestamped automatically
- ✅ Sender information populated

---

## 📊 Architecture Flow

### Global Chat Flow
```
1. Client: GET /api/conversations → finds global chat
2. Client: socket.emit('join_conversation', { conversationId })
3. Server: Validates conversation exists
4. Server: Joins socket to room
5. Server: Sends conversation_history
6. Client: Displays messages
7. User types message
8. Client: socket.emit('send_conversation_message', { ... })
9. Server: Creates Message in DB
10. Server: io.to(conversationId).emit('receive_conversation_message')
11. All clients in room: Receive message instantly
```

### DM Creation Flow
```
1. User clicks "Message User"
2. Client: POST /api/conversations/dm { participantIds: [otherId] }
3. Server: Checks if DM exists with exact participants
4. Server: Returns existing OR creates new conversation
5. Client: Displays conversation
6. Client: socket.emit('join_conversation', { conversationId })
7. ... (same as global chat from step 3)
```

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: "Conversation not found"**
- Verify conversation ID is correct
- Check if conversation was deleted
- Ensure MongoDB is connected

**Issue: "Access denied to this conversation"**
- User is not a participant in DM
- Check participants array includes user ID

**Issue: "You must join the conversation first"**
- Socket hasn't joined room yet
- Wait for `joined_conversation` event before sending

**Issue: Messages not appearing**
- Check socket connection: `socket.connected`
- Verify event listeners are set up
- Check browser console for errors
- Ensure conversation ID matches

**Issue: Duplicate conversations**
- Use `POST /api/conversations/dm` endpoint (not `POST /api/conversations`)
- This endpoint checks for existing DMs first

---

## 🎓 Best Practices

1. **Always use find-or-create for DMs** to avoid duplicates
2. **Join conversation before sending** messages
3. **Clean up listeners** on component unmount
4. **Show loading states** while joining
5. **Handle socket disconnections** gracefully
6. **Validate input** before sending (length, empty check)
7. **Use optimistic UI** for better UX
8. **Display timestamps** for context
9. **Show sender names** in group chats
10. **Implement pagination** for message history

---

## 📝 Next Steps

### Recommended Enhancements:
1. **Typing Indicators**: Show when someone is typing
2. **Read Receipts**: Mark messages as read
3. **Message Reactions**: Emoji reactions to messages
4. **File Uploads**: Share images/documents
5. **Message Search**: Search within conversations
6. **Notifications**: Desktop/push notifications
7. **User Status**: Online/offline indicators
8. **Message Editing**: Edit sent messages
9. **Message Deletion**: Delete messages
10. **Group DMs**: More than 2 participants

---

## ✅ Completion Checklist

- [x] Conversation model created
- [x] Message model updated
- [x] REST API endpoints implemented
- [x] Socket.io events added
- [x] Conversation controller created
- [x] Routes registered
- [x] Test script created
- [x] React components created
- [x] Documentation completed
- [ ] End-to-end testing
- [ ] Deploy to production

---

## 📚 Reference

### Key Functions

**conversationController.js:**
- `createConversation()` - Create new conversation
- `getConversations()` - Get user's conversations
- `getConversationMessages()` - Get messages
- `findOrCreateDM()` - Find or create DM
- `getConversationById()` - Get conversation details
- `deleteConversation()` - Delete conversation

**messageController.js:**
- `createMessage()` - Create project message
- `createConversationMessage()` - Create conversation message
- `getProjectMessages()` - Get project messages
- `getConversationMessages()` - Get conversation messages

### Socket Events Summary

**Client → Server:**
- `join_conversation`
- `leave_conversation`
- `send_conversation_message`

**Server → Client:**
- `joined_conversation`
- `conversation_history`
- `receive_conversation_message`
- `user_joined_conversation`
- `user_left_conversation`
- `error_message`

---

**Implementation Date:** October 29, 2025  
**Status:** ✅ Complete and ready for testing
