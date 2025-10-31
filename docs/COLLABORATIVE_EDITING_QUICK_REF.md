# 📝 Collaborative Editing - Quick Reference

## 🚀 5-Minute Start Guide

### 1. Access the Editor
```
http://localhost:3000/project/{projectId}/document
```

### 2. Add Button to Your Project Page
```jsx
import { useNavigate } from 'react-router-dom';

function ProjectBoard() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  return (
    <button
      onClick={() => navigate(`/project/${projectId}/document`)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      📝 Edit Shared Document
    </button>
  );
}
```

---

## 🎯 Available Components

### Rich Text Editor (Recommended)
```jsx
import RichCollaborativeEditor from '../components/RichCollaborativeEditor';

<RichCollaborativeEditor 
  projectId="project-123" 
  projectName="My Project" 
/>
```

**Features:**
- Bold, italic, underline
- Headers, lists, quotes
- Images, links, videos
- Colors, alignment
- Full formatting toolbar

### Simple Text Editor
```jsx
import CollaborativeEditor from '../components/CollaborativeEditor';

<CollaborativeEditor 
  projectId="project-123" 
  projectName="My Project" 
/>
```

**Features:**
- Plain text only
- Lightweight
- Perfect for notes/code

---

## 🔌 Socket.io Events

### Emit (Client → Server)
```javascript
// Join document
socket.emit('join-document', projectId);

// Send changes to others
socket.emit('send-changes', { projectId, delta: content });

// Save to database
socket.emit('save-document', { projectId, content, title });

// Leave document
socket.emit('leave-document', projectId);
```

### Listen (Server → Client)
```javascript
// Load document content
socket.on('load-document', (data) => {
  // data: { content, title, version, lastUpdated }
});

// Receive changes from others
socket.on('receive-changes', ({ delta, userName }) => {
  // Apply changes to editor
});

// Save confirmation
socket.on('document-saved', ({ success, version }) => {
  // Show success message
});

// User joined/left
socket.on('user-joined-document', ({ userName, userId }) => {});
socket.on('user-left-document', ({ userName, userId }) => {});
```

---

## 🌐 REST API

### Get Document
```javascript
const response = await axios.get(
  `http://localhost:5000/api/documents/${projectId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Update Document
```javascript
const response = await axios.put(
  `http://localhost:5000/api/documents/${projectId}`,
  { title: 'New Title', content: 'Content...' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Delete Document
```javascript
const response = await axios.delete(
  `http://localhost:5000/api/documents/${projectId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 🧪 Testing Checklist

### Single User Test
- [ ] Navigate to document page
- [ ] Type some text
- [ ] Wait 2 seconds → "Saved" appears
- [ ] Refresh page → Content persists

### Multi-User Test
- [ ] Open in Chrome (User A)
- [ ] Open in Firefox (User B)
- [ ] Both navigate to same document URL
- [ ] User A types → User B sees instantly
- [ ] User B types → User A sees instantly
- [ ] Both see active user avatars
- [ ] Both can save independently

### Auto-Save Test
- [ ] Type text
- [ ] Stop typing
- [ ] After 2 seconds → "Saved" appears
- [ ] Version number increments

### Manual Save Test
- [ ] Type text
- [ ] Press Ctrl+S (or Cmd+S on Mac)
- [ ] "Saving..." appears
- [ ] Document saved immediately

---

## 💡 Common Patterns

### Pattern 1: Add to Project Menu
```jsx
function ProjectMenu({ projectId }) {
  const navigate = useNavigate();
  
  return (
    <nav>
      <button onClick={() => navigate(`/project/${projectId}`)}>
        Dashboard
      </button>
      <button onClick={() => navigate(`/project/${projectId}/document`)}>
        📝 Documents
      </button>
    </nav>
  );
}
```

### Pattern 2: Check if Document Exists
```jsx
useEffect(() => {
  const checkDocument = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasDocument(true);
    } catch (err) {
      setHasDocument(false);
    }
  };
  
  checkDocument();
}, [projectId]);
```

### Pattern 3: Custom Auto-Save Interval
```jsx
// In CollaborativeEditor.jsx, change this line:
setTimeout(() => handleSave(content), 2000); // Change 2000 to your preference
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Changes not syncing | Check socket connection: `console.log(socket?.id)` |
| Document not loading | Verify user is project member |
| Save not working | Check token: `localStorage.getItem('token')` |
| Quill not showing | Import CSS: `import 'react-quill/dist/quill.snow.css'` |

---

## 🎨 Customization

### Change Auto-Save Delay
```javascript
// In handleContentChange function
setTimeout(() => handleSave(content), 5000); // 5 seconds instead of 2
```

### Change Editor Height
```javascript
// In RichCollaborativeEditor.jsx
<ReactQuill
  style={{ height: 'calc(100vh - 200px)' }} // Adjust height
/>
```

### Customize Toolbar
```javascript
// In modules.toolbar array
const modules = {
  toolbar: [
    ['bold', 'italic'],        // Only basic formatting
    [{ list: 'bullet' }],      // Only bullet lists
    ['link']                   // Only links
  ]
};
```

---

## 📊 Data Flow

```
User Types
    ↓
Local State Updates (instant)
    ↓
emit('send-changes') → Socket.io Server
    ↓
Broadcast to all other users in room
    ↓
Other users receive & update (instant)
    ↓
After 2s inactivity
    ↓
emit('save-document') → Socket.io Server
    ↓
Save to MongoDB
    ↓
Confirm save to all users
```

---

## 🔐 Security Notes

- ✅ All routes require JWT authentication
- ✅ Project membership verified before access
- ✅ Socket.io uses auth middleware
- ✅ Only project owner can delete documents
- ✅ No sensitive data in socket events

---

## 🚀 Next Steps

1. **Test**: Open in 2 browsers and watch real-time sync
2. **Customize**: Adjust colors, fonts, toolbar
3. **Integrate**: Add document links to project pages
4. **Extend**: Add comments, version history, export

---

## 📖 Full Documentation

See `COLLABORATIVE_EDITING_COMPLETE.md` for:
- Complete API reference
- Advanced features
- Extension examples
- Deployment guide

---

## ✨ Key Features

- ✅ Real-time text synchronization
- ✅ Multiple users editing simultaneously  
- ✅ Auto-save every 2 seconds
- ✅ Manual save with Ctrl+S
- ✅ Active users display
- ✅ Version tracking
- ✅ Rich text formatting
- ✅ Images, links, videos
- ✅ Beautiful UI

**You're all set! Start editing collaboratively! 🎉**
